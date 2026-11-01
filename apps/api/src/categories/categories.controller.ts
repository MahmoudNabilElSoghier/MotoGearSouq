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
  UseGuards,
} from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { categoryFormSchema } from "@motogearsouq/shared";
import { AdminAuthGuard } from "../common/guards/admin-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { CategoriesService, type CategoryBody } from "./categories.service";

// The web form schema + parentId (the form derives parentId from its add-mode
// context, so it is not part of the shared form schema itself).
const categoryBodySchema = categoryFormSchema.extend({
  parentId: z.string().nullish(),
});

const categoryBody = () => new ZodValidationPipe(categoryBodySchema);

@ApiTags("categories")
@Controller("categories")
export class CategoriesController {
  constructor(
    @Inject(CategoriesService) private readonly categories: CategoriesService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Flat part-category list (ordered)" })
  getCategories() {
    return this.categories.getCategories();
  }

  @Get("tree")
  @ApiOperation({ summary: "Part-category tree (roots with children)" })
  getCategoryTree() {
    return this.categories.getCategoryTree();
  }

  @Get(":slug")
  @ApiParam({ name: "slug" })
  @ApiOperation({ summary: "Part-category by slug" })
  async getBySlug(@Param("slug") slug: string) {
    const result = await this.categories.getCategoryBySlug(slug);
    if (!result.data) throw new NotFoundException(`Category "${slug}" not found`);
    return result;
  }

  @Post()
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiOperation({ summary: "Create category (admin, requires x-admin-api-key)" })
  create(@Body(categoryBody()) body: z.infer<typeof categoryBodySchema>) {
    return this.categories.create(normalize(body));
  }

  @Put(":id")
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiParam({ name: "id" })
  @ApiOperation({ summary: "Update category (admin, requires x-admin-api-key)" })
  update(
    @Param("id") id: string,
    @Body(categoryBody()) body: z.infer<typeof categoryBodySchema>,
  ) {
    return this.categories.update(id, normalize(body));
  }

  @Delete(":id")
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiParam({ name: "id" })
  @ApiOperation({ summary: "Delete category (admin, requires x-admin-api-key)" })
  remove(@Param("id") id: string) {
    return this.categories.remove(id);
  }
}

function normalize(body: z.infer<typeof categoryBodySchema>): CategoryBody {
  return {
    name: body.name || "",
    nameAr: body.nameAr,
    slug: body.slug,
    order: body.order ? Number(body.order) : 0,
    parentId: body.parentId ?? null,
  };
}
