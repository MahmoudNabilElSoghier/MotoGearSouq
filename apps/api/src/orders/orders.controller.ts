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
  UseGuards,
} from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { AdminAuthGuard } from "../common/guards/admin-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { createOrderSchema, type CreateOrderInput } from "./dto/create-order.schema";
import {
  updateOrderStatusSchema,
  type UpdateOrderStatusInput,
} from "./dto/update-order-status.schema";
import { OrdersService, type OrderFilter } from "./orders.service";

@ApiTags("orders")
@Controller("orders")
export class OrdersController {
  constructor(@Inject(OrdersService) private readonly orders: OrdersService) {}

  @Get()
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  @ApiOperation({ summary: "Paginated order list (newest first)" })
  getOrders(
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    const filter: OrderFilter = {
      status: status || undefined,
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
  @ApiOperation({ summary: "Create order (guest checkout, cash on delivery)" })
  create(@Body(new ZodValidationPipe(createOrderSchema)) body: CreateOrderInput) {
    return this.orders.createOrder(body);
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
