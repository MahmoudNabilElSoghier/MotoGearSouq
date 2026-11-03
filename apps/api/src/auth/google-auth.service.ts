import { Inject, Injectable, BadRequestException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "./jwt.service";

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);

  constructor(
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwt: JwtService,
  ) {}

  getAuthUrl(redirectUri: string, state: string): string {
    const clientId = this.config.get<string>("GOOGLE_CLIENT_ID");
    if (!clientId) throw new BadRequestException("Google OAuth not configured");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<{ access_token: string; id_token: string }> {
    const clientId = this.config.get<string>("GOOGLE_CLIENT_ID");
    const clientSecret = this.config.get<string>("GOOGLE_CLIENT_SECRET");
    if (!clientId || !clientSecret) throw new BadRequestException("Google OAuth not configured");

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      this.logger.error(`Google token exchange failed: ${errorBody}`);
      throw new BadRequestException("فشل التحقق من Google");
    }

    return (await res.json()) as { access_token: string; id_token: string };
  }

  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new BadRequestException("فشل جلب بيانات Google");
    }

    return (await res.json()) as GoogleUserInfo;
  }

  async findOrCreateCustomer(googleUser: GoogleUserInfo): Promise<{
    customer: Record<string, unknown>;
    accessToken: string;
  }> {
    let customer = await this.prisma.get().customer.findUnique({
      where: { googleId: googleUser.sub },
    });

    if (!customer && googleUser.email) {
      customer = await this.prisma.get().customer.findUnique({
        where: { email: googleUser.email.toLowerCase() },
      });

      if (customer) {
        customer = await this.prisma.get().customer.update({
          where: { id: customer.id },
          data: {
            googleId: googleUser.sub,
            avatarUrl: customer.avatarUrl || googleUser.picture || null,
            emailVerified: true,
          },
        });
      }
    }

    if (!customer) {
      throw new BadRequestException(
        "لا يوجد حساب مرتبط بهذا البريد الإلكتروني. يرجى التسجيل برقم الموبايل أولاً."
      );
    }

    if (!customer.isActive) {
      throw new BadRequestException("الحساب موقوف");
    }
    if (customer.blockedAt) {
      throw new BadRequestException("الحساب محظور — تواصل مع الإدارة");
    }
    if (customer.approvalStatus !== "approved") {
      throw new BadRequestException("حسابك قيد المراجعة");
    }

    const accessTtl = process.env.JWT_ACCESS_TTL || "15m";
    const accessToken = this.jwt.sign(
      {
        sub: customer.id,
        phone: customer.phone,
        email: customer.email,
        name: customer.name,
        role: "customer",
        customerType: customer.customerType,
        approvalStatus: customer.approvalStatus,
      },
      accessTtl,
    );

    return { customer: customer as unknown as Record<string, unknown>, accessToken };
  }
}
