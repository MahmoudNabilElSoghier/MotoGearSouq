import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { AdminAuthGuard } from "../common/guards/admin-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { ShippingService } from "./shipping.service";
import { PrismaService } from "../prisma/prisma.service";
import { z } from "zod";

const shippingRateSchema = z.object({
  governorate: z.string().min(1),
  city: z.string().optional().nullable(),
  standardFee: z.number().min(0),
  expressFee: z.number().min(0).optional().nullable(),
  freeOverAmount: z.number().min(0).optional().nullable(),
  codFee: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

type ShippingRateInput = z.infer<typeof shippingRateSchema>;

@ApiTags("shipping")
@Controller("shipping")
export class ShippingController {
  constructor(
    @Inject(ShippingService) private readonly shipping: ShippingService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  @Get("quote")
  @ApiOperation({ summary: "Calculate shipping quote for checkout" })
  @ApiQuery({ name: "orderValue", required: true })
  @ApiQuery({ name: "governorate", required: true })
  @ApiQuery({ name: "city", required: false })
  @ApiQuery({ name: "method", required: true, enum: ["standard", "express", "cod"] })
  async getQuote(
    @Query("orderValue") orderValue: string,
    @Query("governorate") governorate: string,
    @Query("city") city?: string,
    @Query("method") method?: "standard" | "express" | "cod",
  ) {
    const val = Number(orderValue) || 0;
    const m = method && ["standard", "express", "cod"].includes(method) ? method : "standard";
    return this.shipping.calculate(val, governorate, city ?? null, m);
  }

  @Get("rates")
  @ApiOperation({ summary: "List all shipping rates (admin)" })
  async getRates() {
    const rates = await this.prisma.get().shippingRate.findMany({ orderBy: { governorate: "asc" } });
    return rates.map((r) => ({
      ...r,
      standardFee: Number(r.standardFee),
      expressFee: r.expressFee ? Number(r.expressFee) : null,
      freeOverAmount: r.freeOverAmount ? Number(r.freeOverAmount) : null,
      codFee: Number(r.codFee),
    }));
  }

  @Post("rates")
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: "Create shipping rate (admin)" })
  async createRate(@Body(new ZodValidationPipe(shippingRateSchema)) body: ShippingRateInput) {
    return this.prisma.get().shippingRate.create({ data: body });
  }

  @Patch("rates/:id")
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: "Update shipping rate (admin)" })
  async updateRate(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(shippingRateSchema.partial())) body: Partial<ShippingRateInput>,
  ) {
    return this.prisma.get().shippingRate.update({ where: { id }, data: body });
  }

  @Delete("rates/:id")
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: "Delete shipping rate (admin)" })
  async deleteRate(@Param("id") id: string) {
    return this.prisma.get().shippingRate.delete({ where: { id } });
  }
}
