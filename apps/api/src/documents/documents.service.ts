import { randomUUID, createHash } from "node:crypto";
import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { mockProducts } from "@motogearsouq/shared";
import { withDb, type DbResult } from "../common/with-db";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import type { ListQuery, MakeImmutableBody, UploadFields } from "./documents.schemas";

export type DocumentEntityType =
  | "PRODUCT"
  | "CATEGORY"
  | "BRAND"
  | "MODEL"
  | "SUPPLIER"
  | "BRANCH"
  | "EMPLOYEE"
  | "ORDER"
  | "CUSTOMER";

export interface DocumentRecord {
  id: string;
  entityType: DocumentEntityType;
  entityId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  checksum: string;
  storageKey: string;
  storageDriver: string;
  uploadedById: string | null;
  immutable: boolean;
  retainedUntil: Date | null;
  status: "ACTIVE" | "DELETED";
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadedFileInput {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

/* MOCK DATA */
const mockNow = new Date();
const mockThen = new Date(mockNow.getTime() - 2 * 24 * 60 * 60 * 1000);
const mockDocuments: DocumentRecord[] = [
  {
    id: "doc-mock-001",
    entityType: "PRODUCT",
    entityId: mockProducts[0]?.id ?? "p-mock",
    fileName: "a1b2c3-product-manual.pdf",
    originalName: "product-manual.pdf",
    mimeType: "application/pdf",
    size: 246_800,
    checksum: "0".repeat(64),
    storageKey: `product/${mockProducts[0]?.id ?? "p-mock"}/a1b2c3-product-manual.pdf`,
    storageDriver: "local",
    uploadedById: null,
    immutable: false,
    retainedUntil: null,
    status: "ACTIVE",
    deletedAt: null,
    createdAt: mockThen,
    updatedAt: mockThen,
  },
  {
    id: "doc-mock-002",
    entityType: "ORDER",
    entityId: "o-mock",
    fileName: "d4e5f6-invoice.pdf",
    originalName: "invoice.pdf",
    mimeType: "application/pdf",
    size: 91_200,
    checksum: "1".repeat(64),
    storageKey: "order/o-mock/d4e5f6-invoice.pdf",
    storageDriver: "local",
    uploadedById: null,
    immutable: true,
    retainedUntil: new Date(mockNow.getTime() + 365 * 24 * 60 * 60 * 1000),
    status: "DELETED",
    deletedAt: mockThen,
    createdAt: mockThen,
    updatedAt: mockThen,
  },
];

const TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000;

@Injectable()
export class DocumentsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(StorageService) private readonly storage: StorageService,
  ) {}

  async upload(
    fields: UploadFields,
    file: UploadedFileInput,
  ): Promise<DbResult<DocumentRecord>> {
    const checksum = createHash("sha256").update(file.buffer).digest("hex");
    const storageKey = this.storage.buildKey({
      entityType: fields.entityType,
      entityId: fields.entityId,
      fileName: file.originalname,
    });
    const retainedUntil = fields.makeImmutable
      ? new Date(Date.now() + TEN_YEARS_MS)
      : null;

    await this.storage.putObject(
      storageKey,
      file.buffer,
      file.mimetype,
      retainedUntil ? { retainUntilDate: retainedUntil } : undefined,
    );

    // NOTE: if the DB insert then fails (withDb → fallback), the stored object
    // stays as an unreferenced orphan — TODO: compensating cleanup delete;
    // reason: better an orphan to purge manually than silent data loss.
    const base = {
      entityType: fields.entityType,
      entityId: fields.entityId,
      fileName: storageKey.split("/").pop() ?? storageKey,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      checksum,
      storageKey,
      storageDriver: this.storage.driver,
      // TODO: capture the uploader once Decision 1B auth exists — reason: no
      // user identity is available before then.
      uploadedById: null,
      immutable: retainedUntil !== null,
      retainedUntil,
      status: "ACTIVE" as const,
      deletedAt: null,
    };

    return withDb(
      this.prisma,
      async (db) => db.document.create({ data: base }),
      () => {
        const record: DocumentRecord = {
          id: `tmp-${randomUUID()}`,
          ...base,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockDocuments.unshift(record);
        return record;
      },
    );
  }

  async listByEntity(
    entityType: DocumentEntityType,
    entityId: string,
    query: ListQuery,
  ): Promise<DbResult<DocumentRecord[]>> {
    const statusFilter = query.includeDeleted ? {} : { status: "ACTIVE" as const };
    return withDb(
      this.prisma,
      async (db) =>
        db.document.findMany({
          where: { entityType, entityId, ...statusFilter },
          orderBy: { createdAt: "desc" },
        }),
      () =>
        mockDocuments.filter(
          (doc) =>
            doc.entityType === entityType &&
            doc.entityId === entityId &&
            (query.includeDeleted || doc.status === "ACTIVE"),
        ),
    );
  }

  async getDownload(
    id: string,
  ): Promise<DbResult<{ id: string; fileName: string; url: string; expiresInSeconds: number }>> {
    const result = await withDb(
      this.prisma,
      async (db) => db.document.findFirst({ where: { id, status: "ACTIVE" } }),
      () => mockDocuments.find((doc) => doc.id === id && doc.status === "ACTIVE") ?? null,
    );
    const doc = result.data;
    if (!doc) throw new NotFoundException(`Document "${id}" not found`);
    const expiresInSeconds = 300;
    const url = await this.storage.getDownloadUrl(doc.storageKey, expiresInSeconds);
    return {
      data: { id: doc.id, fileName: doc.originalName, url, expiresInSeconds },
      isMock: result.isMock,
    };
  }

  async softDelete(id: string): Promise<DbResult<{ id: string; deleted: true }>> {
    const result = await withDb(
      this.prisma,
      async (db) =>
        db.document.updateMany({
          where: { id, status: "ACTIVE" },
          data: { status: "DELETED", deletedAt: new Date() },
        }),
      () => {
        const doc = mockDocuments.find((d) => d.id === id && d.status === "ACTIVE");
        if (!doc) return { count: 0 };
        doc.status = "DELETED";
        doc.deletedAt = new Date();
        doc.updatedAt = new Date();
        return { count: 1 };
      },
    );
    if (result.data.count === 0) throw new NotFoundException(`Document "${id}" not found`);
    return { data: { id, deleted: true }, isMock: result.isMock };
  }

  async purge(id: string): Promise<DbResult<{ id: string; purged: true }>> {
    const result = await withDb(
      this.prisma,
      async (db) => db.document.findFirst({ where: { id } }),
      () => mockDocuments.find((doc) => doc.id === id) ?? null,
    );
    const doc = result.data;
    if (!doc) throw new NotFoundException(`Document "${id}" not found`);

    try {
      await this.storage.deleteObject(doc.storageKey);
    } catch (error) {
      // MinIO refuses deletes while COMPLIANCE retention is active — surface it
      // as a domain conflict instead of a raw SDK error.
      throw new ConflictException(
        `Storage delete failed${doc.immutable && doc.retainedUntil ? ` — object is under WORM retention until ${doc.retainedUntil.toISOString()}` : ""}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    const deleted = await withDb(
      this.prisma,
      async (db) => db.document.delete({ where: { id } }),
      () => {
        const index = mockDocuments.findIndex((doc2) => doc2.id === id);
        if (index >= 0) mockDocuments.splice(index, 1);
        return { id };
      },
    );
    return { data: { id, purged: true }, isMock: deleted.isMock };
  }

  async makeImmutable(
    id: string,
    body: MakeImmutableBody,
  ): Promise<DbResult<DocumentRecord>> {
    const found = await withDb(
      this.prisma,
      async (db) => db.document.findFirst({ where: { id } }),
      () => mockDocuments.find((doc) => doc.id === id) ?? null,
    );
    const doc = found.data;
    if (!doc) throw new NotFoundException(`Document "${id}" not found`);

    const retainedUntil = new Date(Date.now() + body.days * 24 * 60 * 60 * 1000);
    await this.storage.setRetention(doc.storageKey, { retainUntilDate: retainedUntil });

    return withDb(
      this.prisma,
      async (db) =>
        db.document.update({
          where: { id },
          data: { immutable: true, retainedUntil },
        }),
      () => {
        const target = mockDocuments.find((d) => d.id === id);
        if (target) {
          target.immutable = true;
          target.retainedUntil = retainedUntil;
          target.updatedAt = new Date();
        }
        return target as DocumentRecord;
      },
    );
  }
}
