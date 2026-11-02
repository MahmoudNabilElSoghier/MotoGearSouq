import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const NEW_CATEGORY_SLUGS = ["motorcycles", "bikes", "scooters"];

const prisma = new PrismaClient();

function inferType(categorySlug: string | null): string {
  if (!categorySlug) return "spare-parts";
  if (NEW_CATEGORY_SLUGS.includes(categorySlug)) return "new";
  if (categorySlug === "used") return "used";
  if (categorySlug === "accessories") return "accessories";
  return "spare-parts";
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set (run from apps/api so dotenv loads .env)");
  }

  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    select: { id: true, code: true, partCategory: { select: { slug: true } } },
    orderBy: { code: "asc" },
  });

  const counts: Record<string, number> = { new: 0, used: 0, "spare-parts": 0, accessories: 0 };
  let featuredMarked = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const type = inferType(product.partCategory?.slug ?? null);
    const isFeatured = i < 3;
    await prisma.product.update({
      where: { id: product.id },
      data: { type, isFeatured },
    });
    counts[type] = (counts[type] ?? 0) + 1;
    if (isFeatured) featuredMarked += 1;
  }

  console.log(
    `migrated ${products.length} active products: ` +
      `new=${counts.new} used=${counts.used} spare-parts=${counts["spare-parts"]} ` +
      `accessories=${counts.accessories} | isFeatured=true on first ${featuredMarked}`
  );
}

main()
  .catch((error) => {
    console.error("migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
