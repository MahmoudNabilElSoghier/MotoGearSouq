import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { productFormSchema, type ProductFormValues } from "@motogearsouq/shared";
import { AdminAuthGuard } from "../common/guards/admin-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { ProductsService, type ProductBody, type ProductFilter } from "./products.service";

const productBody = () => new ZodValidationPipe(productFormSchema);

function toFiniteNumber(value?: string): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function normalize(values: ProductFormValues): ProductBody {
  return {
    code: values.code,
    name: values.name,
    nameEn: values.nameEn || null,
    description: values.description || null,
    oemCode: values.oemCode || null,
    brandId: values.brandId || null,
    partCategoryId: values.partCategoryId || null,
    costPrice: values.costPrice ? Number(values.costPrice) : null,
    wholesalePrice: values.wholesalePrice ? Number(values.wholesalePrice) : null,
    retailPrice: values.retailPrice ? Number(values.retailPrice) : null,
    vipPrice: values.vipPrice ? Number(values.vipPrice) : null,
    taxRate: values.taxRate ? Number(values.taxRate) : 0.14,
    unitOfMeasure: values.unitOfMeasure,
    reorderLevel: values.reorderLevel ? Number(values.reorderLevel) : 0,
    tags: (values.tags ?? "")
      .split(/[،,]/)
      .map((tag) => tag.trim())
      .filter(Boolean),
    active: values.active,
    // TODO(Phase 3): supplierId — reason: suppliers have no service/UI yet
    // (schema column exists), so the field is intentionally not in this form.
  };
}

@ApiTags("products")
@Controller("products")
export class ProductsController {
  constructor(@Inject(ProductsService) private readonly products: ProductsService) {}

  @Get()
  @ApiQuery({ name: "q", required: false })
  @ApiQuery({ name: "search", required: false, description: "Alias of q" })
  @ApiQuery({ name: "brandSlug", required: false })
  @ApiQuery({ name: "brand", required: false, description: "Alias of brandSlug (repeatable)" })
  @ApiQuery({ name: "categorySlug", required: false })
  @ApiQuery({ name: "category", required: false, description: "Alias of categorySlug (repeatable)" })
  @ApiQuery({ name: "type", required: false, description: "new | used | spare-parts | accessories" })
  @ApiQuery({
    name: "modelId",
    required: false,
    description: "Only products compatible with this machine model id",
  })
  @ApiQuery({ name: "featured", required: false, description: "true = only featured products" })
  @ApiQuery({ name: "priceMin", required: false })
  @ApiQuery({ name: "priceMax", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  @ApiQuery({ name: "includeInactive", required: false })
  @ApiOperation({ summary: "Paginated product list with filters" })
  getProducts(
    @Query("q") q?: string,
    @Query("search") search?: string,
    @Query("brandSlug") brandSlug?: string | string[],
    @Query("brand") brand?: string | string[],
    @Query("categorySlug") categorySlug?: string | string[],
    @Query("category") category?: string | string[],
    @Query("type") type?: string,
    @Query("modelId") modelId?: string,
    @Query("featured") featured?: string,
    @Query("priceMin") priceMin?: string,
    @Query("priceMax") priceMax?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("includeInactive") includeInactive?: string,
  ) {
    const filter: ProductFilter = {
      q: q || search || undefined,
      brandSlug: brandSlug || brand || undefined,
      categorySlug: categorySlug || category || undefined,
      type: type || undefined,
      modelId: modelId || undefined,
      featured: featured === "true" || featured === "1",
      priceMin: toFiniteNumber(priceMin),
      priceMax: toFiniteNumber(priceMax),
      page: toFiniteNumber(page),
      pageSize: toFiniteNumber(pageSize),
      includeInactive: includeInactive === "true" || includeInactive === "1",
    };
    return this.products.getProducts(filter);
  }

  @Get("low-stock")
  @ApiOperation({ summary: "Active products at or below their reorder level" })
  getLowStock() {
    return this.products.getLowStockProducts();
  }

  @Get("code/:code")
  @ApiParam({ name: "code", description: "Product code (part number)" })
  @ApiOperation({ summary: "Public product detail by code" })
  async getByCode(@Param("code") code: string) {
    const result = await this.products.getProductByCode(code);
    if (!result.data) throw new NotFoundException(`Product code "${code}" not found`);
    return result;
  }

  @Get(":id")
  @ApiParam({ name: "id" })
  @ApiOperation({ summary: "Admin product detail by id (incl. inactive rows)" })
  async getById(@Param("id") id: string) {
    const result = await this.products.getProductById(id);
    if (!result.data) throw new NotFoundException(`Product "${id}" not found`);
    return result;
  }

  @Post()
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiOperation({ summary: "Create product (admin, requires x-admin-api-key)" })
  create(@Body(productBody()) body: ProductFormValues) {
    return this.products.create(normalize(body));
  }

  @Put(":id")
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiParam({ name: "id" })
  @ApiOperation({ summary: "Update product (admin, requires x-admin-api-key)" })
  update(@Param("id") id: string, @Body(productBody()) body: ProductFormValues) {
    return this.products.update(id, normalize(body));
  }

  @Delete(":id")
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiParam({ name: "id" })
  @ApiOperation({
    summary: "Soft-delete product (admin, requires x-admin-api-key)",
  })
  remove(@Param("id") id: string) {
    return this.products.remove(id);
  }
}
