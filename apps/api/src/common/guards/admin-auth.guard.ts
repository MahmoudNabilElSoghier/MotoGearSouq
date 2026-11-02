import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { timingSafeEqual } from "node:crypto";
import { JwtService } from "../../auth/jwt.service";

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(@Inject(JwtService) private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const headers = request.headers;

    // 1. Check x-admin-api-key header (dual auth alternative)
    const providedApiKey = headers["x-admin-api-key"];
    if (providedApiKey) {
      const expected = process.env.ADMIN_API_KEY;
      if (!expected) {
        throw new ForbiddenException(
          "Admin API key is not configured — set ADMIN_API_KEY to enable write endpoints",
        );
      }
      const keyStr = Array.isArray(providedApiKey) ? providedApiKey[0] : providedApiKey;
      const a = Buffer.from(keyStr);
      const b = Buffer.from(expected);
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        throw new ForbiddenException("Invalid admin API key");
      }
      request.user = { type: "api-key" };
      return true;
    }

    // 2. Check Authorization Bearer JWT
    const authHeader = headers["authorization"];
    if (authHeader && typeof authHeader === "string") {
      const [type, token] = authHeader.split(" ");
      if (type === "Bearer" && token) {
        let payload;
        try {
          payload = this.jwtService.verify(token);
        } catch (error) {
          throw new UnauthorizedException(`Invalid or expired token: ${error instanceof Error ? error.message : "unknown"}`);
        }
        // Customer tokens are rejected here — admin routes require an admin
        // JWT (all User.role values are "admin" today) or the x-admin-api-key.
        if (payload.role !== "admin") {
          throw new UnauthorizedException("role must be admin");
        }
        request.user = payload;
        return true;
      }
    }

    // 3. Neither header provided
    throw new UnauthorizedException("Authentication required (provide Bearer JWT or x-admin-api-key header)");
  }
}
