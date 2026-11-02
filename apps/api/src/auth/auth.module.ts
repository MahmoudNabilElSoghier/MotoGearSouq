import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../prisma/prisma.module";
import { JwtService } from "./jwt.service";
import { RateLimitService } from "./rate-limit.service";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { CustomerAuthService } from "./customer-auth.service";
import { CustomerAuthController } from "./customer-auth.controller";

@Global()
@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [AuthController, CustomerAuthController],
  providers: [JwtService, RateLimitService, AuthService, CustomerAuthService],
  exports: [JwtService, AuthService, CustomerAuthService],
})
export class AuthModule {}
