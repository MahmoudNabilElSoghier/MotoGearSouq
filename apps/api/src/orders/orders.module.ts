import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { CodLimitService } from "./cod-limit.service";
import { RiskScoreService } from "./risk-score.service";
import { ShippingModule } from "../shipping/shipping.module";
import { PaymentsModule } from "../payments/payments.module";

@Module({
  imports: [ShippingModule, PaymentsModule],
  controllers: [OrdersController],
  providers: [OrdersService, CodLimitService, RiskScoreService],
})
export class OrdersModule {}
