import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CodLimitService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  getLimit(successfulDeliveries: number): number {
    if (successfulDeliveries === 0) return 5000;
    if (successfulDeliveries === 1) return 15000;
    if (successfulDeliveries === 2) return 30000;
    return Infinity;
  }

  async validateCodOrder(
    customerId: string,
    orderTotal: number,
  ): Promise<{
    allowed: boolean;
    limit: number;
    successfulDeliveries: number;
    message?: string;
  }> {
    const customer = await this.prisma.get().customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return { allowed: false, limit: 0, successfulDeliveries: 0, message: "العميل غير موجود" };
    }

    const limit = this.getLimit(customer.successfulDeliveries);

    if (orderTotal > limit) {
      return {
        allowed: false,
        limit,
        successfulDeliveries: customer.successfulDeliveries,
        message: `حد الشراء عند الاستلام ${limit} ج.م للأوردر رقم ${customer.successfulDeliveries + 1}. قيمة طلبك ${orderTotal} ج.م. يمكنك الدفع أونلاين لتجاوز الحد.`,
      };
    }

    return { allowed: true, limit, successfulDeliveries: customer.successfulDeliveries };
  }
}
