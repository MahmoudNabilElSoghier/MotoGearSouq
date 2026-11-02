import { Body, Controller, Get, Inject, Post, Query, UseGuards } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { stockAdjustmentSchema, type StockAdjustmentInput } from "@motogearsouq/shared";
import { AdminAuthGuard } from "../common/guards/admin-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { StockMovementsService } from "./stock-movements.service";

@ApiTags("stock-movements")
@Controller("stock-movements")
export class StockMovementsController {
  constructor(@Inject(StockMovementsService) private readonly movements: StockMovementsService) {}

  @Get()
  @ApiOperation({ summary: "List stock movements with filters" })
  @ApiQuery({ name: "productId", required: false })
  @ApiQuery({ name: "branchId", required: false })
  @ApiQuery({ name: "type", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  getMovements(
    @Query("productId") productId?: string,
    @Query("branchId") branchId?: string,
    @Query("type") type?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.movements.getMovements({ productId, branchId, type, page, pageSize });
  }

  @Get("summary")
  @ApiOperation({ summary: "Get stock movements summary per product & type" })
  getSummary() {
    return this.movements.getSummary();
  }

  @Post()
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiOperation({ summary: "Create manual stock adjustment (admin)" })
  createAdjustment(@Body(new ZodValidationPipe(stockAdjustmentSchema)) body: StockAdjustmentInput) {
    return this.movements.createAdjustment(body);
  }
}
