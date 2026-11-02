import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../prisma/prisma.module";
import { MockProvider } from "./providers/mock.provider";
import { PaymobProvider } from "./providers/paymob.provider";
import { FawryProvider } from "./providers/fawry.provider";
import { InstaPayProvider } from "./providers/instapay.provider";
import { PaymentProviderFactory } from "./payment-provider.factory";
import { PaymentsService } from "./payments.service";
import { PaymentsController } from "./payments.controller";

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [
    MockProvider,
    PaymobProvider,
    FawryProvider,
    InstaPayProvider,
    PaymentProviderFactory,
    PaymentsService,
  ],
  controllers: [PaymentsController],
  exports: [PaymentProviderFactory, PaymentsService],
})
export class PaymentsModule {}
