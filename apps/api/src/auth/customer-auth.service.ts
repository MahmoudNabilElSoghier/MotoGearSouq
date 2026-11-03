import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import * as crypto from "node:crypto";
import { fromPrismaOrder } from "@motogearsouq/shared";
import type {
  CreateRetailCustomerInput,
  CreateWholesaleCustomerInput,
  CustomerLoginInput,
} from "@motogearsouq/shared";
import { PrismaService } from "../prisma/prisma.service";
import { toDomainError } from "../common/prisma-errors";
import { hashPassword, verifyPassword } from "../common/crypto/password";
import { JwtService } from "./jwt.service";
import { RateLimitService } from "./rate-limit.service";

const EGYPT_PHONE_REGEX = /^01[0125][0-9]{8}$/;

export interface PublicCustomer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  customerType: string;
  approvalStatus: string;
  successfulDeliveries: number;
}

@Injectable()
export class CustomerAuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(RateLimitService) private readonly rateLimit: RateLimitService,
  ) {}

  public async registerRetail(
    input: CreateRetailCustomerInput,
  ): Promise<{ customer: PublicCustomer; accessToken: string; refreshToken: string }> {
    const phone = input.phone.trim();
    if (!EGYPT_PHONE_REGEX.test(phone)) {
      throw new BadRequestException("رقم موبايل مصري غير صحيح");
    }

    const email = input.email?.trim().toLowerCase() || null;
    if (email) {
      const existingEmail = await this.prisma.get().customer.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
      });
      if (existingEmail) {
        throw new ConflictException("البريد الإلكتروني مستخدم بالفعل");
      }
      // TODO(sprint-6): send verification email via Resend
    }

    const existing = await this.prisma.get().customer.findUnique({ where: { phone } });
    if (existing) {
      throw new ConflictException("رقم الموبايل مسجل بالفعل");
    }

    let created;
    try {
      created = await this.prisma.get().customer.create({
        data: {
          code: await this.nextCode(),
          name: input.name.trim(),
          phone,
          email,
          passwordHash: hashPassword(input.password),
          approvalStatus: "approved",
          customerType: "retail",
          isActive: true,
        },
      });
    } catch (error) {
      toDomainError(error); // phone/code/email unique race → 409
    }

    console.log("[customer-auth] new retail customer:", phone);

    const { accessToken, refreshToken } = await this.issueTokens(created.id, {
      phone: created.phone,
      name: created.name,
      customerType: created.customerType,
      approvalStatus: created.approvalStatus,
    });

    return {
      customer: {
        id: created.id,
        name: created.name,
        phone: created.phone,
        email: created.email,
        customerType: created.customerType,
        approvalStatus: created.approvalStatus,
        successfulDeliveries: created.successfulDeliveries,
      },
      accessToken,
      refreshToken,
    };
  }

  public async registerWholesale(
    input: CreateWholesaleCustomerInput,
  ): Promise<{ customer: PublicCustomer; message: string }> {
    const phone = input.phone.trim();
    if (!EGYPT_PHONE_REGEX.test(phone)) {
      throw new BadRequestException("رقم موبايل مصري غير صحيح");
    }
    if (!input.businessName?.trim() || !input.taxNumber?.trim() || !input.commercialRegister?.trim()) {
      throw new BadRequestException("بيانات النشاط التجاري غير مكتملة");
    }

    const email = input.email?.trim().toLowerCase() || null;
    if (email) {
      const existingEmail = await this.prisma.get().customer.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
      });
      if (existingEmail) {
        throw new ConflictException("البريد الإلكتروني مستخدم بالفعل");
      }
      // TODO(sprint-6): send verification email via Resend
    }

    const existing = await this.prisma.get().customer.findUnique({ where: { phone } });
    if (existing) {
      throw new ConflictException("رقم الموبايل مسجل بالفعل");
    }

    let created;
    try {
      created = await this.prisma.get().customer.create({
        data: {
          code: await this.nextCode(),
          name: input.name.trim(),
          phone,
          email,
          passwordHash: hashPassword(input.password),
          approvalStatus: "pending",
          customerType: "wholesale",
          businessName: input.businessName.trim(),
          taxNumber: input.taxNumber.trim(),
          commercialRegister: input.commercialRegister.trim(),
          isActive: true,
        },
      });
    } catch (error) {
      toDomainError(error);
    }

    console.log("[customer-auth] new wholesale application:", phone, created.businessName);

    return {
      customer: {
        id: created.id,
        name: created.name,
        phone: created.phone,
        email: created.email,
        customerType: created.customerType,
        approvalStatus: created.approvalStatus,
        successfulDeliveries: created.successfulDeliveries,
      },
      message: "قيد المراجعة — سيتم إبلاغك عند الموافقة",
    };
  }

  public async login(
    input: CustomerLoginInput,
    ip?: string,
    userAgent?: string,
  ): Promise<{ customer: PublicCustomer; accessToken: string; refreshToken: string }> {
    // identifier = phone OR email (falls back to legacy `phone` field)
    const identifier = (input.identifier ?? input.phone ?? "").trim();
    if (!identifier) {
      throw new BadRequestException("رقم الموبايل أو البريد الإلكتروني مطلوب");
    }
    const isEmail = identifier.includes("@");
    const lookup = isEmail ? identifier.toLowerCase() : identifier;

    // Rate limit BEFORE password verification (5 fails / 5 min / identifier)
    if (this.rateLimit.isRateLimited(lookup)) {
      this.logFailedLogin(lookup, ip, userAgent, "rate_limited");
      throw new HttpException(
        { message: "Too many failed login attempts. Please try again later.", error: "Too Many Requests" },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const customer = isEmail
      ? await this.prisma.get().customer.findFirst({
          where: { email: { equals: lookup, mode: "insensitive" } },
        })
      : await this.prisma.get().customer.findUnique({ where: { phone: lookup } });
    if (!customer) {
      this.rateLimit.recordFailure(lookup);
      this.logFailedLogin(lookup, ip, userAgent, "no_customer");
      throw new UnauthorizedException("بيانات غير صحيحة");
    }

    if (!customer.passwordHash) {
      this.rateLimit.recordFailure(lookup);
      this.logFailedLogin(lookup, ip, userAgent, "no_password");
      throw new UnauthorizedException("بيانات غير صحيحة");
    }

    if (!customer.isActive) {
      this.logFailedLogin(lookup, ip, userAgent, "inactive");
      throw new ForbiddenException("الحساب موقوف");
    }

    if (customer.approvalStatus === "pending") {
      this.logFailedLogin(lookup, ip, userAgent, "pending");
      throw new ForbiddenException("حسابك قيد المراجعة — سيتم تفعيله قريباً");
    }

    if (customer.approvalStatus === "rejected") {
      this.logFailedLogin(lookup, ip, userAgent, "rejected");
      throw new ForbiddenException("تم رفض طلبك — تواصل معنا");
    }

    if (!verifyPassword(input.password, customer.passwordHash)) {
      this.rateLimit.recordFailure(lookup);
      this.logFailedLogin(lookup, ip, userAgent, "bad_password");
      throw new UnauthorizedException("بيانات غير صحيحة");
    }

    this.rateLimit.reset(lookup);

    const { accessToken, refreshToken } = await this.issueTokens(customer.id, {
      phone: customer.phone,
      name: customer.name,
      customerType: customer.customerType,
      approvalStatus: customer.approvalStatus,
    });

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        customerType: customer.customerType,
        approvalStatus: customer.approvalStatus,
        successfulDeliveries: customer.successfulDeliveries,
      },
      accessToken,
      refreshToken,
    };
  }

  public async me(customerId: string): Promise<{
    id: string;
    name: string;
    phone: string;
    email: string | null;
    customerType: string;
    approvalStatus: string;
    isActive: boolean;
    successfulDeliveries: number;
    address: string | null;
    governorate: string | null;
  }> {
    const customer = await this.prisma.get().customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        customerType: true,
        approvalStatus: true,
        isActive: true,
        successfulDeliveries: true,
        address: true,
        governorate: true,
      },
    });
    if (!customer) {
      throw new UnauthorizedException("Customer not found");
    }
    if (!customer.isActive) {
      throw new ForbiddenException("الحساب موقوف");
    }
    return customer;
  }

  public async getOrders(customerId: string): Promise<{ data: unknown[]; isMock: false }> {
    const customer = await this.prisma.get().customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException();
    }

    // Match by phone: guest checkout orders were created with the same phone.
    const orders = await this.prisma.get().order.findMany({
      where: {
        customer: { phone: customer.phone },
        deletedAt: null,
      },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    return { data: orders.map(fromPrismaOrder), isMock: false };
  }

  // Opaque refresh token (same shape as admin) — stored hashed, rotated on use.
  public async issueRefreshToken(
    customerId: string,
    familyId?: string,
  ): Promise<string> {
    const refreshTtlStr = process.env.JWT_REFRESH_TTL || "7d";
    const refreshTtlSeconds = this.jwt.parseTtl(refreshTtlStr);

    const raw = crypto.randomBytes(32).toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");

    await this.prisma.get().refreshToken.create({
      data: {
        customerId,
        familyId: familyId || crypto.randomUUID(),
        tokenHash,
        expiresAt: new Date(Date.now() + refreshTtlSeconds * 1000),
      },
    });

    return raw;
  }

  private async issueTokens(
    customerId: string,
    claims: { phone: string; name: string; customerType: string; approvalStatus: string },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessTtl = process.env.JWT_ACCESS_TTL || "15m";
    const accessToken = this.jwt.sign(
      {
        sub: customerId,
        phone: claims.phone,
        name: claims.name,
        role: "customer",
        customerType: claims.customerType,
        approvalStatus: claims.approvalStatus,
      },
      accessTtl,
    );
    const refreshToken = await this.issueRefreshToken(customerId);
    return { accessToken, refreshToken };
  }

  private async nextCode(): Promise<string> {
    const count = await this.prisma.get().customer.count();
    return `CUS-${String(count + 1).padStart(5, "0")}`;
  }

  private logFailedLogin(
    phone: string,
    ip?: string,
    userAgent?: string,
    reason?: "bad_password" | "no_customer" | "no_password" | "inactive" | "pending" | "rejected" | "rate_limited",
  ): void {
    console.warn(
      "[customer-auth] failed login",
      JSON.stringify({
        phone,
        ip: ip || "unknown",
        userAgent: userAgent || "unknown",
        reason: reason || "bad_password",
      }),
    );
  }
}
