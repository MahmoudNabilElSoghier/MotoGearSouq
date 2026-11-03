import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import * as crypto from "node:crypto";
import type { Request } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtService } from "../../auth/jwt.service";

interface CustomerUser {
  sub: string;
  phone: string;
  name: string;
  customerType: string;
  approvalStatus: string;
}

function readCookie(req: Request, name: string): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  for (const cookie of cookieHeader.split(";")) {
    const [cookieName, ...rest] = cookie.trim().split("=");
    if (cookieName === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return undefined;
}

// Customer-only auth: accepts Bearer access token OR mgs_rt refresh cookie
// (browser flows). Admin tokens/cookies are rejected (role must be "customer"),
// and non-approved/inactive customers get 403.
@Injectable()
export class CustomerAuthGuard implements CanActivate {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: unknown }>();

    const customerId = await this.resolveCustomerId(request);
    if (!customerId) {
      throw new UnauthorizedException("Authentication required");
    }

    const customer = await this.prisma.get().customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        phone: true,
        name: true,
        customerType: true,
        approvalStatus: true,
        isActive: true,
        blockedAt: true,
      },
    });
    if (!customer) {
      throw new UnauthorizedException("Customer not found");
    }
    if (customer.approvalStatus !== "approved") {
      throw new ForbiddenException("حسابك غير مفعل");
    }
    if (!customer.isActive) {
      throw new ForbiddenException("الحساب موقوف");
    }
    if (customer.blockedAt) {
      throw new ForbiddenException("تم إيقاف الحساب — تواصل مع الإدارة");
    }

    const user: CustomerUser = {
      sub: customer.id,
      phone: customer.phone,
      name: customer.name,
      customerType: customer.customerType,
      approvalStatus: customer.approvalStatus,
    };
    request.user = user;
    return true;
  }

  private async resolveCustomerId(request: Request): Promise<string | null> {
    const authHeader = request.headers["authorization"];
    if (authHeader && typeof authHeader === "string") {
      const [type, token] = authHeader.split(" ");
      if (type !== "Bearer" || !token) {
        throw new UnauthorizedException("Invalid Authorization header format (expected Bearer <token>)");
      }
      let payload;
      try {
        payload = this.jwtService.verify(token);
      } catch (error) {
        throw new UnauthorizedException(
          `Invalid or expired token: ${error instanceof Error ? error.message : "unknown"}`,
        );
      }
      if (payload.role !== "customer") {
        throw new UnauthorizedException("role must be customer");
      }
      return payload.sub;
    }

    // Browser flow: unrotated, unrevoked, unexpired mgs_rt session cookie.
    const rawRefreshToken = readCookie(request, "mgs_rt");
    if (!rawRefreshToken) return null;
    const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");
    const stored = await this.prisma.get().refreshToken.findUnique({
      where: { tokenHash },
      select: {
        customerId: true,
        revokedAt: true,
        expiresAt: true,
      },
    });
    if (!stored || !stored.customerId || stored.revokedAt !== null || stored.expiresAt < new Date()) {
      return null; // admin cookie (no customerId) or dead token → treated as unauthenticated
    }
    return stored.customerId;
  }
}
