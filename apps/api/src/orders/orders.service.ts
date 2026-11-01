import { Inject, Injectable } from "@nestjs/common";
import { fromPrismaOrder, mockOrders } from "@motogearsouq/shared";
import type { Order } from "@motogearsouq/shared";
import { withDb, type DbResult } from "../common/with-db";
import { PrismaService } from "../prisma/prisma.service";

export interface OrderFilter {
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface OrderPage {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable()
export class OrdersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getOrders(filter: OrderFilter = {}): Promise<DbResult<OrderPage>> {
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? 20));
    const where: Record<string, unknown> = { deletedAt: null };
    if (filter.status) where.status = filter.status;
    const data = await withDb<{ items: Order[]; total: number }>(
      this.prisma,
      async (db) => {
        const [items, total] = await Promise.all([
          db.order.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { createdAt: "desc" },
            include: {
              customer: true,
              branch: true,
              employee: true,
              _count: { select: { items: true } },
            },
          }),
          db.order.count({ where }),
        ]);
        return { items: items.map(fromPrismaOrder), total };
      },
      () => {
        const filtered = mockOrders
          .filter((order) => !filter.status || order.status === filter.status)
          .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        const start = (page - 1) * pageSize;
        return { items: filtered.slice(start, start + pageSize), total: filtered.length };
      },
    );
    return {
      data: {
        items: data.data.items,
        total: data.data.total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(data.data.total / pageSize)),
      },
      isMock: data.isMock,
    };
  }

  getOrderById(id: string): Promise<DbResult<Order | null>> {
    return withDb(
      this.prisma,
      async (db) => {
        const order = await db.order.findFirst({
          where: { id, deletedAt: null },
          include: {
            customer: true,
            branch: true,
            employee: true,
            items: { include: { product: { include: { brand: true } } } },
          },
        });
        return order ? fromPrismaOrder(order) : null;
      },
      () => mockOrders.find((item) => item.id === id) ?? null,
    );
  }
}
