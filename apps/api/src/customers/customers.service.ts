import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export interface CustomerListItem {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  customerType: string;
  approvalStatus: string;
  businessName: string | null;
  taxNumber: string | null;
  commercialRegister: string | null;
  createdAt: Date;
  _count?: { orders: number };
}

export interface CustomerPage {
  items: CustomerListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const LIST_SELECT = {
  id: true,
  name: true,
  phone: true,
  email: true,
  customerType: true,
  approvalStatus: true,
  businessName: true,
  taxNumber: true,
  commercialRegister: true,
  createdAt: true,
} as const;

@Injectable()
export class CustomersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(params: {
    page?: number;
    pageSize?: number;
    customerType?: string;
    approvalStatus?: string;
    search?: string;
  }): Promise<CustomerPage> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where: Prisma.CustomerWhereInput = {};
    if (params.customerType) where.customerType = params.customerType;
    if (params.approvalStatus) where.approvalStatus = params.approvalStatus;
    if (params.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.get().customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { ...LIST_SELECT, _count: { select: { orders: true } } },
      }),
      this.prisma.get().customer.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }

  async listPending(page?: number, pageSize?: number): Promise<CustomerPage> {
    return this.list({ page, pageSize, approvalStatus: "pending" });
  }

  async countPending(): Promise<number> {
    return this.prisma.get().customer.count({ where: { approvalStatus: "pending" } });
  }

  async approve(id: string, adminId: string): Promise<CustomerListItem> {
    const existing = await this.prisma.get().customer.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException(`Customer "${id}" not found`);

    const updated = await this.prisma.get().customer.update({
      where: { id },
      data: { approvalStatus: "approved" },
      select: LIST_SELECT,
    });
    console.log("[admin] approved wholesale customer:", id, adminId);
    return updated;
  }

  async reject(id: string, reason: string | undefined, adminId: string): Promise<CustomerListItem> {
    if (!reason || reason.trim().length < 10) {
      throw new BadRequestException("سبب الرفض مطلوب (10 أحرف على الأقل)");
    }
    const existing = await this.prisma.get().customer.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException(`Customer "${id}" not found`);

    const updated = await this.prisma.get().customer.update({
      where: { id },
      data: { approvalStatus: "rejected" },
      select: LIST_SELECT,
    });
    console.log("[admin] rejected wholesale customer:", id, reason, adminId);
    return updated;
  }
}
