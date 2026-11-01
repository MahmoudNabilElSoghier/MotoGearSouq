import { Inject, Injectable } from "@nestjs/common";
import { fromPrismaModel, mockCompatibilities, mockModels, mockProducts } from "@motogearsouq/shared";
import type { MachineModel } from "@motogearsouq/shared";
import { withDb, type DbResult } from "../common/with-db";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ModelsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  getModels(brandSlug?: string): Promise<DbResult<MachineModel[]>> {
    return withDb(
      this.prisma,
      async (db) => {
        const rows = await db.machineModel.findMany({
          where: brandSlug ? { brand: { slug: brandSlug } } : {},
          orderBy: [{ category: "asc" }, { name: "asc" }],
          include: {
            brand: true,
            _count: { select: { compatibilities: true } },
          },
        });
        return rows.map(fromPrismaModel);
      },
      () => mockModels.filter((model) => !brandSlug || model.brand?.slug === brandSlug),
    );
  }

  getModelBySlug(
    brandSlug: string,
    modelSlug: string,
  ): Promise<DbResult<MachineModel | null>> {
    return withDb(
      this.prisma,
      async (db) => {
        const model = await db.machineModel.findFirst({
          where: { slug: modelSlug, brand: { slug: brandSlug } },
          include: {
            brand: true,
            compatibilities: {
              include: {
                product: { include: { brand: true, inventory: true, images: true } },
              },
            },
          },
        });
        return model ? fromPrismaModel(model) : null;
      },
      () => {
        const model = mockModels.find(
          (item) => item.slug === modelSlug && item.brand?.slug === brandSlug,
        );
        if (!model) return null;
        return {
          ...model,
          compatibilities: mockCompatibilities
            .filter((compat) => compat.modelId === model.id)
            .map((compat) => ({
              ...compat,
              product: mockProducts.find((product) => product.id === compat.productId),
            })),
        };
      },
    );
  }
}
