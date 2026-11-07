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
  type LandingCardInput,
  type UpdateLandingCardInput,
  type UpdateLandingSectionInput,
} from "@motogearsouq/shared";
import { LandingService } from "./landing.service";

const sectionBody = () => new ZodValidationPipe(updateLandingSectionSchema);
const cardBody = () => new ZodValidationPipe(landingCardSchema);
const cardUpdateBody = () => new ZodValidationPipe(updateLandingCardSchema);

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
}
