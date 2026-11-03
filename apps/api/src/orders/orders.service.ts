import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { fromPrismaOrder, mockOrders } from "@motogearsouq/shared";
import type { Order } from "@motogearsouq/shared";
import type { Prisma } from "@prisma/client";
import { withDb, type DbResult } from "../common/with-db";
import { toDomainError } from "../common/prisma-errors";
import { PrismaService } from "../prisma/prisma.service";
import { ShippingService } from "../shipping/shipping.service";
import { PaymentsService } from "../payments/payments.service";
import { CodLimitService } from "./cod-limit.service";
import { RiskScoreService } from "./risk-score.service";
import type { CreateOrderInput } from "./dto/create-order.schema";

export interface OrderCreateContext {
  ipAddress: string;
  userAgentHash: string;
}

export interface OrderFilter {
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
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

export interface CreatedOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  redirectUrl?: string;
  instructions?: string;
}

export interface TrackOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface TrackOrder {
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  estimatedDelivery: string | null;
  phone: string; // masked (e.g. 010****5678)
  items: TrackOrderItem[];
}

// Allowed status transitions (lowercase). Terminal states have no exits.
const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

const ESTIMATED_DELIVERY_DAYS = 3;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function maskPhone(phone: string): string {
  if (phone.length < 7) return "****";
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

@Injectable()
export class OrdersService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ShippingService) private readonly shippingService: ShippingService,
    @Inject(PaymentsService) private readonly paymentsService: PaymentsService,
    @Inject(CodLimitService) private readonly codLimit: CodLimitService,
    @Inject(RiskScoreService) private readonly riskScore: RiskScoreService,
  ) {}

  async getOrders(filter: OrderFilter = {}): Promise<DbResult<OrderPage>> {
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? 20));
    const where: Record<string, unknown> = { deletedAt: null };
    if (filter.status) where.status = filter.status;
    if (filter.paymentStatus) where.paymentStatus = filter.paymentStatus;
    if (filter.paymentMethod) where.paymentMethod = filter.paymentMethod;
    if (filter.dateFrom || filter.dateTo) {
      const createdAt: Record<string, Date> = {};
      if (filter.dateFrom) createdAt.gte = new Date(filter.dateFrom);
      if (filter.dateTo) {
        const d = new Date(filter.dateTo);
        d.setHours(23, 59, 59, 999);
        createdAt.lte = d;
      }
      where.createdAt = createdAt;
    }
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

  // ---------- Authenticated checkout (Sprint 5C-1: no guest orders) ----------

  async createOrder(
    input: CreateOrderInput,
    customerId: string,
    context: OrderCreateContext,
  ): Promise<DbResult<CreatedOrder>> {
    // Merge duplicate product lines so stock math stays per-product.
    const quantities = new Map<string, number>();
    for (const item of input.items) {
      quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
    }

    const paymentMethod = input.paymentMethod ?? "cod";
    const shippingMethod = input.shippingMethod ?? "standard";

    if (!process.env.DATABASE_URL) {
      // Mock mode: nothing persisted, stable placeholder response.
      const year = new Date().getFullYear();
      let redirectUrl: string | undefined;
      if (paymentMethod === "mock") {
        redirectUrl = `/ar/checkout/mock-pay?order=SO-${year}-00001&ref=mock-${Date.now()}`;
      }
      return {
        data: {
          id: `tmp-${Date.now()}`,
          orderNumber: `SO-${year}-00001`,
          total: 0,
          status: "pending",
          redirectUrl,
        },
        isMock: true,
      };
    }

    try {
      const db = this.prisma.get();

      // 0. Identity comes from the authenticated customer — never from the body.
      const customer = await db.customer.findUnique({ where: { id: customerId } });
      if (!customer) throw new NotFoundException("Customer not found");
      if (!customer.isActive) throw new BadRequestException("الحساب موقوف");

      // Shipping: body wins (editable form), profile is the fallback/pre-fill.
      const shippingAddress = input.shippingAddress?.trim() || customer.address || null;
      const shippingCity = input.shippingCity?.trim() || null;
      const shippingGovernorate = input.shippingGovernorate?.trim() || customer.governorate || null;
      if (!shippingAddress || !shippingCity || !shippingGovernorate) {
        throw new BadRequestException("بيانات الشحن غير مكتملة (العنوان والمدينة والمحافظة مطلوبة)");
      }

      // 1. Validate products exist, are active, and have a retail price.
      const products = await db.product.findMany({
        where: { id: { in: [...quantities.keys()] }, active: true, deletedAt: null },
      });
      const byId = new Map(products.map((p) => [p.id, p]));
      for (const productId of quantities.keys()) {
        if (!byId.has(productId)) {
          throw new BadRequestException(`Product not found or inactive: ${productId}`);
        }
      }

      // 2. Compute money (prices exclude VAT; tax added on top).
      let subtotal = 0;
      let tax = 0;
      for (const [productId, quantity] of quantities) {
        const product = byId.get(productId)!;
        if (product.retailPrice == null) {
          throw new BadRequestException(`Product has no price: ${product.name}`);
        }
        const lineTotal = Number(product.retailPrice) * quantity;
        subtotal += lineTotal;
        tax += lineTotal * Number(product.taxRate);
      }
      subtotal = round2(subtotal);
      tax = round2(tax);

      // Calculate shipping cost
      const shippingQuote = await this.shippingService.calculate(
        subtotal,
        shippingGovernorate,
        shippingCity,
        paymentMethod === "cod" ? "cod" : shippingMethod,
      );
      const shippingCost = shippingQuote.fee;
      const total = round2(subtotal + tax + shippingCost);

      // 2b. COD limit enforcement (progressive: 5k → 15k → 30k → unlimited).
      let codLimitAtPurchase: number | null = null;
      if (paymentMethod === "cod") {
        const codCheck = await this.codLimit.validateCodOrder(customer.id, total);
        if (!codCheck.allowed) {
          throw new BadRequestException(codCheck.message);
        }
        codLimitAtPurchase = Number.isFinite(codCheck.limit) ? codCheck.limit : null;
      }

      // 2c. Anti-fraud risk score (before any side effects).
      const risk = await this.riskScore.calculate({
        customerId,
        orderTotal: total,
        ipAddress: context.ipAddress,
        userAgentHash: context.userAgentHash,
      });

      if (paymentMethod === "cod" && risk.blockCod) {
        throw new BadRequestException("نظامنا لاحظ نشاطاً غير معتاد. يرجى الدفع أونلاين لإتمام الطلب.");
      }

      let notes = input.notes || null;
      if (risk.level === "high") {
        // Admin notification (console for now — Resend in Sprint 6). Never log raw IPs.
        console.log(
          `[fraud] high-risk order flagged (score: ${risk.score}) for customer ${customer.id}`,
        );
        const flagNote = `Order flagged as high risk (score: ${risk.score})`;
        notes = notes ? `${notes}\n${flagNote}` : flagNote;
      }

      // 3. Pick a branch inventory row per product that can cover quantity.
      const inventories = await db.branchInventory.findMany({
        where: { productId: { in: [...quantities.keys()] }, quantity: { gt: 0 } },
        orderBy: { quantity: "desc" },
      });
      const stockPlans: { inventoryId: string; branchId: string; productId: string; productName: string; quantity: number }[] = [];
      for (const [productId, quantity] of quantities) {
        const row = inventories.find((i) => i.productId === productId && i.quantity >= quantity);
        if (!row) {
          throw new BadRequestException(`Out of stock: ${byId.get(productId)!.name}`);
        }
        stockPlans.push({
          inventoryId: row.id,
          branchId: row.branchId,
          productId,
          productName: byId.get(productId)!.name,
          quantity,
        });
      }

      // 4. Create order + items + stock deduction atomically.
      const created = await db.$transaction(async (tx) => {
        const orderNumber = await this.generateOrderNumber(tx);

        const order = await tx.order.create({
          data: {
            orderNumber,
            customerId: customer.id,
            status: "pending",
            subtotal,
            taxAmount: tax,
            discount: 0,
            total,
            paymentMethod,
            paymentStatus: "pending",
            shippingCost,
            shippingMethod,
            notes,
            shippingAddress,
            shippingCity,
            shippingGovernorate,
            shippingPhone: customer.phone,
            codLimitAtPurchase,
            riskScore: risk.score,
            riskLevel: risk.level,
            riskBreakdown: risk.breakdown as unknown as Prisma.InputJsonValue,
            ipAddress: context.ipAddress,
            userAgentHash: context.userAgentHash,
            items: {
              create: [...quantities.entries()].map(([productId, quantity]) => {
                const product = byId.get(productId)!;
                const unitPrice = Number(product.retailPrice);
                const lineTotal = round2(unitPrice * quantity);
                return {
                  productId,
                  quantity,
                  unitPrice,
                  discount: 0,
                  lineTotal,
                };
              }),
            },
          },
        });

        for (const plan of stockPlans) {
          const deducted = await tx.branchInventory.updateMany({
            where: { id: plan.inventoryId, quantity: { gte: plan.quantity } },
            data: { quantity: { decrement: plan.quantity } },
          });
          if (deducted.count === 0) {
            throw new BadRequestException(`Out of stock: ${plan.productName}`);
          }

          await tx.stockMovement.create({
            data: {
              productId: plan.productId,
              branchId: plan.branchId,
              type: "sale",
              quantityDelta: -plan.quantity,
              referenceId: order.id,
              notes: `Sold via Order ${order.orderNumber}`,
            },
          });
        }

        await tx.customer.update({
          where: { id: customer.id },
          data: { lastOrderAt: new Date() },
        });

        return order;
      });

      let redirectUrl: string | undefined;
      let instructions: string | undefined;

      if (paymentMethod !== "cod") {
        try {
          const paymentRes = await this.paymentsService.initiate(created.orderNumber, paymentMethod);
          redirectUrl = paymentRes.redirectUrl;
          instructions = paymentRes.instructions;
        } catch {
          // Ignore if provider unconfigured in test environment
        }
      }

      return {
        data: {
          id: created.id,
          orderNumber: created.orderNumber,
          total: Number(created.total),
          status: created.status,
          redirectUrl,
          instructions,
        },
        isMock: false,
      };
    } catch (error) {
      toDomainError(error);
    }
  }

  async updateStatus(id: string, status: string): Promise<DbResult<Order>> {
    if (!process.env.DATABASE_URL) {
      const mock = mockOrders.find((order) => order.id === id);
      if (!mock) throw new NotFoundException(`Order "${id}" not found`);
      this.assertTransition(mock.status, status);
      mock.status = status;
      return { data: { ...mock, updatedAt: new Date().toISOString() }, isMock: true };
    }

    try {
      const db = this.prisma.get();
      const existing = await db.order.findFirst({
        where: { id, deletedAt: null },
        include: { items: true },
      });
      if (!existing) throw new NotFoundException(`Order "${id}" not found`);
      this.assertTransition(existing.status, status);

      const updated = await db.$transaction(async (tx) => {
        if (status === "cancelled") {
          await this.restoreStock(tx, existing.id, existing.orderNumber, existing.items);
          // Failed delivery: COD order cancelled AFTER it was confirmed/shipped.
          // User cancel before "confirmed" is not the customer's fault.
          const wasFailedDelivery =
            existing.paymentMethod === "cod" &&
            ["confirmed", "shipped"].includes(existing.status);
          if (wasFailedDelivery && existing.customerId) {
            await tx.customer.update({
              where: { id: existing.customerId },
              data: { failedDeliveries: { increment: 1 } },
            });
            console.log(
              `[orders] failed delivery counted for customer ${existing.customerId} (order ${existing.orderNumber})`,
            );
          }
        }
        if (status === "delivered" && existing.customerId) {
          // Progressive COD limits: a successful delivery raises the next limit.
          await tx.customer.update({
            where: { id: existing.customerId },
            data: { successfulDeliveries: { increment: 1 } },
          });
        }
        return tx.order.update({
          where: { id },
          data: { status },
          include: {
            customer: true,
            branch: true,
            employee: true,
            items: { include: { product: { include: { brand: true } } } },
          },
        });
      });
      return { data: fromPrismaOrder(updated), isMock: false };
    } catch (error) {
      toDomainError(error);
    }
  }

  async trackByNumber(orderNumber: string): Promise<DbResult<TrackOrder>> {
    if (!process.env.DATABASE_URL) {
      const mock = mockOrders.find((order) => order.orderNumber === orderNumber);
      if (!mock) throw new NotFoundException(`Order "${orderNumber}" not found`);
      return {
        data: {
          orderNumber: mock.orderNumber,
          status: mock.status,
          total: mock.total,
          createdAt: String(mock.createdAt),
          estimatedDelivery: this.estimatedDelivery(mock.status, String(mock.createdAt)),
          phone: maskPhone(mock.customer?.phone ?? ""),
          items: (mock.items ?? []).map((item) => ({
            productId: item.productId,
            name: item.product?.name ?? "",
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          })),
        },
        isMock: true,
      };
    }

    try {
      const order = await this.prisma.get().order.findFirst({
        where: { orderNumber, deletedAt: null },
        include: { customer: true, items: { include: { product: true } } },
      });
      if (!order) throw new NotFoundException(`Order "${orderNumber}" not found`);
      return {
        data: {
          orderNumber: order.orderNumber,
          status: order.status,
          total: Number(order.total),
          createdAt: order.createdAt.toISOString(),
          estimatedDelivery: this.estimatedDelivery(order.status, order.createdAt.toISOString()),
          phone: maskPhone(order.shippingPhone ?? order.customer?.phone ?? ""),
          items: order.items.map((item) => ({
            productId: item.productId,
            name: item.product?.name ?? "",
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            lineTotal: Number(item.lineTotal),
          })),
        },
        isMock: false,
      };
    } catch (error) {
      toDomainError(error);
    }
  }

  // ---------- Helpers ----------

  private assertTransition(from: string, to: string): void {
    const allowed = STATUS_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(`Invalid status transition: ${from} → ${to}`);
    }
  }

  private estimatedDelivery(status: string, createdAt: string): string | null {
    if (!["pending", "confirmed", "shipped"].includes(status)) return null;
    const base = new Date(createdAt).getTime();
    return new Date(base + ESTIMATED_DELIVERY_DAYS * 24 * 60 * 60 * 1000).toISOString();
  }

  private async generateOrderNumber(db: Prisma.TransactionClient): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `SO-${year}-`;
    const count = await db.order.count({ where: { orderNumber: { startsWith: prefix } } });
    return `${prefix}${String(count + 1).padStart(5, "0")}`;
  }

  private async restoreStock(
    db: Prisma.TransactionClient,
    orderId: string,
    orderNumber: string,
    items: { productId: string; quantity: number }[],
  ): Promise<void> {
    for (const item of items) {
      const row = await db.branchInventory.findFirst({
        where: { productId: item.productId },
        orderBy: { quantity: "desc" },
      });
      if (row) {
        await db.branchInventory.update({
          where: { id: row.id },
          data: { quantity: { increment: item.quantity } },
        });

        await db.stockMovement.create({
          data: {
            productId: item.productId,
            branchId: row.branchId,
            type: "return",
            quantityDelta: item.quantity,
            referenceId: orderId,
            notes: `Returned via cancelled Order ${orderNumber}`,
          },
        });
      }
    }
  }
}
