import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CodLimitService } from "./cod-limit.service";

export interface RiskInput {
  customerId: string;
  orderTotal: number;
  ipAddress: string;
  userAgentHash: string;
}

export interface RiskBreakdown {
  accountAge: { score: number; days: number };
  emailVerified: { score: number; verified: boolean };
  deliveryHistory: { score: number; successful: number; failed: number };
  orderAmount: { score: number; total: number; limit: number | null };
  sameIpToday: { score: number; count: number };
  sameDeviceToday: { score: number; count: number };
}

export interface RiskResult {
  score: number; // 0-100
  level: "low" | "medium" | "high";
  breakdown: RiskBreakdown;
  blockCod: boolean; // true if score > 60
}

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class RiskScoreService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CodLimitService) private readonly codLimit: CodLimitService,
  ) {}

  async calculate(input: RiskInput): Promise<RiskResult> {
    const customer = await this.prisma.get().customer.findUnique({
      where: { id: input.customerId },
      select: { createdAt: true, emailVerified: true, successfulDeliveries: true, failedDeliveries: true },
    });

    const now = Date.now();
    const days = customer ? Math.floor((now - customer.createdAt.getTime()) / DAY_MS) : 0;

    // 1. Account age
    let ageScore = 0;
    if (days < 1) ageScore = 20;
    else if (days < 7) ageScore = 15;
    else if (days < 30) ageScore = 5;

    // 2. Email verification
    const verified = customer?.emailVerified ?? false;
    const emailScore = verified ? 0 : 10;

    // 3. Delivery history
    const successful = customer?.successfulDeliveries ?? 0;
    const failed = customer?.failedDeliveries ?? 0;
    let deliveryScore = 0;
    if (failed === 0 && successful === 0) deliveryScore = 15;
    else if (failed === 0) deliveryScore = 0;
    else if (failed === 1) deliveryScore = 20;
    else deliveryScore = 40;

    // 4. Order amount relative to COD limit
    const limit = this.codLimit.getLimit(successful);
    let amountScore = 0;
    if (Number.isFinite(limit)) {
      const ratio = input.orderTotal / limit;
      if (ratio > 1) amountScore = 15;
      else if (ratio > 0.8) amountScore = 10;
      else if (ratio > 0.5) amountScore = 5;
    }

    // 5/6. Same IP / same device orders in last 24h (this order not yet created)
    const since = new Date(now - DAY_MS);
    const [sameIpCount, sameDeviceCount] = await Promise.all([
      this.prisma.get().order.count({
        where: { ipAddress: input.ipAddress, createdAt: { gte: since }, deletedAt: null },
      }),
      this.prisma.get().order.count({
        where: { userAgentHash: input.userAgentHash, createdAt: { gte: since }, deletedAt: null },
      }),
    ]);

    let ipScore = 0;
    if (sameIpCount >= 3) ipScore = 20;
    else if (sameIpCount === 2) ipScore = 10;

    let deviceScore = 0;
    if (sameDeviceCount >= 3) deviceScore = 15;
    else if (sameDeviceCount === 2) deviceScore = 5;

    const raw = ageScore + emailScore + deliveryScore + amountScore + ipScore + deviceScore;
    const score = Math.max(0, Math.min(100, raw));

    const breakdown: RiskBreakdown = {
      accountAge: { score: ageScore, days },
      emailVerified: { score: emailScore, verified },
      deliveryHistory: { score: deliveryScore, successful, failed },
      orderAmount: {
        score: amountScore,
        total: input.orderTotal,
        limit: Number.isFinite(limit) ? limit : null,
      },
      sameIpToday: { score: ipScore, count: sameIpCount },
      sameDeviceToday: { score: deviceScore, count: sameDeviceCount },
    };

    const level = this.getRiskLevel(score);
    return { score, level, breakdown, blockCod: score > 60 };
  }

  getRiskLevel(score: number): "low" | "medium" | "high" {
    if (score <= 30) return "low";
    if (score <= 60) return "medium";
    return "high";
  }
}
