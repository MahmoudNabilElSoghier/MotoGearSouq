import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { PaymentProvider } from "./providers/payment-provider.interface";
import { MockProvider } from "./providers/mock.provider";
import { PaymobProvider } from "./providers/paymob.provider";
import { FawryProvider } from "./providers/fawry.provider";
import { InstaPayProvider } from "./providers/instapay.provider";

@Injectable()
export class PaymentProviderFactory {
  constructor(
    @Inject(MockProvider) private readonly mock: MockProvider,
    @Inject(PaymobProvider) private readonly paymob: PaymobProvider,
    @Inject(FawryProvider) private readonly fawry: FawryProvider,
    @Inject(InstaPayProvider) private readonly instapay: InstaPayProvider,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async get(method: string): Promise<PaymentProvider> {
    if (method === "mock") return this.mock;
    if (method === "instapay") return this.instapay;

    const settings = await this.prisma.get().companySettings.findUnique({ where: { id: "singleton" } });

    if (method === "paymob") {
      if (!settings?.paymobEnabled) throw new BadRequestException("Paymob disabled");
      return this.paymob;
    }
    if (method === "fawry") {
      if (!settings?.fawryEnabled) throw new BadRequestException("Fawry disabled");
      return this.fawry;
    }
    throw new BadRequestException(`Unknown payment method: ${method}`);
  }
}
