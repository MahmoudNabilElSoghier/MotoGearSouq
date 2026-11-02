import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateSupplierInput, UpdateSupplierInput } from "@motogearsouq/shared";

@Injectable()
export class SuppliersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getSuppliers() {
    const suppliers = await this.prisma.get().supplier.findMany({
      include: {
        _count: { select: { products: true, purchaseOrders: true } },
      },
      orderBy: { name: "asc" },
    });
    return { data: suppliers };
  }

  async getSupplierById(id: string) {
    const supplier = await this.prisma.get().supplier.findUnique({
      where: { id },
      include: {
        products: true,
        purchaseOrders: {
          include: { branch: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    return { data: supplier };
  }

  async create(input: CreateSupplierInput) {
    const supplier = await this.prisma.get().supplier.create({
      data: {
        code: input.code,
        name: input.name,
        nameAr: input.nameAr,
        nameEn: input.nameEn,
        phone: input.phone,
        email: input.email || null,
        address: input.address,
        country: input.country ?? "Taiwan",
        leadTimeDays: input.leadTimeDays ?? 7,
        note: input.note,
      },
    });
    return { data: supplier };
  }

  async update(id: string, input: UpdateSupplierInput) {
    const supplier = await this.prisma.get().supplier.update({
      where: { id },
      data: {
        code: input.code,
        name: input.name,
        nameAr: input.nameAr,
        nameEn: input.nameEn,
        phone: input.phone,
        email: input.email !== undefined ? (input.email || null) : undefined,
        address: input.address,
        country: input.country,
        leadTimeDays: input.leadTimeDays,
        note: input.note,
      },
    });
    return { data: supplier };
  }
}
