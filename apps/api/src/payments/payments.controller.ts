import { Body, Controller, Get, Headers, Inject, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { AdminAuthGuard } from "../common/guards/admin-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { PaymentsService } from "./payments.service";
import { PaymentProviderFactory } from "./payment-provider.factory";
import { z } from "zod";

const initiateSchema = z.object({
  orderNumber: z.string().min(1),
  method: z.string().min(1),
  returnUrl: z.string().optional(),
});

const mockCompleteSchema = z.object({
  providerRef: z.string().min(1),
  success: z.boolean(),
});

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(
    @Inject(PaymentsService) private readonly payments: PaymentsService,
    @Inject(PaymentProviderFactory) private readonly factory: PaymentProviderFactory,
  ) {}

  @Post("initiate")
  @ApiOperation({ summary: "Initiate payment for an existing order" })
  async initiate(
    @Body(new ZodValidationPipe(initiateSchema))
    body: { orderNumber: string; method: string; returnUrl?: string },
  ) {
    return this.payments.initiate(body.orderNumber, body.method, body.returnUrl);
  }

  @Post("webhook/:provider")
  @ApiOperation({ summary: "Provider webhook endpoint" })
  async webhook(
    @Param("provider") providerName: string,
    @Body() payload: unknown,
    @Headers() headers: Record<string, string>,
  ) {
    const provider = await this.factory.get(providerName);
    const result = await provider.handleWebhook(payload, headers);
    if (result) {
      await this.payments.mockComplete(result.providerRef, result.status === "paid");
    }
    return { received: true };
  }

  @Post("mock/complete")
  @ApiOperation({ summary: "Mock payment completion simulation" })
  async mockComplete(
    @Body(new ZodValidationPipe(mockCompleteSchema)) body: { providerRef: string; success: boolean },
  ) {
    return this.payments.mockComplete(body.providerRef, body.success);
  }

  @Get("transactions")
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: "List payment transactions (admin)" })
  @ApiQuery({ name: "orderId", required: false })
  @ApiQuery({ name: "provider", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  async listTransactions(
    @Query("orderId") orderId?: string,
    @Query("provider") provider?: string,
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.payments.listTransactions({
      orderId,
      provider,
      status,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Post("orders/:id/mark-paid")
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: "Manually mark order as paid (admin)" })
  async markPaid(@Param("id") id: string) {
    return this.payments.markPaid(id);
  }

  @Post("orders/:id/refund")
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: "Refund order payment (admin)" })
  async refund(@Param("id") id: string) {
    return this.payments.refund(id);
  }
}
