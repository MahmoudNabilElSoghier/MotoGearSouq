import { Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "node:crypto";
import type { PaymentProvider, InitiatePaymentResult } from "./payment-provider.interface";

@Injectable()
export class FawryProvider implements PaymentProvider {
  readonly name = "fawry";
  private configured: boolean;

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    const required = ["FAWRY_MERCHANT_CODE", "FAWRY_SECURITY_KEY"];
    this.configured = required.every((k) => !!this.config.get(k));
  }

  async initiate(): Promise<InitiatePaymentResult> {
    if (!this.configured) {
      throw new ServiceUnavailableException("Fawry not configured — set FAWRY_* env vars");
    }
    const providerRef = `fawry-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    return {
      success: true,
      instructions: `رقم مرجع فوري: ${providerRef}. برجاء الدفع خلال 24 ساعة.`,
      providerRef,
    };
  }

  async verify(providerRef: string) {
    if (!this.configured) {
      throw new ServiceUnavailableException("Fawry not configured");
    }
    return { status: "pending" as const, providerRef };
  }

  async handleWebhook() {
    if (!this.configured) {
      throw new ServiceUnavailableException("Fawry not configured");
    }
    return null;
  }
}
