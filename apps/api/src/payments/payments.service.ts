import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ShippingService } from "../shipping/shipping.service";
import { PaymentProviderFactory } from "./payment-provider.factory";

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ShippingService) private readonly shippingService: ShippingService,
    @Inject(PaymentProviderFactory) private readonly factory: PaymentProviderFactory,
  ) {}

  async initiate(orderNumber: string, method: string, returnUrl?: string) {
    const db = this.prisma.get();
    const order = await db.order.findUnique({
      where: { orderNumber },
      include: { customer: true },
    });
    if (!order) throw new NotFoundException(`Order not found: ${orderNumber}`);
    if (order.paymentStatus === "paid") {
      throw new BadRequestException("Order is already paid");
    }

    const provider = await this.factory.get(method);
    const amount = Number(order.total);
    const currency = "EGP";
    const customer = {
      name: order.customer?.name ?? order.shippingPhone ?? "Customer",
      phone: order.shippingPhone ?? order.customer?.phone ?? "01000000000",
      email: order.customer?.email ?? undefined,
    };
    const defaultReturn = `/${order.orderNumber}`;
    const res = await provider.initiate({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount,
      currency,
      customer,
      returnUrl: returnUrl ?? defaultReturn,
      cancelUrl: returnUrl ?? defaultReturn,
    });

    await db.paymentTransaction.create({
      data: {
        orderId: order.id,
        provider: provider.name,
        providerRef: res.providerRef ?? null,
        amount,
        currency,
        status: "pending",
        method,
        rawPayload: res.rawResponse ? (res.rawResponse as Prisma.InputJsonValue) : undefined,
      },
    });

    await db.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: method,
        paymentStatus: "pending",
        paymentReference: res.providerRef ?? null,
      },
    });

    return {
      success: res.success,
      redirectUrl: res.redirectUrl,
      instructions: res.instructions,
      providerRef: res.providerRef,
    };
  }

  async mockComplete(providerRef: string, success: boolean) {
    const db = this.prisma.get();
    const tx = await db.paymentTransaction.findFirst({
      where: { providerRef },
      include: { order: true },
    });
    if (!tx) throw new NotFoundException(`Payment transaction not found for ref: ${providerRef}`);

    const status = success ? "success" : "failed";
    const orderPaymentStatus = success ? "paid" : "failed";

    await db.paymentTransaction.update({
      where: { id: tx.id },
      data: { status },
    });

    await db.order.update({
      where: { id: tx.orderId },
      data: {
        paymentStatus: orderPaymentStatus,
        paidAt: success ? new Date() : null,
      },
    });

    return {
      success,
      orderNumber: tx.order.orderNumber,
      redirectUrl: `/ar/orders/${tx.order.orderNumber}?payment=${success ? "success" : "failed"}`,
    };
  }

  async markPaid(orderId: string) {
    const db = this.prisma.get();
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order not found: ${orderId}`);

    const amount = Number(order.total);
    await db.paymentTransaction.create({
      data: {
        orderId: order.id,
        provider: "manual",
        providerRef: `manual-${Date.now()}`,
        amount,
        currency: "EGP",
        status: "success",
        method: order.paymentMethod ?? "cod",
      },
    });

    return db.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "paid",
        paidAt: new Date(),
      },
    });
  }

  async refund(orderId: string) {
    const db = this.prisma.get();
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order not found: ${orderId}`);

    const amount = Number(order.total);
    await db.paymentTransaction.create({
      data: {
        orderId: order.id,
        provider: "manual",
        providerRef: `refund-${Date.now()}`,
        amount,
        currency: "EGP",
        status: "refunded",
        method: order.paymentMethod ?? "cod",
      },
    });

    return db.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "refunded",
      },
    });
  }

  async listTransactions(filter: {
    orderId?: string;
    provider?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) {
    const db = this.prisma.get();
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? 20));
    const where: Record<string, unknown> = {};
    if (filter.orderId) where.orderId = filter.orderId;
    if (filter.provider) where.provider = filter.provider;
    if (filter.status) where.status = filter.status;

    const [items, total] = await Promise.all([
      db.paymentTransaction.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: { order: { select: { orderNumber: true } } },
      }),
      db.paymentTransaction.count({ where }),
    ]);

    return {
      items: items.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }
}
