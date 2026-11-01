import * as fs from "node:fs";
import * as path from "node:path";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { mockBranches } from "@motogearsouq/shared";

type Row = Record<string, unknown>;

export interface BrandOut {
  name: string;
  nameAr: string | null;
  slug: string;
}

export interface CategoryOut {
  name: string;
  nameAr: string | null;
  slug: string;
}

export interface ModelOut {
  name: string;
  nameAr: string | null;
  slug: string;
  brandSlug: string;
  category: string;
}

export interface ProductOut {
  code: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  oemCode: string | null;
  categorySlug: string | null;
  brandSlug: string | null;
  modelSlug: string | null;
  costPrice: number | null;
  wholesalePrice: number | null;
  retailPrice: number | null;
  stock: number | null;
}

export interface BranchOut {
  code: string;
  slug: string;
  nameAr: string;
  nameEn: string | null;
  type: string;
  phone: string | null;
  address: string;
  governorate: string;
  openingHours: Record<string, string>;
  displayOrder: number;
}

const DATA_DIR = path.join(process.cwd(), "data");
const OUT_DIR = path.join(process.cwd(), "prisma", "data");

const normKey = (key: string): string =>
  key.trim().toLowerCase().replace(/[\s_\-]+/g, "");

const ALIAS_GROUPS: Record<string, string[]> = {
  code: ["code", "sku", "partnumber", "partno", "كود", "كودالمنتج", "الكود"],
  name: ["name", "اسم", "اسمالمنتج", "الاسم", "المنتج", "product"],
  nameEn: ["nameen", "englishname", "الاسمالانجليزي", "اسمانجليزي"],
  oem: ["oem", "oemcode", "كودoem", "رقمالاويم"],
  category: ["category", "type", "تصنيف", "التصنيف", "نوعالقطعة"],
  brand: ["brand", "company", "ماركة", "الماركة"],
  model: ["model", "موديل", "الموديل", "دراجة"],
  price: ["price", "retail", "retailprice", "سعر", "سعرالبيع", "سعرالتجزئة"],
  wholesale: ["wholesale", "wholesaleprice", "سعرالجملة", "جملة"],
  cost: ["cost", "costprice", "تكلفة", "سعرالتكلفة"],
  stock: ["stock", "quantity", "qty", "المخزون", "كمية"],
  description: ["description", "details", "الوصف", "وصف"],
};

const ALIASES: Record<string, string[]> = {};
for (const [key, list] of Object.entries(ALIAS_GROUPS)) {
  ALIASES[key] = list.map(normKey);
}

const field = (row: Row, name: string): string | undefined => {
  const aliases = ALIASES[name] ?? [normKey(name)];
  for (const key of Object.keys(row)) {
    if (!aliases.includes(normKey(key))) continue;
    const value = row[key];
    if (value == null) continue;
    const text = String(value).trim();
    if (text !== "" && text !== "undefined") return text;
  }
  return undefined;
};

const toNumber = (value: string | undefined): number | null => {
  if (!value) return null;
  const parsed = Number(value.replace(/[,\s\u00A0]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const slugify = (value: string, fallback: string): string => {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
};

const isArabic = (value: string): boolean => /[\u0600-\u06FF]/.test(value);

interface CategoryRule {
  slug: string;
  name: string;
  nameAr: string;
  pattern: RegExp;
}

const CATEGORY_RULES: CategoryRule[] = [
  { slug: "filters", name: "Filters", nameAr: "فلاتر", pattern: /فلت/ },
  { slug: "oils", name: "Oils & Fluids", nameAr: "زيوت وسوائل", pattern: /زيت|سوائل/ },
  { slug: "batteries", name: "Batteries", nameAr: "بطاريات", pattern: /بطار/ },
  { slug: "spark-plugs", name: "Spark Plugs", nameAr: "بوجيهات", pattern: /بوجيه|شمعة/ },
  { slug: "chains", name: "Chains & Sprockets", nameAr: "سلاسل وطرمبات", pattern: /سلسل|طرمب/ },
  { slug: "tires", name: "Tires & Tubes", nameAr: "إطارات وكاميرات", pattern: /اطار|إطار|كاميرا/ },
  { slug: "cables", name: "Cables", nameAr: "كابلات", pattern: /كابل/ },
  { slug: "electrical", name: "Electrical", nameAr: "كهرباء وإلكترونيات", pattern: /كهرباء|كويل|دينامو|ستاتر|ريليه|ايكسيت/ },
  { slug: "engine", name: "Engine", nameAr: "قطع محرك", pattern: /ستون|جوان|كرنك|محرك|صمام|سلندر|واريات/ },
  { slug: "transmission", name: "Transmission", nameAr: "ناقل الحركة", pattern: /دبرياج|ناقل|قير|فلامل/ },
  { slug: "suspension", name: "Suspension & Brakes", nameAr: "تعليق ومكابح", pattern: /مقص|مكابح|فرامل|تعليق|صدمات/ },
  { slug: "body", name: "Body & Exterior", nameAr: "هيكل وبودي", pattern: /رفرف|كاسيت|صدام|جريل|شاشة|هيكل/ },
];

const detectCategory = (
  haystack: string,
  rawCategory: string | undefined,
): CategoryOut | null => {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(haystack)) {
      return { name: rule.name, nameAr: rule.nameAr, slug: rule.slug };
    }
  }
  if (rawCategory) {
    const slug = slugify(rawCategory, "uncategorized");
    return { name: rawCategory, nameAr: isArabic(rawCategory) ? rawCategory : null, slug };
  }
  return null;
};

const brandFromFileName = (file: string): string | null => {
  const base = path.basename(file, path.extname(file));
  const parts = base.split(/[_\-]/);
  if (parts.length < 2) return null;
  const prefix = parts[0].trim();
  return prefix || null;
};

// Branches come from the shared mock catalog (BR-CAI-01/BR-GIZ-01/BR-ALX-01) so
// JSON output, mock fallback and seed stay aligned.
// TODO: replace with a real branches Excel sheet if the client provides one.
const buildBranches = (): BranchOut[] =>
  mockBranches.map((branch) => ({
    code: branch.code,
    slug: branch.slug,
    nameAr: branch.nameAr,
    nameEn: branch.nameEn,
    type: branch.type,
    phone: branch.phone,
    address: branch.address,
    governorate: branch.governorate,
    openingHours: branch.openingHours ?? {},
    displayOrder: branch.displayOrder,
  }));

const listDataFiles = (): string[] => {
  if (!fs.existsSync(DATA_DIR)) return [];
  return fs
    .readdirSync(DATA_DIR)
    .filter((file) => /\.(xlsx|xls|csv)$/i.test(file))
    .sort();
};

const readRows = (file: string): Row[] => {
  const abs = path.join(DATA_DIR, file);
  if (/\.csv$/i.test(file)) {
    const text = fs.readFileSync(abs, "utf8");
    const parsed = Papa.parse<Row>(text, { header: true, skipEmptyLines: true });
    if (parsed.errors.length > 0) {
      console.warn(`  [warn] ${file}: ${parsed.errors[0].message}`);
    }
    return parsed.data;
  }
  const workbook = XLSX.readFile(abs);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" });
};

const writeJson = (name: string, data: unknown): void => {
  const target = path.join(OUT_DIR, name);
  fs.writeFileSync(target, `${JSON.stringify(data, null, 2)}\n`, "utf8");
};

const main = (): void => {
  const files = listDataFiles();
  if (files.length === 0) {
    console.error(
      "No .xlsx/.xls/.csv files found in ./data — add your Excel files and re-run.",
    );
    process.exit(1);
  }

  const allRows: { row: Row; file: string }[] = [];
  for (const file of files) {
    for (const row of readRows(file)) allRows.push({ row, file });
  }

  const products: ProductOut[] = [];
  const brandsBySlug = new Map<string, BrandOut>();
  const categoriesBySlug = new Map<string, CategoryOut>();
  const modelsByKey = new Map<string, ModelOut>();
  const codesSeen = new Set<string>();
  let skipped = 0;

  for (const { row, file } of allRows) {
    const code = field(row, "code");
    const name = field(row, "name");
    if (!code || !name) {
      skipped += 1;
      continue;
    }
    if (codesSeen.has(code)) {
      skipped += 1;
      console.warn(`  [warn] duplicate code "${code}" in ${file} — skipped`);
      continue;
    }
    codesSeen.add(code);

    const brandName = field(row, "brand") ?? brandFromFileName(file);
    let brandSlug: string | null = null;
    if (brandName) {
      brandSlug = slugify(brandName, `brand-${brandsBySlug.size + 1}`);
      if (!brandsBySlug.has(brandSlug)) {
        brandsBySlug.set(brandSlug, {
          name: brandName,
          nameAr: isArabic(brandName) ? brandName : null,
          slug: brandSlug,
        });
      }
    }

    const rawCategory = field(row, "category");
    const category = detectCategory(`${rawCategory ?? ""} ${name}`, rawCategory);
    if (category && !categoriesBySlug.has(category.slug)) {
      categoriesBySlug.set(category.slug, category);
    }

    const modelName = field(row, "model");
    let modelSlug: string | null = null;
    if (modelName && brandSlug) {
      modelSlug = slugify(modelName, `model-${modelsByKey.size + 1}`);
      const key = `${brandSlug}::${modelSlug}`;
      if (!modelsByKey.has(key)) {
        modelsByKey.set(key, {
          name: modelName,
          nameAr: isArabic(modelName) ? modelName : null,
          slug: modelSlug,
          brandSlug,
          category: "دراجات نارية",
        });
      }
    }

    products.push({
      code,
      name,
      nameEn: field(row, "nameEn") ?? null,
      description: field(row, "description") ?? null,
      oemCode: field(row, "oem") ?? null,
      categorySlug: category?.slug ?? null,
      brandSlug,
      modelSlug,
      costPrice: toNumber(field(row, "cost")),
      wholesalePrice: toNumber(field(row, "wholesale")),
      retailPrice: toNumber(field(row, "price")),
      stock: toNumber(field(row, "stock")),
    });
  }

  const brands = [...brandsBySlug.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const categories = [...categoriesBySlug.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const models = [...modelsByKey.values()].sort((a, b) =>
    a.brandSlug.localeCompare(b.brandSlug) || a.slug.localeCompare(b.slug),
  );
  const branchOut = buildBranches();

  fs.mkdirSync(OUT_DIR, { recursive: true });
  writeJson("brands.json", brands);
  writeJson("categories.json", categories);
  writeJson("models.json", models);
  writeJson("products.json", products);
  writeJson("branches.json", branchOut);

  console.log("");
  console.log("Excel/CSV migration summary");
  console.log(`  files scanned : ${files.length} (${files.join(", ")})`);
  console.log(`  rows read     : ${allRows.length}`);
  console.log(`  products      : ${products.length} (${skipped} skipped)`);
  console.log(`  brands        : ${brands.length}`);
  console.log(`  categories    : ${categories.length}`);
  console.log(`  models        : ${models.length}`);
  console.log(`  branches      : ${branchOut.length} (from lib/content.ts)`);
  console.log("  output        : prisma/data/*.json");
  console.log("");
  console.log("Next: npm run db:seed  (requires DATABASE_URL)");
};

main();
