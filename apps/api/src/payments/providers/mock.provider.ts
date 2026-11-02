import { Injectable } from "@nestjs/common";
import * as crypto from "node:crypto";
import type { PaymentProvider, InitiatePaymentInput, InitiatePaymentResult } from "./payment-provider.interface";

@Injectable()
export class MockProvider implements PaymentProvider {
  readonly name = "mock";

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const providerRef = `mock-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    return {
      success: true,
      redirectUrl: `/ar/checkout/mock-pay?order=${input.orderNumber}&ref=${providerRef}`,
      providerRef,
    };
  }

  async verify(providerRef: string) {
    if (providerRef.includes("-success")) {
      return { status: "paid" as const };
    }
    if (providerRef.includes("-fail")) {
      return { status: "failed" as const };
    }
    return { status: "pending" as const };
  }

  async handleWebhook() {
    return null;
  }
}
