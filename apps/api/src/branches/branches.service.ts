import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { fromPrismaBranch, mockBranches, mockInventory } from "@motogearsouq/shared";
import type { Branch, CreateBranchInput, UpdateBranchInput } from "@motogearsouq/shared";
import { withDb, type DbResult } from "../common/with-db";
import { toDomainError } from "../common/prisma-errors";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BranchesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  getBranches(): Promise<DbResult<Branch[]>> {
    return withDb(
      this.prisma,
      async (db) => {
        const rows = await db.branch.findMany({
          orderBy: { displayOrder: "asc" },
          include: {
            _count: { select: { inventory: true, employees: true, orders: true } },
          },
        });
        return rows.map(fromPrismaBranch);
      },
      () => mockBranches,
    );
  }

  getBranchBySlug(slug: string): Promise<DbResult<Branch | null>> {
    return withDb(
      this.prisma,
      async (db) => {
        const branch = await db.branch.findUnique({
          where: { slug },
          include: {
            inventory: { include: { product: true } },
            _count: { select: { inventory: true, employees: true, orders: true } },
          },
        });
        return branch ? fromPrismaBranch(branch) : null;
      },
      () => {
        const branch = mockBranches.find((item) => item.slug === slug);
        if (!branch) return null;
        return {
          ...branch,
          inventory: mockInventory.filter((item) => item.branchId === branch.id),
        };
      },
    );
  }

  async create(input: CreateBranchInput): Promise<DbResult<Branch>> {
    if (!process.env.DATABASE_URL) {
      const now = new Date().toISOString();
      return {
        data: {
          id: `tmp-${input.slug}`,
          code: input.code,
          slug: input.slug,
          nameAr: input.nameAr,
          nameEn: input.nameEn ?? null,
          type: input.type,
          phone: input.phone || null,
          whatsapp: input.whatsapp || null,
          address: input.address,
          addressEn: input.addressEn ?? null,
          governorate: input.governorate,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          openingHours: input.openingHours ?? null,
          managerId: input.managerId ?? null,
          active: input.active ?? true,
          displayOrder: input.displayOrder ?? 0,
          createdAt: now,
          updatedAt: now,
        },
        isMock: true,
      };
    }
    try {
      const created = await this.prisma.get().branch.create({
        data: {
          code: input.code,
          slug: input.slug,
          nameAr: input.nameAr,
          nameEn: input.nameEn ?? null,
          type: input.type,
          phone: input.phone || null,
          whatsapp: input.whatsapp || null,
          address: input.address,
          addressEn: input.addressEn ?? null,
          governorate: input.governorate,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          openingHours: input.openingHours ?? undefined,
          managerId: input.managerId || null,
          active: input.active ?? true,
          displayOrder: input.displayOrder ?? 0,
        },
      });
      return { data: fromPrismaBranch(created), isMock: false };
    } catch (error) {
      toDomainError(error);
    }
  }

  async update(id: string, input: UpdateBranchInput): Promise<DbResult<Branch>> {
    if (!process.env.DATABASE_URL) {
      const branch = mockBranches.find((b) => b.id === id);
      if (!branch) throw new NotFoundException(`Branch with ID "${id}" not found`);
      const now = new Date().toISOString();
      const updated: Branch = {
        ...branch,
        ...(input.nameAr !== undefined && { nameAr: input.nameAr }),
        ...(input.nameEn !== undefined && { nameEn: input.nameEn ?? null }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.phone !== undefined && { phone: input.phone || null }),
        ...(input.whatsapp !== undefined && { whatsapp: input.whatsapp || null }),
        ...(input.address !== undefined && { address: input.address }),
        ...(input.addressEn !== undefined && { addressEn: input.addressEn ?? null }),
        ...(input.governorate !== undefined && { governorate: input.governorate }),
        ...(input.latitude !== undefined && { latitude: input.latitude ?? null }),
        ...(input.longitude !== undefined && { longitude: input.longitude ?? null }),
        ...(input.openingHours !== undefined && { openingHours: input.openingHours ?? null }),
        ...(input.managerId !== undefined && { managerId: input.managerId || null }),
        ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder ?? branch.displayOrder }),
        ...(input.active !== undefined && { active: input.active ?? branch.active }),
        updatedAt: now,
      };
      return { data: updated, isMock: true };
    }

    const existing = await this.prisma.get().branch.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Branch with ID "${id}" not found`);
    }

    if (input.managerId) {
      const manager = await this.prisma.get().employee.findUnique({ where: { id: input.managerId } });
      if (!manager) {
        throw new BadRequestException("المشرف غير موجود");
      }
    }

    try {
      const updated = await this.prisma.get().branch.update({
        where: { id },
        data: {
          ...(input.nameAr !== undefined && { nameAr: input.nameAr }),
          ...(input.nameEn !== undefined && { nameEn: input.nameEn ?? null }),
          ...(input.type !== undefined && { type: input.type }),
          ...(input.phone !== undefined && { phone: input.phone || null }),
          ...(input.whatsapp !== undefined && { whatsapp: input.whatsapp || null }),
          ...(input.address !== undefined && { address: input.address }),
          ...(input.addressEn !== undefined && { addressEn: input.addressEn ?? null }),
          ...(input.governorate !== undefined && { governorate: input.governorate }),
          ...(input.latitude !== undefined && { latitude: input.latitude ?? null }),
          ...(input.longitude !== undefined && { longitude: input.longitude ?? null }),
          ...(input.openingHours !== undefined && { openingHours: input.openingHours ?? undefined }),
          ...(input.managerId !== undefined && { managerId: input.managerId || null }),
          ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder }),
          ...(input.active !== undefined && { active: input.active }),
        },
        include: {
          _count: { select: { inventory: true, employees: true, orders: true } },
        },
      });
      return { data: fromPrismaBranch(updated), isMock: false };
    } catch (error) {
      toDomainError(error);
    }
  }
}
