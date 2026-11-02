import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ShippingService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async calculate(
    orderValue: number,
    governorate: string,
    city: string | null,
    method: "standard" | "express" | "cod",
  ): Promise<{ fee: number; isFree: boolean; reason: string }> {
    const db = this.prisma.get();

    let rate = city ? await db.shippingRate.findFirst({ where: { governorate, city, isActive: true } }) : null;
    if (!rate) {
      rate = await db.shippingRate.findFirst({ where: { governorate, city: null, isActive: true } });
    }

    const settings = await db.companySettings.findUnique({ where: { id: "singleton" } });

    const standardFee = rate ? Number(rate.standardFee) : Number(settings?.defaultStandardFee ?? 50);
    const expressFee = rate?.expressFee ? Number(rate.expressFee) : Number(settings?.defaultExpressFee ?? 100);
    const freeOverAmount =
      rate?.freeOverAmount !== null && rate?.freeOverAmount !== undefined
        ? Number(rate.freeOverAmount)
        : settings?.defaultFreeOverAmount !== null && settings?.defaultFreeOverAmount !== undefined
          ? Number(settings.defaultFreeOverAmount)
          : null;
    const codFee = rate ? Number(rate.codFee) : Number(settings?.defaultCodFee ?? 0);

    let fee = 0;
    let isFree = false;
    let reason = "Standard shipping";

    if (method === "express") {
      fee = expressFee;
      reason = "Express shipping";
    } else {
      if (freeOverAmount !== null && orderValue >= freeOverAmount) {
        isFree = true;
        fee = 0;
        reason = `Free shipping for orders over ${freeOverAmount} EGP`;
      } else {
        fee = standardFee;
      }
      if (method === "cod") {
        fee += codFee;
        reason += ` + COD fee ${codFee} EGP`;
      }
    }

    return { fee, isFree, reason };
  }
}
