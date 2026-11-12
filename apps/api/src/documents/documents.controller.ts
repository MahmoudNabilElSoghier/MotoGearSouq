import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { AdminAuthGuard } from "../common/guards/admin-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import {
  DOCUMENT_MIME_TYPES,
  documentEntityTypeSchema,
  listQuerySchema,
  makeImmutableSchema,
  uploadFieldsSchema,
  type ListQuery,
  type MakeImmutableBody,
  type UploadFields,
} from "./documents.schemas";
import { DocumentsService, type DocumentEntityType } from "./documents.service";

const uploadFieldsPipe = () => new ZodValidationPipe(uploadFieldsSchema);
const listQueryPipe = () => new ZodValidationPipe(listQuerySchema);
const makeImmutablePipe = () => new ZodValidationPipe(makeImmutableSchema);
const entityTypeParamPipe = () =>
  new ZodValidationPipe(documentEntityTypeSchema);

const uploadInterceptor = () =>
  UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        if (
          (DOCUMENT_MIME_TYPES as readonly string[]).includes(file.mimetype)
        ) {
          callback(null, true);
          return;
        }
        callback(
          new BadRequestException(
            `Unsupported file type "${file.mimetype}" — allowed: ${DOCUMENT_MIME_TYPES.join(", ")}`,
          ),
          false,
        );
      },
    }),
  );

@ApiTags("documents")
@Controller("documents")
export class DocumentsController {
  constructor(@Inject(DocumentsService) private readonly docs: DocumentsService) {}

  @Post()
  @UseGuards(AdminAuthGuard)
  @uploadInterceptor()
  @ApiConsumes("multipart/form-data")
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiBody({
    schema: {
      type: "object",
      required: ["file", "entityType", "entityId"],
      properties: {
        file: { type: "string", format: "binary" },
        entityType: {
          type: "string",
          enum: [
            "PRODUCT",
            "CATEGORY",
            "BRAND",
            "MODEL",
            "SUPPLIER",
            "BRANCH",
            "EMPLOYEE",
            "ORDER",
            "CUSTOMER",
            "LANDING_CARD",
            "LANDING_SLIDE",
          ],
        },
        entityId: { type: "string" },
        makeImmutable: { type: "boolean" },
      },
    },
  })
  @ApiOperation({
    summary:
      "Upload a document (admin; multipart, ≤50MB, PDF/JPEG/PNG/WebP; requires x-admin-api-key)",
  })
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body(uploadFieldsPipe()) fields: UploadFields,
  ) {
    if (!file) throw new BadRequestException('Missing multipart field "file"');
    return this.docs.upload(fields, {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });
  }

  // NOTE: ":id/download" must be declared before ":entityType/:entityId" —
  // both are two-segment routes and Express matches in declaration order.
  @Get(":id/download")
  @ApiParam({ name: "id" })
  @ApiOperation({ summary: "Presigned download URL (5 min TTL)" })
  download(@Param("id") id: string) {
    return this.docs.getDownload(id);
  }

  @Get(":entityType/:entityId")
  @ApiParam({
    name: "entityType",
    enum: [
      "PRODUCT",
      "CATEGORY",
      "BRAND",
      "MODEL",
      "SUPPLIER",
      "BRANCH",
      "EMPLOYEE",
      "ORDER",
      "CUSTOMER",
    ],
  })
  @ApiParam({ name: "entityId" })
  @ApiQuery({ name: "includeDeleted", required: false, type: Boolean })
  @ApiOperation({ summary: "List documents for an entity" })
  list(
    @Param("entityType", entityTypeParamPipe()) entityType: DocumentEntityType,
    @Param("entityId") entityId: string,
    @Query(listQueryPipe()) query: ListQuery,
  ) {
    return this.docs.listByEntity(entityType, entityId, query);
  }

  @Delete(":id")
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiParam({ name: "id" })
  @ApiOperation({ summary: "Soft-delete a document (admin)" })
  softDelete(@Param("id") id: string) {
    return this.docs.softDelete(id);
  }

  @Post(":id/purge")
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiParam({ name: "id" })
  @ApiOperation({
    summary:
      "Permanently delete storage object + DB row (admin; blocked while WORM retention is active)",
  })
  purge(@Param("id") id: string) {
    return this.docs.purge(id);
  }

  @Post(":id/immutable")
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiParam({ name: "id" })
  @ApiOperation({
    summary: "Make a document immutable (admin; minio: COMPLIANCE retention)",
  })
  makeImmutable(
    @Param("id") id: string,
    @Body(makeImmutablePipe()) body: MakeImmutableBody,
  ) {
    return this.docs.makeImmutable(id, body);
  }
}
