import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { verifyPassword } from "../common/crypto/password";
import { JwtService } from "./jwt.service";
import { RateLimitService } from "./rate-limit.service";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(RateLimitService) private readonly rateLimit: RateLimitService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  public async login(
    email: string,
    pass: string,
    ip?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: { id: string; email: string; role: string } }> {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Rate limit check BEFORE password verification
    if (this.rateLimit.isRateLimited(normalizedEmail)) {
      this.logFailedLogin(normalizedEmail, ip, userAgent, "rate_limited");
      throw new HttpException(
        { message: "Too many failed login attempts. Please try again later.", error: "Too Many Requests" },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 2. Find user
    const user = await this.prisma.get().user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      this.rateLimit.recordFailure(normalizedEmail);
      this.logFailedLogin(normalizedEmail, ip, userAgent, "no_user");
      throw new UnauthorizedException("Invalid email or password");
    }

    if (!user.active) {
      this.rateLimit.recordFailure(normalizedEmail);
      this.logFailedLogin(normalizedEmail, ip, userAgent, "inactive");
      throw new UnauthorizedException("User account is inactive");
    }

    // 3. Verify password
    const isValidPassword = verifyPassword(pass, user.passwordHash);
    if (!isValidPassword) {
      this.rateLimit.recordFailure(normalizedEmail);
      this.logFailedLogin(normalizedEmail, ip, userAgent, "bad_password");
      throw new UnauthorizedException("Invalid email or password");
    }

    // 4. Successful login -> reset rate limit
    this.rateLimit.reset(normalizedEmail);

    // 5. Generate tokens
    const accessTtl = process.env.JWT_ACCESS_TTL || "15m";
    const refreshTtlStr = process.env.JWT_REFRESH_TTL || "7d";
    const refreshTtlSeconds = this.jwt.parseTtl(refreshTtlStr);

    const accessToken = this.jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      accessTtl,
    );

    const rawRefreshToken = crypto.randomBytes(32).toString("base64url");
    const familyId = crypto.randomUUID();
    const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");
    const expiresAt = new Date(Date.now() + refreshTtlSeconds * 1000);

    await this.prisma.get().refreshToken.create({
      data: {
        userId: user.id,
        familyId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  public async refresh(rawRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException("Refresh token missing");
    }

    const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");

    const storedToken = await this.prisma.get().refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true, customer: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Check if already revoked -> REUSE DETECTED
    if (storedToken.revokedAt !== null) {
      this.logger.warn(
        `[auth] refresh token reuse detected for family ${storedToken.familyId} (user ${storedToken.userId ?? storedToken.customerId})`,
      );
      await this.prisma.get().refreshToken.updateMany({
        where: { familyId: storedToken.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException("Refresh token reuse detected — session revoked");
    }

    // Check expiration
    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token expired");
    }

    const accessTtl = process.env.JWT_ACCESS_TTL || "15m";
    const refreshTtlStr = process.env.JWT_REFRESH_TTL || "7d";
    const refreshTtlSeconds = this.jwt.parseTtl(refreshTtlStr);

    // ---- Customer session (B2C auth) — same rotation, customer payload ----
    if (storedToken.customerId) {
      const customer = storedToken.customer;
      if (!customer || !customer.isActive) {
        throw new UnauthorizedException("Customer account is inactive");
      }
      if (customer.blockedAt) {
        throw new UnauthorizedException("Customer account is blocked");
      }
      if (customer.approvalStatus !== "approved") {
        throw new UnauthorizedException("Customer account is not approved");
      }

      await this.prisma.get().refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });

      const newRawRefreshToken = crypto.randomBytes(32).toString("base64url");
      const newTokenHash = crypto.createHash("sha256").update(newRawRefreshToken).digest("hex");
      await this.prisma.get().refreshToken.create({
        data: {
          customerId: storedToken.customerId,
          familyId: storedToken.familyId,
          tokenHash: newTokenHash,
          expiresAt: new Date(Date.now() + refreshTtlSeconds * 1000),
        },
      });

      const accessToken = this.jwt.sign(
        {
          sub: customer.id,
          phone: customer.phone,
          name: customer.name,
          role: "customer",
          customerType: customer.customerType,
          approvalStatus: customer.approvalStatus,
        },
        accessTtl,
      );
      return { accessToken, refreshToken: newRawRefreshToken };
    }

    // ---- Admin/employee session (unchanged rotation) ----
    const user = storedToken.user;
    if (!user) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Check user active
    if (!user.active) {
      throw new UnauthorizedException("User account is inactive");
    }

    // Revoke current token
    await this.prisma.get().refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Create successor in same family
    const newRawRefreshToken = crypto.randomBytes(32).toString("base64url");
    const newTokenHash = crypto.createHash("sha256").update(newRawRefreshToken).digest("hex");
    const newExpiresAt = new Date(Date.now() + refreshTtlSeconds * 1000);

    await this.prisma.get().refreshToken.create({
      data: {
        userId: storedToken.userId,
        familyId: storedToken.familyId,
        tokenHash: newTokenHash,
        expiresAt: newExpiresAt,
      },
    });

    const accessToken = this.jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      accessTtl,
    );

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
    };
  }

  public async logout(rawRefreshToken?: string): Promise<void> {
    if (!rawRefreshToken) return;
    const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");
    try {
      await this.prisma.get().refreshToken.update({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Token may not exist or already revoked — idempotent logout
    }
  }

  public async getMe(userId: string) {
    const user = await this.prisma.get().user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, active: true, createdAt: true },
    });
    if (!user || !user.active) {
      throw new UnauthorizedException("User not found or inactive");
    }
    return user;
  }

  private logFailedLogin(
    email: string,
    ip?: string,
    userAgent?: string,
    reason?: "bad_password" | "no_user" | "inactive" | "rate_limited",
  ): void {
    console.warn(
      "[auth] failed login",
      JSON.stringify({
        email,
        ip: ip || "unknown",
        userAgent: userAgent || "unknown",
        reason: reason || "bad_password",
      }),
    );
  }
}
