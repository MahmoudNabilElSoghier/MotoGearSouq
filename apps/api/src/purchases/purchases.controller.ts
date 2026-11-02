import { Body, Controller, Get, Inject, Param, Patch, Post, Query, NotFoundException, UseGuards } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { createPurchaseOrderSchema, updatePurchaseStatusSchema, type CreatePurchaseOrderInput, type UpdatePurchaseStatusInput } from "@motogearsouq/shared";
import { AdminAuthGuard } from "../common/guards/admin-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { PurchasesService } from "./purchases.service";

@ApiTags("purchases")
@Controller("purchases")
export class PurchasesController {
  constructor(@Inject(PurchasesService) private readonly purchases: PurchasesService) {}

  @Get()
  @ApiOperation({ summary: "List purchase orders with filters" })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "supplierId", required: false })
  @ApiQuery({ name: "branchId", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  getPurchases(
    @Query("status") status?: string,
    @Query("supplierId") supplierId?: string,
    @Query("branchId") branchId?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.purchases.getPurchases({ status, supplierId, branchId, page, pageSize });
  }

  @Get(":id")
  @ApiParam({ name: "id" })
  @ApiOperation({ summary: "Purchase order by ID with items and stock movements" })
  async getById(@Param("id") id: string) {
    const res = await this.purchases.getPurchaseById(id);
    if (!res.data) throw new NotFoundException(`Purchase order "${id}" not found`);
    return res;
  }

  @Post()
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiOperation({ summary: "Create purchase order draft (admin)" })
  create(@Body(new ZodValidationPipe(createPurchaseOrderSchema)) body: CreatePurchaseOrderInput) {
    return this.purchases.create(body);
  }

  @Patch(":id/status")
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiParam({ name: "id" })
  @ApiOperation({ summary: "Update purchase order status (admin)" })
  updateStatus(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updatePurchaseStatusSchema)) body: UpdatePurchaseStatusInput,
  ) {
    return this.purchases.updateStatus(id, body);
  }
}
