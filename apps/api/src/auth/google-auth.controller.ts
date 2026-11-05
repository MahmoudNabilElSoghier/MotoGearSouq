import { Controller, Get, Inject, Query, Res, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { GoogleAuthService } from "./google-auth.service";
import { CustomerAuthService } from "./customer-auth.service";

@ApiTags("google-auth")
@Controller("auth/customer/google")
export class GoogleAuthController {
  constructor(
    @Inject(GoogleAuthService) private readonly googleAuth: GoogleAuthService,
    @Inject(CustomerAuthService) private readonly customerAuth: CustomerAuthService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  private validateRedirectUri(uri: string): void {
    const allowed = [
      "http://localhost:3000",
      "https://motogearsouq.vercel.app",
      "https://motogearsouq.com",
    ];
    const isValid = allowed.some((origin) => uri.startsWith(origin) && uri.endsWith("/api/auth/customer/google/callback"));
    if (!isValid) {
      throw new BadRequestException("Invalid redirect_uri");
    }
  }

  private setRefreshCookie(res: Response, rawRefreshToken: string): void {
    const refreshTtlSeconds = 7 * 24 * 60 * 60;
    const isProd = this.config.get<string>("NODE_ENV") === "production";
    res.cookie("mgs_rt", rawRefreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: refreshTtlSeconds * 1000,
    });
  }

  @Get("start")
  @ApiOperation({ summary: "Get Google OAuth authorization URL" })
  async start(@Query("redirect_uri") redirectUri: string, @Query("state") state?: string) {
    if (!redirectUri) throw new BadRequestException("redirect_uri is required");
    this.validateRedirectUri(redirectUri);

    const csrfState = state || Math.random().toString(36).substring(2);
    const authUrl = this.googleAuth.getAuthUrl(redirectUri, csrfState);
    return { data: { authUrl, state: csrfState }, isMock: false };
  }

  @Get("callback")
  @ApiOperation({ summary: "Google OAuth callback handler" })
  async callback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Query("redirect_uri") redirectUriQuery: string,
    @Res() res: Response,
  ) {
    const frontendUrl = this.config.get<string>("FRONTEND_URL") || "http://localhost:3000";
    // Google appends only code/state to the callback — it does NOT echo
    // redirect_uri back. Reconstruct the canonical callback URL (must exactly
    // match the redirect_uri used in the authorization request).
    const redirectUri = redirectUriQuery || `${frontendUrl}/api/auth/customer/google/callback`;
    try {
      if (!code) {
        throw new BadRequestException("Missing code");
      }
      this.validateRedirectUri(redirectUri);

      const tokens = await this.googleAuth.exchangeCode(code, redirectUri);
      const userInfo = await this.googleAuth.getUserInfo(tokens.access_token);
      const { customer, accessToken } = await this.googleAuth.findOrCreateCustomer(userInfo);
      const refreshToken = await this.customerAuth.issueRefreshToken(customer.id as string);

      this.setRefreshCookie(res, refreshToken);

      return res.redirect(`${frontendUrl}/login?google=success&token=${accessToken}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "فشل تسجيل الدخول بـ Google";
      return res.redirect(`${frontendUrl}/login?google=error&msg=${encodeURIComponent(msg)}`);
    }
  }
}
