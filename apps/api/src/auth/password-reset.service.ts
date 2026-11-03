import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import * as crypto from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { hashPassword } from "../common/crypto/password";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async forgotPassword(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    let customer;
    try {
      customer = await this.prisma.get().customer.findFirst({
        where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      });
    } catch {
      // DB unavailable (mock mode) — fall through, customer stays undefined
      customer = undefined;
    }

    if (customer) {
      const token = crypto.randomBytes(32).toString("base64url");
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

      try {
        await this.prisma.get().passwordReset.create({
          data: {
            token,
            customerId: customer.id,
            expiresAt,
          },
        });
      } catch {
        // DB write failed — token not persisted, but we still log for mock mode
        this.logger.warn("[password-reset] DB write failed, token not persisted");
      }

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const locale = "ar";
      const resetUrl = `${frontendUrl}/${locale}/reset-password?token=${token}`;
      console.log("[password-reset] reset link:", resetUrl);
    } else {
      // Email not found — still log a dummy token to avoid leaking existence
      const dummyToken = crypto.randomBytes(32).toString("base64url");
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const locale = "ar";
      const resetUrl = `${frontendUrl}/${locale}/reset-password?token=${dummyToken}`;
      console.log("[password-reset] reset link (no account):", resetUrl);
    }

    // Always return the same message to avoid email enumeration
    return {
      message: "إذا كان البريد الإلكتروني موجودًا، سيتم إرسال رابط إعادة التعيين",
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    if (!token || !newPassword) {
      throw new BadRequestException("التوكن وكلمة المرور الجديدة مطلوبان");
    }

    let resetRecord;
    try {
      resetRecord = await this.prisma.get().passwordReset.findUnique({
        where: { token },
        include: { customer: true },
      });
    } catch {
      throw new BadRequestException("رابط إعادة التعيين غير صالح أو منتهي الصلاحية");
    }

    if (!resetRecord) {
      throw new BadRequestException("رابط إعادة التعيين غير صالح أو منتهي الصلاحية");
    }

    if (resetRecord.usedAt) {
      throw new BadRequestException("تم استخدام رابط إعادة التعيين بالفعل");
    }

    if (resetRecord.expiresAt < new Date()) {
      throw new BadRequestException("رابط إعادة التعيين منتهي الصلاحية");
    }

    const customer = resetRecord.customer;
    if (!customer || !customer.isActive) {
      throw new ForbiddenException("الحساب غير نشط");
    }

    try {
      await this.prisma.get().customer.update({
        where: { id: customer.id },
        data: { passwordHash: hashPassword(newPassword) },
      });
    } catch {
      throw new BadRequestException("فشل تحديث كلمة المرور");
    }

    try {
      await this.prisma.get().passwordReset.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      });
    } catch {
      // Non-fatal: password already updated
    }

    return { message: "تم تحديث كلمة المرور بنجاح" };
  }
}
