import { Injectable } from "@nestjs/common";
import type { PaymentProvider, InitiatePaymentInput, InitiatePaymentResult } from "./payment-provider.interface";

@Injectable()
export class InstaPayProvider implements PaymentProvider {
  readonly name = "instapay";

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const handle = process.env.INSTAPAY_HANDLE ?? "MotoGearSouq@instapay";
    return {
      success: true,
      instructions: `قم بتحويل ${input.amount} ${input.currency} على InstaPay: ${handle}\n\nرقم الأوردر: ${input.orderNumber}\n\nارفع صورة التحويل في صفحة الأوردر.`,
      providerRef: `instapay-${input.orderNumber}`,
    };
  }

  async verify() {
    return { status: "pending" as const };
  }

  async handleWebhook() {
    return null;
  }
}
