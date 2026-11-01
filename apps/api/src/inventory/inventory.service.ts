import { Inject, Injectable } from "@nestjs/common";
import { fromPrismaBranchInventory, isLowStock, mockInventory } from "@motogearsouq/shared";
import type { BranchInventory } from "@motogearsouq/shared";
import { withDb, type DbResult } from "../common/with-db";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InventoryService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  // Inventory can be viewed globally or scoped to one branch (admin selector).
  getInventory(branchId?: string): Promise<DbResult<BranchInventory[]>> {
    return withDb(
      this.prisma,
      async (db) => {
        const rows = await db.branchInventory.findMany({
          where: branchId ? { branchId } : {},
          orderBy: [{ branchId: "asc" }, { quantity: "asc" }],
          include: {
            branch: true,
            product: { include: { brand: true } },
          },
        });
        return rows.map(fromPrismaBranchInventory);
      },
      () => {
        const rows = mockInventory.filter((item) => !branchId || item.branchId === branchId);
        return [...rows].sort((a, b) => a.quantity - b.quantity);
      },
    );
  }

  async getLowStock(branchId?: string): Promise<DbResult<BranchInventory[]>> {
    const all = await this.getInventory(branchId);
    return { data: all.data.filter(isLowStock), isMock: all.isMock };
  }
}
