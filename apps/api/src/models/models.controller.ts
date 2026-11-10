import { Controller, Get, Inject, NotFoundException, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { ModelsService } from "./models.service";

@ApiTags("models")
@Controller("models")
export class ModelsController {
  constructor(@Inject(ModelsService) private readonly models: ModelsService) {}

  @Get()
  @ApiQuery({ name: "brandSlug", required: false })
  @ApiQuery({ name: "brandId", required: false })
  @ApiQuery({ name: "type", required: false, description: "motorcycle | scooter" })
  @ApiOperation({ summary: "Machine models (optionally filtered by brand and vehicle type)" })
  getModels(
    @Query("brandSlug") brandSlug?: string,
    @Query("brandId") brandId?: string,
    @Query("type") type?: string,
  ) {
    return this.models.getModels(brandSlug || undefined, {
      brandId: brandId || undefined,
      type: type || undefined,
    });
  }

  @Get(":brandSlug/:modelSlug")
  @ApiParam({ name: "brandSlug" })
  @ApiParam({ name: "modelSlug" })
  @ApiOperation({ summary: "Model detail with compatible products" })
  async getModel(
    @Param("brandSlug") brandSlug: string,
    @Param("modelSlug") modelSlug: string,
  ) {
    const result = await this.models.getModelBySlug(brandSlug, modelSlug);
    if (!result.data) {
      throw new NotFoundException(`Model "${brandSlug}/${modelSlug}" not found`);
    }
    return result;
  }
}
