import { Inject, Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import type { CreatePurchaseOrderInput, UpdatePurchaseStatusInput } from "@motogearsouq/shared";

@Injectable()
export class PurchasesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getPurchases(query: { status?: string; supplierId?: string; branchId?: string; page?: string; pageSize?: string }) {
    const page = Math.max(1, parseInt(query.page ?? "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize ?? "25", 10)));
    const skip = (page - 1) * pageSize;

    const where: Prisma.PurchaseOrderWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.supplierId) where.supplierId = query.supplierId;
    if (query.branchId) where.branchId = query.branchId;

    const [items, total] = await Promise.all([
      this.prisma.get().purchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { id: true, code: true, name: true } },
          branch: { select: { id: true, code: true, nameAr: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      this.prisma.get().purchaseOrder.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getPurchaseById(id: string) {
    const po = await this.prisma.get().purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        branch: true,
        items: {
          include: { product: { select: { id: true, code: true, name: true, unitOfMeasure: true } } },
        },
        stockMovements: true,
      },
    });
    return { data: po };
  }

  async create(input: CreatePurchaseOrderInput) {
    // Generate PO-YYYY-NNNNN
    const year = new Date().getFullYear();
    const count = await this.prisma.get().purchaseOrder.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
        },
      },
    });
    const orderNumber = `PO-${year}-${String(count + 1).padStart(5, "0")}`;

    let subtotal = 0;
    const itemsData = input.items.map((item) => {
      const lineTotal = item.quantity * item.unitCost;
      subtotal += lineTotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        lineTotal,
      };
    });

    const shippingCost = input.shippingCost ?? 0;
    const customsCost = input.customsCost ?? 0;
    const taxAmount = 0; // standard or computed if needed
    const total = subtotal + taxAmount + shippingCost + customsCost;

    const po = await this.prisma.get().purchaseOrder.create({
      data: {
        orderNumber,
        supplierId: input.supplierId,
        branchId: input.branchId,
        status: "draft",
        subtotal,
        taxAmount,
        shippingCost,
        customsCost,
        total,
        notes: input.notes,
        expectedDeliveryDate: input.expectedDeliveryDate ? new Date(input.expectedDeliveryDate) : null,
        items: {
          create: itemsData,
        },
      },
      include: {
        supplier: true,
        branch: true,
        items: {
          include: { product: true },
        },
      },
    });

    return { data: po };
  }

  async updateStatus(id: string, input: UpdatePurchaseStatusInput) {
    const po = await this.prisma.get().purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!po) throw new NotFoundException(`Purchase order "${id}" not found`);

    if (po.status === "received") {
      throw new BadRequestException("Cannot modify status of a received purchase order");
    }

    if (input.status === "cancelled" && po.status === "received") {
      throw new BadRequestException("Cannot cancel a received purchase order. Use manual stock adjustments instead.");
    }

    return await this.prisma.get().$transaction(async (tx) => {
      if (input.status === "received") {
        // Increment inventory and create stock movements
        for (const item of po.items) {
          const inv = await tx.branchInventory.findUnique({
            where: {
              branchId_productId: {
                branchId: po.branchId,
                productId: item.productId,
              },
            },
          });

          const newQty = (inv?.quantity ?? 0) + item.quantity;
          if (inv) {
            await tx.branchInventory.update({
              where: { id: inv.id },
              data: { quantity: newQty },
            });
          } else {
            await tx.branchInventory.create({
              data: {
                branchId: po.branchId,
                productId: item.productId,
                quantity: item.quantity,
              },
            });
          }

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              branchId: po.branchId,
              type: "purchase",
              quantityDelta: item.quantity,
              referenceId: po.id,
              purchaseOrderId: po.id,
              notes: `Received via PO ${po.orderNumber}`,
            },
          });
        }

        const updated = await tx.purchaseOrder.update({
          where: { id },
          data: {
            status: "received",
            receivedAt: new Date(),
          },
          include: {
            supplier: true,
            branch: true,
            items: { include: { product: true } },
            stockMovements: true,
          },
        });

        return { data: updated };
      } else {
        const updated = await tx.purchaseOrder.update({
          where: { id },
          data: { status: input.status },
          include: {
            supplier: true,
            branch: true,
            items: { include: { product: true } },
            stockMovements: true,
          },
        });

        return { data: updated };
      }
    });
  }
}
