import { Body, Controller, Get, Inject, Patch, Query, UseGuards } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { updateCompanySettingsSchema, type UpdateCompanySettingsInput } from "@motogearsouq/shared";
import { AdminAuthGuard } from "../common/guards/admin-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AnalyticsService } from "./analytics.service";

@ApiTags("analytics")
@ApiHeader({ name: "x-admin-api-key", required: false })
@UseGuards(AdminAuthGuard)
@Controller("analytics")
export class AnalyticsController {
  constructor(@Inject(AnalyticsService) private readonly analytics: AnalyticsService) {}

  @Get("settings")
  @ApiOperation({ summary: "Company settings (singleton, created with defaults if missing)" })
  getSettings() {
    return this.analytics.getSettings();
  }

  @Patch("settings")
  @ApiOperation({ summary: "Update fixed costs / VAT rate (admin)" })
  updateSettings(@Body(new ZodValidationPipe(updateCompanySettingsSchema)) body: UpdateCompanySettingsInput) {
    return this.analytics.updateSettings(body);
  }

  @Get("dashboard")
  @ApiOperation({ summary: "Dashboard KPIs, top products, sales by branch" })
  @ApiQuery({ name: "period", required: false, enum: ["7d", "30d", "90d", "365d"] })
  getDashboard(@Query("period") period?: string) {
    return this.analytics.getDashboard(period);
  }

  @Get("break-even")
  @ApiOperation({ summary: "Break-even analysis from fixed costs and contribution margin" })
  @ApiQuery({ name: "period", required: false, enum: ["7d", "30d", "90d", "365d"] })
  getBreakEven(@Query("period") period?: string) {
    return this.analytics.getBreakEven(period);
  }

  @Get("abc-analysis")
  @ApiOperation({ summary: "ABC analysis (Pareto) of products by revenue" })
  @ApiQuery({ name: "period", required: false, enum: ["7d", "30d", "90d", "365d"] })
  getAbcAnalysis(@Query("period") period?: string) {
    return this.analytics.getAbcAnalysis(period);
  }

  @Get("dead-stock")
  @ApiOperation({ summary: "Products in stock with no sales within the threshold" })
  @ApiQuery({ name: "days", required: false })
  getDeadStock(@Query("days") days?: string) {
    return this.analytics.getDeadStock(days);
  }

  @Get("stock-valuation")
  @ApiOperation({ summary: "Inventory valued at cost and retail, by branch and category" })
  getStockValuation() {
    return this.analytics.getStockValuation();
  }

  @Get("product-profitability")
  @ApiOperation({ summary: "Top products by gross profit" })
  @ApiQuery({ name: "period", required: false, enum: ["7d", "30d", "90d", "365d"] })
  @ApiQuery({ name: "limit", required: false })
  getProductProfitability(@Query("period") period?: string, @Query("limit") limit?: string) {
    return this.analytics.getProductProfitability(period, limit);
  }
}
