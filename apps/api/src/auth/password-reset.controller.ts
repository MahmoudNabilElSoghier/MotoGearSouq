import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { PasswordResetService } from "./password-reset.service";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صالح"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "التوكن مطلوب"),
  newPassword: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

@ApiTags("password-reset")
@Controller("auth/customer")
export class PasswordResetController {
  constructor(
    @Inject(PasswordResetService) private readonly passwordReset: PasswordResetService,
  ) {}

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request password reset link (email not leaked)" })
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordSchema)) body: z.infer<typeof forgotPasswordSchema>,
  ) {
    return this.passwordReset.forgotPassword(body.email);
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset password with token" })
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) body: z.infer<typeof resetPasswordSchema>,
  ) {
    return this.passwordReset.resetPassword(body.token, body.newPassword);
  }
}
