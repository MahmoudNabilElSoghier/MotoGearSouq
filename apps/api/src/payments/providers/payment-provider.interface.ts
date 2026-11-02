export interface InitiatePaymentInput {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  returnUrl: string;
  cancelUrl: string;
}

export interface InitiatePaymentResult {
  success: boolean;
  redirectUrl?: string;
  instructions?: string;
  providerRef?: string;
  rawResponse?: unknown;
}

export interface PaymentProvider {
  readonly name: string;
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  verify(providerRef: string): Promise<{
    status: "paid" | "failed" | "pending";
    method?: string;
    amount?: number;
    rawResponse?: unknown;
  }>;
  handleWebhook(payload: unknown, headers: Record<string, string>): Promise<{
    orderNumber: string;
    status: "paid" | "failed";
    providerRef: string;
  } | null>;
}
