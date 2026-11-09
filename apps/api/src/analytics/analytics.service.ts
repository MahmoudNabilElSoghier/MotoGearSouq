import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { CompanySettings } from "@prisma/client";
import { toNumberOrZero, type DeadStockResponse, type UpdateCompanySettingsInput } from "@motogearsouq/shared";
import { PrismaService } from "../prisma/prisma.service";

const PERIOD_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "365d": 365,
};

// Fixed costs are monthly; a period of D days is D/30 of a month.
const MONTHLY_DAYS = 30;

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

const safeDiv = (num: number, den: number): number => (den > 0 ? num / den : 0);

interface PeriodRange {
  period: string;
  days: number;
  from: Date;
  to: Date;
}

type PeriodOrder = Awaited<ReturnType<AnalyticsService["loadPeriodOrders"]>>[number];

@Injectable()
export class AnalyticsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  // ---------- helpers ----------

  private parsePeriod(period: string | undefined, fallback: string): PeriodRange {
    const key = period && period.length > 0 ? period : fallback;
    const days = PERIOD_DAYS[key];
    if (!days) {
      throw new BadRequestException(`Invalid period "${key}". Allowed: 7d, 30d, 90d, 365d`);
    }
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    return { period: key, days, from, to };
  }

  loadPeriodOrders(from: Date, to: Date) {
    return this.prisma.get().order.findMany({
      where: { createdAt: { gte: from, lte: to }, deletedAt: null },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, code: true, name: true, costPrice: true, retailPrice: true },
            },
          },
        },
        branch: { select: { id: true, nameAr: true } },
      },
    });
  }

  private activeOrders(orders: PeriodOrder[]) {
    return orders.filter((o) => o.status !== "cancelled");
  }

  private periodJson(range: PeriodRange) {
    return { from: range.from.toISOString(), to: range.to.toISOString() };
  }

  private async getSettingsRow(): Promise<CompanySettings> {
    const existing = await this.prisma.get().companySettings.findFirst();
    if (existing) return existing;
    try {
      return await this.prisma.get().companySettings.create({
        data: { id: "singleton" },
      });
    } catch (error) {
      // A concurrent request created the row between our read and write —
      // reuse it instead of surfacing the unique-constraint error.
      const code = (error as { code?: string } | null)?.code;
      if (code !== "P2002") throw error;
      const row = await this.prisma.get().companySettings.findFirst();
      if (!row) throw error;
      return row;
    }
  }

  private serializeSettings(s: CompanySettings) {
    return {
      id: s.id,
      monthlyRent: toNumberOrZero(s.monthlyRent),
      monthlySalaries: toNumberOrZero(s.monthlySalaries),
      monthlyUtilities: toNumberOrZero(s.monthlyUtilities),
      monthlyMarketing: toNumberOrZero(s.monthlyMarketing),
      monthlyOther: toNumberOrZero(s.monthlyOther),
      vatRate: toNumberOrZero(s.vatRate),
      updatedAt: s.updatedAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
    };
  }

  // ---------- 2.1 settings ----------

  async getSettings() {
    const row = await this.getSettingsRow();
    return { data: this.serializeSettings(row) };
  }

  async updateSettings(input: UpdateCompanySettingsInput) {
    const row = await this.prisma.get().companySettings.upsert({
      where: { id: "singleton" },
      update: input,
      create: { id: "singleton", ...input },
    });
    return { data: this.serializeSettings(row) };
  }

  // ---------- 2.2 dashboard ----------

  async getDashboard(period?: string) {
    const range = this.parsePeriod(period, "30d");
    const [orders, firstOrders] = await Promise.all([
      this.loadPeriodOrders(range.from, range.to),
      this.prisma.get().order.groupBy({
        by: ["customerId"],
        where: { customerId: { not: null }, deletedAt: null },
        _min: { createdAt: true },
      }),
    ]);

    const active = this.activeOrders(orders);
    const cancelled = orders.filter((o) => o.status === "cancelled");

    const totalRevenue = round2(active.reduce((sum, o) => sum + Number(o.total), 0));
    const totalOrders = active.length;
    const avgOrderValue = totalOrders > 0 ? round2(totalRevenue / totalOrders) : 0;

    // per-product aggregation (for cost + top products)
    const byProduct = new Map<
      string,
      { productId: string; code: string; name: string; unitsSold: number; revenue: number; cost: number }
    >();
    for (const order of active) {
      for (const item of order.items) {
        const costPrice = toNumberOrZero(item.product?.costPrice);
        const agg =
          byProduct.get(item.productId) ??
          ({
            productId: item.productId,
            code: item.product?.code ?? "",
            name: item.product?.name ?? "",
            unitsSold: 0,
            revenue: 0,
            cost: 0,
          });
        agg.unitsSold += item.quantity;
        agg.revenue += Number(item.lineTotal);
        agg.cost += item.quantity * costPrice;
        byProduct.set(item.productId, agg);
      }
    }

    const totalCost = round2([...byProduct.values()].reduce((s, p) => s + p.cost, 0));
    const grossProfit = round2(totalRevenue - totalCost);
    const grossMarginPercent = totalRevenue > 0 ? round2((grossProfit / totalRevenue) * 100) : 0;

    const cancelledOrders = cancelled.length;
    const returnedAmount = round2(cancelled.reduce((sum, o) => sum + Number(o.total), 0));

    const fromMs = range.from.getTime();
    const toMs = range.to.getTime();
    const newCustomers = firstOrders.filter((r) => {
      const d = r._min.createdAt;
      return d !== null && d.getTime() >= fromMs && d.getTime() <= toMs;
    }).length;

    const topProducts = [...byProduct.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((p) => ({
        productId: p.productId,
        code: p.code,
        name: p.name,
        unitsSold: p.unitsSold,
        revenue: round2(p.revenue),
        profit: round2(p.revenue - p.cost),
      }));

    const branchMap = new Map<string, { branchId: string | null; nameAr: string; orders: number; revenue: number }>();
    for (const order of active) {
      const key = order.branchId ?? "none";
      const entry =
        branchMap.get(key) ??
        ({ branchId: order.branchId, nameAr: order.branch?.nameAr ?? "—", orders: 0, revenue: 0 });
      entry.orders += 1;
      entry.revenue += Number(order.total);
      branchMap.set(key, entry);
    }
    const salesByBranch = [...branchMap.values()]
      .map((b) => ({
        branchId: b.branchId ?? "none",
        branchName: b.nameAr,
        orderCount: b.orders,
        revenue: round2(b.revenue),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      data: {
        period: this.periodJson(range),
        kpis: {
          totalRevenue,
          totalOrders,
          avgOrderValue,
          totalCost,
          grossProfit,
          grossMarginPercent,
          newCustomers,
          cancelledOrders,
          returnedAmount,
        },
        topProducts,
        salesByBranch,
      },
    };
  }

  // ---------- 2.3 break-even ----------

  async getBreakEven(period?: string) {
    const range = this.parsePeriod(period, "30d");
    const [settings, orders] = await Promise.all([
      this.getSettingsRow(),
      this.loadPeriodOrders(range.from, range.to),
    ]);

    const active = this.activeOrders(orders);
    const totalRevenue = round2(active.reduce((sum, o) => sum + Number(o.total), 0));

    let totalCOGS = 0;
    let unitsSold = 0;
    for (const order of active) {
      for (const item of order.items) {
        totalCOGS += item.quantity * toNumberOrZero(item.product?.costPrice);
        unitsSold += item.quantity;
      }
    }
    const cogs = round2(totalCOGS);
    const variableCostRatio = round2(safeDiv(cogs, totalRevenue));
    const contributionMargin = round2(totalRevenue - cogs);
    const contributionMarginRatio = round2(safeDiv(contributionMargin, totalRevenue));

    const fixedCosts = {
      monthlyRent: toNumberOrZero(settings.monthlyRent),
      monthlySalaries: toNumberOrZero(settings.monthlySalaries),
      monthlyUtilities: toNumberOrZero(settings.monthlyUtilities),
      monthlyMarketing: toNumberOrZero(settings.monthlyMarketing),
      monthlyOther: toNumberOrZero(settings.monthlyOther),
      totalMonthly: 0,
    };
    fixedCosts.totalMonthly = round2(
      fixedCosts.monthlyRent +
        fixedCosts.monthlySalaries +
        fixedCosts.monthlyUtilities +
        fixedCosts.monthlyMarketing +
        fixedCosts.monthlyOther,
    );

    // Scale monthly fixed costs to the selected period (D days = D/30 months).
    const periodFixedCosts = fixedCosts.totalMonthly * (range.days / MONTHLY_DAYS);
    // Use the unrounded ratio for the formula; guard division by zero.
    const rawMarginRatio = totalRevenue > 0 ? (totalRevenue - cogs) / totalRevenue : 0;
    const breakEvenRevenue = rawMarginRatio > 0 ? round2(periodFixedCosts / rawMarginRatio) : 0;
    const avgUnitPrice = unitsSold > 0 ? totalRevenue / unitsSold : 0;
    const breakEvenUnits = avgUnitPrice > 0 ? Math.ceil(breakEvenRevenue / avgUnitPrice) : 0;

    const currentRevenue = totalRevenue;
    const marginOfSafety =
      currentRevenue > 0 ? round2((currentRevenue - breakEvenRevenue) / currentRevenue) : 0;
    const diff = round2(currentRevenue - breakEvenRevenue);
    const status: "below" | "above" | "at" = diff > 0.005 ? "above" : diff < -0.005 ? "below" : "at";

    return {
      data: {
        period: this.periodJson(range),
        days: range.days,
        fixedCosts: {
          ...fixedCosts,
          periodFixedCosts: round2(periodFixedCosts),
        },
        variableCosts: { totalCOGS: cogs, variableCostRatio },
        contribution: {
          totalRevenue,
          contributionMargin,
          contributionMarginRatio,
          breakEvenRevenue,
          breakEvenUnits,
          currentRevenue,
          marginOfSafety,
          status,
        },
      },
    };
  }

  // ---------- 2.4 ABC analysis ----------

  async getAbcAnalysis(period?: string) {
    const range = this.parsePeriod(period, "90d");
    const orders = await this.loadPeriodOrders(range.from, range.to);
    const active = this.activeOrders(orders);

    const byProduct = new Map<string, { productId: string; code: string; name: string; revenue: number; unitsSold: number }>();
    for (const order of active) {
      for (const item of order.items) {
        const retail = toNumberOrZero(item.product?.retailPrice);
        const agg =
          byProduct.get(item.productId) ??
          ({ productId: item.productId, code: item.product?.code ?? "", name: item.product?.name ?? "", revenue: 0, unitsSold: 0 });
        agg.revenue += item.quantity * retail;
        agg.unitsSold += item.quantity;
        byProduct.set(item.productId, agg);
      }
    }

    const rows = [...byProduct.values()].filter((r) => r.unitsSold > 0).sort((a, b) => b.revenue - a.revenue);
    const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);

    let cumulative = 0;
    const products = rows.map((r) => {
      cumulative += r.revenue;
      const rawCumulativePercent = totalRevenue > 0 ? (cumulative / totalRevenue) * 100 : 0;
      const cls: "A" | "B" | "C" = rawCumulativePercent <= 80 ? "A" : rawCumulativePercent <= 95 ? "B" : "C";
      return {
        productId: r.productId,
        code: r.code,
        name: r.name,
        revenue: round2(r.revenue),
        unitsSold: r.unitsSold,
        cumulativePercent: round2(rawCumulativePercent),
        class: cls,
      };
    });

    const buildClass = (cls: "A" | "B" | "C") => {
      const items = products.filter((p) => p.class === cls);
      const classRevenue = items.reduce((s, p) => s + p.revenue, 0);
      return {
        products: items,
        count: items.length,
        revenuePercent: totalRevenue > 0 ? round2((classRevenue / totalRevenue) * 100) : 0,
      };
    };

    const classes = { A: buildClass("A"), B: buildClass("B"), C: buildClass("C") };

    return {
      data: {
        period: this.periodJson(range),
        summary: {
          classA: { count: classes.A.count, revenuePercent: classes.A.revenuePercent },
          classB: { count: classes.B.count, revenuePercent: classes.B.revenuePercent },
          classC: { count: classes.C.count, revenuePercent: classes.C.revenuePercent },
        },
        classes,
        products,
      },
    };
  }

  // ---------- 2.5 dead stock ----------

  async getDeadStock(daysParam?: string): Promise<{ data: DeadStockResponse }> {
    const days =
      daysParam === undefined || daysParam === "" ? 90 : Number(daysParam);
    if (!Number.isInteger(days) || days < 1 || days > 3650) {
      throw new BadRequestException("days must be an integer between 1 and 3650");
    }
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const inventory = await this.prisma.get().branchInventory.findMany({
      where: { quantity: { gt: 0 } },
      include: {
        product: { select: { id: true, code: true, name: true, costPrice: true } },
      },
    });

    const byProduct = new Map<string, { productId: string; code: string; name: string; totalStock: number; costPrice: number }>();
    for (const row of inventory) {
      const agg =
        byProduct.get(row.productId) ??
        ({
          productId: row.productId,
          code: row.product.code,
          name: row.product.name,
          totalStock: 0,
          costPrice: toNumberOrZero(row.product.costPrice),
        });
      agg.totalStock += row.quantity;
      byProduct.set(row.productId, agg);
    }

    const ids = [...byProduct.keys()];
    if (ids.length === 0) {
      return {
        data: { items: [], totalDeadStock: 0, totalChecked: 0, capitalTied: 0, threshold: days },
      };
    }

    const [recentSales, lastSold] = await Promise.all([
      this.prisma.get().stockMovement.findMany({
        where: { type: "sale", createdAt: { gte: cutoff }, productId: { in: ids } },
        select: { productId: true },
        distinct: ["productId"],
      }),
      this.prisma.get().stockMovement.groupBy({
        by: ["productId"],
        where: { type: "sale", productId: { in: ids } },
        _max: { createdAt: true },
      }),
    ]);

    const recentlySold = new Set(recentSales.map((r) => r.productId));
    const lastSoldAt = new Map(lastSold.map((r) => [r.productId, r._max.createdAt]));
    const nowMs = Date.now();

    const items = [...byProduct.values()]
      .filter((p) => !recentlySold.has(p.productId))
      .map((p) => {
        const last = lastSoldAt.get(p.productId) ?? null;
        return {
          productId: p.productId,
          code: p.code,
          name: p.name,
          currentStock: p.totalStock,
          costPrice: round2(p.costPrice),
          capitalTied: round2(p.totalStock * p.costPrice),
          lastSoldAt: last ? last.toISOString() : null,
          daysSinceLastSale: last ? Math.floor((nowMs - last.getTime()) / (24 * 60 * 60 * 1000)) : null,
        };
      })
      .sort((a, b) => b.capitalTied - a.capitalTied || b.currentStock - a.currentStock);

    const capitalTied = round2(items.reduce((s, p) => s + p.capitalTied, 0));
    return {
      data: {
        items,
        totalDeadStock: items.length,
        totalChecked: byProduct.size,
        capitalTied,
        threshold: days,
      },
    };
  }

  // ---------- 2.6 stock valuation ----------

  async getStockValuation() {
    const inventory = await this.prisma.get().branchInventory.findMany({
      where: { quantity: { gt: 0 } },
      include: {
        product: {
          select: {
            costPrice: true,
            retailPrice: true,
            partCategoryId: true,
            partCategory: { select: { nameAr: true } },
          },
        },
        branch: { select: { id: true, code: true, nameAr: true, nameEn: true } },
      },
    });

    let totalValue = 0;
    let totalRetailValue = 0;

    const branchMap = new Map<
      string,
      {
        branchId: string;
        code: string;
        nameAr: string;
        nameEn: string | null;
        itemsCount: number;
        totalValue: number;
        totalRetailValue: number;
      }
    >();
    const categoryMap = new Map<
      string,
      { categoryId: string | null; nameAr: string; itemsCount: number; totalValue: number; totalRetailValue: number }
    >();

    for (const row of inventory) {
      const qty = row.quantity;
      const value = qty * toNumberOrZero(row.product.costPrice);
      const retail = qty * toNumberOrZero(row.product.retailPrice);
      totalValue += value;
      totalRetailValue += retail;

      const branch =
        branchMap.get(row.branchId) ?? {
          branchId: row.branchId,
          code: row.branch.code,
          nameAr: row.branch.nameAr,
          nameEn: row.branch.nameEn,
          itemsCount: 0,
          totalValue: 0,
          totalRetailValue: 0,
        };
      branch.itemsCount += 1;
      branch.totalValue += value;
      branch.totalRetailValue += retail;
      branchMap.set(row.branchId, branch);

      const catKey = row.product.partCategoryId ?? "none";
      const cat =
        categoryMap.get(catKey) ?? {
          categoryId: row.product.partCategoryId,
          nameAr: row.product.partCategory?.nameAr ?? "—",
          itemsCount: 0,
          totalValue: 0,
          totalRetailValue: 0,
        };
      cat.itemsCount += 1;
      cat.totalValue += value;
      cat.totalRetailValue += retail;
      categoryMap.set(catKey, cat);
    }

    const value = round2(totalValue);
    const retail = round2(totalRetailValue);

    return {
      data: {
        totalValue: value,
        totalRetailValue: retail,
        potentialProfit: round2(retail - value),
        byBranch: [...branchMap.values()]
          .map((b) => ({
            branchId: b.branchId,
            branchCode: b.code,
            branchNameAr: b.nameAr,
            branchNameEn: b.nameEn,
            costValue: round2(b.totalValue),
            retailValue: round2(b.totalRetailValue),
          }))
          .sort((a, b) => b.costValue - a.costValue),
        byCategory: [...categoryMap.values()]
          .map((c) => ({
            categoryId: c.categoryId ?? "none",
            categoryName: c.nameAr,
            costValue: round2(c.totalValue),
            retailValue: round2(c.totalRetailValue),
          }))
          .sort((a, b) => b.costValue - a.costValue),
      },
    };
  }

  // ---------- 2.7 product profitability ----------

  async getProductProfitability(period?: string, limitParam?: string) {
    const range = this.parsePeriod(period, "90d");
    const limit = limitParam === undefined || limitParam === "" ? 20 : Number(limitParam);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException("limit must be an integer between 1 and 100");
    }

    const orders = await this.loadPeriodOrders(range.from, range.to);
    const active = this.activeOrders(orders);

    const byProduct = new Map<
      string,
      { productId: string; code: string; name: string; unitsSold: number; revenue: number; cost: number }
    >();
    for (const order of active) {
      for (const item of order.items) {
        const agg =
          byProduct.get(item.productId) ??
          ({
            productId: item.productId,
            code: item.product?.code ?? "",
            name: item.product?.name ?? "",
            unitsSold: 0,
            revenue: 0,
            cost: 0,
          });
        agg.unitsSold += item.quantity;
        agg.revenue += Number(item.lineTotal);
        agg.cost += item.quantity * toNumberOrZero(item.product?.costPrice);
        byProduct.set(item.productId, agg);
      }
    }

    const products = [...byProduct.values()]
      .sort((a, b) => b.revenue - b.cost - (a.revenue - a.cost))
      .slice(0, limit)
      .map((p) => {
        const revenue = round2(p.revenue);
        const cost = round2(p.cost);
        const profit = round2(revenue - cost);
        return {
          productId: p.productId,
          code: p.code,
          name: p.name,
          unitsSold: p.unitsSold,
          revenue,
          cost,
          profit,
          marginPercent: revenue > 0 ? round2((profit / revenue) * 100) : 0,
        };
      });

    return { data: { period: this.periodJson(range), products } };
  }
}
