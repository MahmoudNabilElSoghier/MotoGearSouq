import {
  Body,
  Controller,
  Get,
  HttpCode,
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
import { loginSchema, type LoginInput } from "@motogearsouq/shared";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { AuthService } from "./auth.service";
import { JwtService } from "./jwt.service";

function readCookie(req: Request, name: string): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [cookieName, ...rest] = cookie.trim().split("=");
    if (cookieName === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return undefined;
}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  private checkKeys(): void {
    if (!this.jwtService.areKeysLoaded()) {
      throw new ServiceUnavailableException("Authentication service unavailable: JWT keys not configured");
    }
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Admin/Manager login (RS256 access token + httpOnly refresh cookie)" })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.checkKeys();
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const result = await this.authService.login(body.email, body.password, ip, userAgent);

    const refreshTtlStr = this.config.get<string>("JWT_REFRESH_TTL", "7d");
    const refreshTtlSeconds = this.jwtService.parseTtl(refreshTtlStr);
    const isProd = this.config.get<string>("NODE_ENV") === "production";

    res.cookie("mgs_rt", result.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: refreshTtlSeconds * 1000,
    });

    return {
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
      isMock: false,
    };
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rotate refresh token and get new access token" })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.checkKeys();
    const rawRefreshToken = readCookie(req, "mgs_rt");

    const result = await this.authService.refresh(rawRefreshToken || "");

    const refreshTtlStr = this.config.get<string>("JWT_REFRESH_TTL", "7d");
    const refreshTtlSeconds = this.jwtService.parseTtl(refreshTtlStr);
    const isProd = this.config.get<string>("NODE_ENV") === "production";

    res.cookie("mgs_rt", result.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: refreshTtlSeconds * 1000,
    });

    return {
      data: {
        accessToken: result.accessToken,
      },
      isMock: false,
    };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Logout user and revoke refresh token" })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawRefreshToken = readCookie(req, "mgs_rt");
    if (rawRefreshToken) {
      await this.authService.logout(rawRefreshToken);
    }

    res.clearCookie("mgs_rt", { path: "/" });

    return {
      data: { success: true },
      isMock: false,
    };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get current authenticated user profile" })
  async me(@Req() req: Request & { user?: { sub: string } }) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException("User ID missing from token");
    }
    const user = await this.authService.getMe(userId);
    return {
      data: user,
      isMock: false,
    };
  }
}
