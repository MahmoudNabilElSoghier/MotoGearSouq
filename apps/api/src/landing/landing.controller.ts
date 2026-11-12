import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import {
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { AdminAuthGuard } from "../common/guards/admin-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import {
  landingCardSchema,
  updateLandingCardSchema,
  updateLandingSectionSchema,
  createLandingSlideSchema,
  updateLandingSlideSchema,
  type LandingCardInput,
  type LandingSectionInput,
  type UpdateLandingCardInput,
  type UpdateLandingSectionInput,
  type CreateLandingSlideInput,
  type UpdateLandingSlideInput,
} from "@motogearsouq/shared";
import { LandingService } from "./landing.service";

const sectionBody = () => new ZodValidationPipe(updateLandingSectionSchema);
const cardBody = () => new ZodValidationPipe(landingCardSchema);
const cardUpdateBody = () => new ZodValidationPipe(updateLandingCardSchema);
const slideBody = () => new ZodValidationPipe(createLandingSlideSchema);
const slideUpdateBody = () => new ZodValidationPipe(updateLandingSlideSchema);

@ApiTags("landing")
@Controller("landing")
export class LandingController {
  constructor(
    @Inject(LandingService) private readonly landing: LandingService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List all landing sections with cards (public)" })
  async getSections() {
    return this.landing.getLandingSections();
  }

  // ---------- Hero slides ----------

  @Get("slides")
  @ApiOperation({ summary: "List active hero slides, ordered (public)" })
  getActiveSlides() {
    return this.landing.findActiveSlides();
  }

  @Get("slides/admin")
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiOperation({ summary: "List all hero slides incl. inactive (admin)" })
  getAllSlides() {
    return this.landing.findAllSlides();
  }

  @Post("slides")
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiOperation({ summary: "Create hero slide (admin)" })
  createSlide(@Body(slideBody()) body: CreateLandingSlideInput) {
    return this.landing.createSlide(body);
  }

  @Put("slides/:id")
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiParam({ name: "id" })
  @ApiOperation({ summary: "Update hero slide (admin)" })
  updateSlide(
    @Param("id") id: string,
    @Body(slideUpdateBody()) body: UpdateLandingSlideInput,
  ) {
    return this.landing.updateSlide(id, body);
  }

  @Delete("slides/:id")
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiParam({ name: "id" })
  @ApiOperation({ summary: "Delete hero slide (admin)" })
  removeSlide(@Param("id") id: string) {
    return this.landing.deleteSlide(id);
  }

  @Post()
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiOperation({ summary: "Create landing section (admin)" })
  createSection(
    @Body(sectionBody()) body: LandingSectionInput,
  ) {
    return this.landing.createSection(body);
  }

  @Put(":id")
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiParam({ name: "id" })
  @ApiOperation({ summary: "Update landing section (admin)" })
  updateSection(
    @Param("id") id: string,
    @Body(sectionBody()) body: UpdateLandingSectionInput,
  ) {
    return this.landing.updateSection(id, body);
  }

  @Post(":id/cards")
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiParam({ name: "id" })
  @ApiOperation({ summary: "Add card to landing section (admin)" })
  addCard(
    @Param("id") sectionId: string,
    @Body(cardBody()) body: LandingCardInput,
  ) {
    return this.landing.addCard({ ...body, sectionId });
  }

  @Put("cards/:id")
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiParam({ name: "id" })
  @ApiOperation({ summary: "Update landing card (admin)" })
  updateCard(
    @Param("id") id: string,
    @Body(cardUpdateBody()) body: UpdateLandingCardInput,
  ) {
    return this.landing.updateCard(id, body);
  }

  @Delete("cards/:id")
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiParam({ name: "id" })
  @ApiOperation({ summary: "Delete landing card (admin)" })
  removeCard(@Param("id") id: string) {
    return this.landing.removeCard(id);
  }

  @Delete(":id")
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiParam({ name: "id" })
  @ApiOperation({ summary: "Delete landing section (admin)" })
  removeSection(@Param("id") id: string) {
    return this.landing.removeSection(id);
  }
}
