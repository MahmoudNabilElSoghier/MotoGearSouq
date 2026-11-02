import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import {
  createRetailCustomerSchema,
  createWholesaleCustomerSchema,
  customerLoginSchema,
  type CreateRetailCustomerInput,
  type CreateWholesaleCustomerInput,
  type CustomerLoginInput,
} from "@motogearsouq/shared";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { CustomerAuthGuard } from "../common/guards/customer-auth.guard";
import { AuthService } from "./auth.service";
import { CustomerAuthService } from "./customer-auth.service";
import { JwtService } from "./jwt.service";

const REGISTRATION_LIMIT = 3;
const REGISTRATION_WINDOW_MS = 60 * 60 * 1000; // 1 hour / IP

interface IpWindow {
  count: number;
  resetAt: number;
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

@ApiTags("customer-auth")
@Controller("auth/customer")
export class CustomerAuthController {
  private readonly registrationWindows = new Map<string, IpWindow>();

  constructor(
    @Inject(CustomerAuthService) private readonly customerAuth: CustomerAuthService,
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  private checkKeys(): void {
    if (!this.jwtService.areKeysLoaded()) {
      throw new ServiceUnavailableException("Authentication service unavailable: JWT keys not configured");
    }
  }

  // 3 registrations / hour / IP (spam protection on the public endpoints).
  private checkRegistrationLimit(ip: string): void {
    const now = Date.now();
    const entry = this.registrationWindows.get(ip);
    if (!entry || now > entry.resetAt) {
      this.registrationWindows.set(ip, { count: 1, resetAt: now + REGISTRATION_WINDOW_MS });
      return;
    }
    entry.count += 1;
    if (entry.count > REGISTRATION_LIMIT) {
      throw new HttpException(
        { message: "Too many registration attempts. Please try again later.", error: "Too Many Requests" },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private setRefreshCookie(res: Response, rawRefreshToken: string): void {
    const refreshTtlStr = this.config.get<string>("JWT_REFRESH_TTL", "7d");
    const refreshTtlSeconds = this.jwtService.parseTtl(refreshTtlStr);
    const isProd = this.config.get<string>("NODE_ENV") === "production";
    res.cookie("mgs_rt", rawRefreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: refreshTtlSeconds * 1000,
    });
  }

  @Post("register")
  @ApiOperation({ summary: "B2C retail registration (instant, approved)" })
  async register(
    @Body(new ZodValidationPipe(createRetailCustomerSchema)) body: CreateRetailCustomerInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.checkKeys();
    this.checkRegistrationLimit(req.ip || "unknown");

    const result = await this.customerAuth.registerRetail(body);
    this.setRefreshCookie(res, result.refreshToken);

    return {
      data: {
        customer: result.customer,
        accessToken: result.accessToken,
      },
      isMock: false,
    };
  }

  @Post("register-wholesale")
  @ApiOperation({ summary: "B2B wholesale registration (pending admin approval)" })
  async registerWholesale(
    @Body(new ZodValidationPipe(createWholesaleCustomerSchema)) body: CreateWholesaleCustomerInput,
    @Req() req: Request,
  ) {
    this.checkRegistrationLimit(req.ip || "unknown");

    const result = await this.customerAuth.registerWholesale(body);

    return {
      data: {
        customer: result.customer,
        message: result.message,
      },
      isMock: false,
    };
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Customer login (phone + password)" })
  async login(
    @Body(new ZodValidationPipe(customerLoginSchema)) body: CustomerLoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.checkKeys();

    const result = await this.customerAuth.login(
      body,
      req.ip || req.socket.remoteAddress,
      req.headers["user-agent"],
    );
    this.setRefreshCookie(res, result.refreshToken);

    return {
      data: {
        customer: result.customer,
        accessToken: result.accessToken,
      },
      isMock: false,
    };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Customer logout (revokes refresh token, clears cookie)" })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawRefreshToken = readCookie(req, "mgs_rt");
    if (rawRefreshToken) {
      // Reuse the existing revoke-by-hash pattern (works for customer rows too).
      await this.auth.logout(rawRefreshToken);
    }
    res.clearCookie("mgs_rt", { path: "/" });
    return { data: { ok: true }, isMock: false };
  }

  @Get("me")
  @UseGuards(CustomerAuthGuard)
  @ApiOperation({ summary: "Current customer profile" })
  async me(@Req() req: Request & { user?: { sub: string } }) {
    const customerId = req.user?.sub;
    if (!customerId) {
      throw new UnauthorizedException("Customer ID missing from token");
    }
    const customer = await this.customerAuth.me(customerId);
    return { data: customer, isMock: false };
  }
}
