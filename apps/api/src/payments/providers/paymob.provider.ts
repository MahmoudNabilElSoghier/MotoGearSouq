import { Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "node:crypto";
import type { PaymentProvider, InitiatePaymentResult } from "./payment-provider.interface";

@Injectable()
export class PaymobProvider implements PaymentProvider {
  readonly name = "paymob";
  private configured: boolean;

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    const required = ["PAYMOB_API_KEY", "PAYMOB_INTEGRATION_ID", "PAYMOB_IFRAME_ID", "PAYMOB_HMAC_SECRET"];
    this.configured = required.every((k) => !!this.config.get(k));
  }

  async initiate(): Promise<InitiatePaymentResult> {
    if (!this.configured) {
      throw new ServiceUnavailableException("Paymob not configured — set PAYMOB_* env vars");
    }
    const providerRef = `paymob-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    return {
      success: true,
      redirectUrl: `https://accept.paymob.com/api/acceptance/iframes/${this.config.get("PAYMOB_IFRAME_ID")}?payment_token=${providerRef}`,
      providerRef,
    };
  }

  async verify(providerRef: string) {
    if (!this.configured) {
      throw new ServiceUnavailableException("Paymob not configured");
    }
    return { status: "pending" as const, providerRef };
  }

  async handleWebhook(payload: unknown, headers: Record<string, string>) {
    if (!this.configured) {
      throw new ServiceUnavailableException("Paymob not configured");
    }
    const hmacHeader = headers["hmac"] ?? "";
    const hmacSecret = this.config.get("PAYMOB_HMAC_SECRET") ?? "";
    const computedHmac = crypto.createHmac("sha512", hmacSecret).update(JSON.stringify(payload)).digest("hex");
    if (hmacHeader && hmacHeader !== computedHmac) {
      throw new ServiceUnavailableException("Invalid HMAC signature");
    }
    return null;
  }
}
