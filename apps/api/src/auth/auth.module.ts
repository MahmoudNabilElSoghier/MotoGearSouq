import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../prisma/prisma.module";
import { JwtService } from "./jwt.service";
import { RateLimitService } from "./rate-limit.service";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { CustomerAuthService } from "./customer-auth.service";
import { CustomerAuthController } from "./customer-auth.controller";
import { GoogleAuthService } from "./google-auth.service";
import { GoogleAuthController } from "./google-auth.controller";
import { PasswordResetService } from "./password-reset.service";
import { PasswordResetController } from "./password-reset.controller";

@Global()
@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [AuthController, CustomerAuthController, GoogleAuthController, PasswordResetController],
  providers: [JwtService, RateLimitService, AuthService, CustomerAuthService, GoogleAuthService, PasswordResetService],
  exports: [JwtService, AuthService, CustomerAuthService, GoogleAuthService, PasswordResetService],
})
export class AuthModule {}
