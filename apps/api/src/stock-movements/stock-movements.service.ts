import { Inject, Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import type { StockAdjustmentInput } from "@motogearsouq/shared";

@Injectable()
export class StockMovementsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getMovements(query: { productId?: string; branchId?: string; type?: string; page?: string; pageSize?: string }) {
    const page = Math.max(1, parseInt(query.page ?? "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize ?? "25", 10)));
    const skip = (page - 1) * pageSize;

    const where: Prisma.StockMovementWhereInput = {};
    if (query.productId) where.productId = query.productId;
    if (query.branchId) where.branchId = query.branchId;
    if (query.type) where.type = query.type;

    const [items, total] = await Promise.all([
      this.prisma.get().stockMovement.findMany({
        where,
        include: {
          product: { select: { id: true, code: true, name: true, unitOfMeasure: true } },
          branch: { select: { id: true, code: true, nameAr: true } },
          purchaseOrder: { select: { id: true, orderNumber: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      this.prisma.get().stockMovement.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async createAdjustment(input: StockAdjustmentInput) {
    if (input.quantityDelta === 0) {
      throw new BadRequestException("Quantity delta cannot be zero");
    }

    return await this.prisma.get().$transaction(async (tx) => {
      // 1. Find or create branch inventory
      let inv = await tx.branchInventory.findUnique({
        where: {
          branchId_productId: {
            branchId: input.branchId,
            productId: input.productId,
          },
        },
      });

      const currentQty = inv?.quantity ?? 0;
      const newQty = currentQty + input.quantityDelta;
      if (newQty < 0) {
        throw new BadRequestException(`Resulting stock quantity cannot be negative (${newQty})`);
      }

      if (inv) {
        inv = await tx.branchInventory.update({
          where: { id: inv.id },
          data: { quantity: newQty },
        });
      } else {
        inv = await tx.branchInventory.create({
          data: {
            branchId: input.branchId,
            productId: input.productId,
            quantity: newQty,
          },
        });
      }

      // 2. Create stock movement
      const movement = await tx.stockMovement.create({
        data: {
          productId: input.productId,
          branchId: input.branchId,
          type: "adjustment",
          quantityDelta: input.quantityDelta,
          notes: input.notes,
        },
        include: {
          product: { select: { id: true, code: true, name: true } },
          branch: { select: { id: true, nameAr: true } },
        },
      });

      return { data: { movement, inventory: inv } };
    });
  }

  async getSummary() {
    const movements = await this.prisma.get().stockMovement.groupBy({
      by: ["productId", "type"],
      _sum: {
        quantityDelta: true,
      },
    });
    return { data: movements };
  }
}
