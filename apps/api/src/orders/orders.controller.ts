import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { createHash } from "node:crypto";
import type { Request } from "express";
import { ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { AdminAuthGuard } from "../common/guards/admin-auth.guard";
import { CustomerAuthGuard } from "../common/guards/customer-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { createOrderSchema, type CreateOrderInput } from "./dto/create-order.schema";
import {
  updateOrderStatusSchema,
  type UpdateOrderStatusInput,
} from "./dto/update-order-status.schema";
import { OrdersService, type OrderFilter } from "./orders.service";

// x-forwarded-for (Vercel) wins; normalize IPv6 forms so risk counting is stable.
function extractIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const raw =
    (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : "") ||
    req.socket.remoteAddress ||
    "unknown";
  if (raw.startsWith("::ffff:")) return raw.slice(7);
  if (raw === "::1") return "127.0.0.1";
  return raw;
}

// Never store raw UA — short SHA-256 fingerprint only.
function hashUserAgent(userAgent: string): string {
  return createHash("sha256").update(userAgent || "unknown").digest("hex").slice(0, 16);
}

@ApiTags("orders")
@Controller("orders")
export class OrdersController {
  constructor(@Inject(OrdersService) private readonly orders: OrdersService) {}

  @Get()
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "paymentStatus", required: false })
  @ApiQuery({ name: "paymentMethod", required: false })
  @ApiQuery({ name: "dateFrom", required: false })
  @ApiQuery({ name: "dateTo", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  @ApiOperation({ summary: "Paginated order list (newest first)" })
  getOrders(
    @Query("status") status?: string,
    @Query("paymentStatus") paymentStatus?: string,
    @Query("paymentMethod") paymentMethod?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    const filter: OrderFilter = {
      status: status || undefined,
      paymentStatus: paymentStatus || undefined,
      paymentMethod: paymentMethod || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    };
    return this.orders.getOrders(filter);
  }

  // Declared before GET :id so "track/..." never matches the :id route.
  @Get("track/:orderNumber")
  @ApiParam({ name: "orderNumber" })
  @ApiOperation({ summary: "Public order tracking (phone masked)" })
  track(@Param("orderNumber") orderNumber: string) {
    return this.orders.trackByNumber(orderNumber);
  }

  @Get(":id")
  @ApiParam({ name: "id" })
  @ApiOperation({ summary: "Order detail with items" })
  async getById(@Param("id") id: string) {
    const result = await this.orders.getOrderById(id);
    if (!result.data) throw new NotFoundException(`Order "${id}" not found`);
    return result;
  }

  @Post()
  @UseGuards(CustomerAuthGuard)
  @ApiOperation({ summary: "Create order (authenticated checkout only, COD limits enforced)" })
  create(
    @Body(new ZodValidationPipe(createOrderSchema)) body: CreateOrderInput,
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    const customerId = req.user?.sub;
    if (!customerId) {
      throw new UnauthorizedException("Customer ID missing from token");
    }
    return this.orders.createOrder(body, customerId, {
      ipAddress: extractIp(req),
      userAgentHash: hashUserAgent(req.headers["user-agent"] || ""),
    });
  }

  @Patch(":id/status")
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiParam({ name: "id" })
  @ApiOperation({ summary: "Update order status (admin, requires Bearer JWT or x-admin-api-key)" })
  updateStatus(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateOrderStatusSchema)) body: UpdateOrderStatusInput,
  ) {
    return this.orders.updateStatus(id, body.status);
  }
}
