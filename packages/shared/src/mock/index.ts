// MOCK DATA — replaced by DB when DATABASE_URL is set.
// Serves the admin dashboard + public catalog while no database exists
// (strict rule this sprint: no prisma migrate/db push/generate).
// Brief-required sets: brands (8), models (16), categories (14), products (20),
// branches (3), employees (5).
// Deliberate additions beyond the brief (flagged in the sprint report):
// mockInventory, mockCompatibilities, mockCustomers, mockOrders — needed so the
// inventory / compatibility / dashboard UI has realistic data to render today.

import type {
  Branch,
  BranchInventory,
  Brand,
  Customer,
  Employee,
  MachineModel,
  Order,
  OrderItem,
  PartCategory,
  Product,
  ProductCompatibility,
} from "../types";

const earlier = "2026-01-10T09:00:00.000Z";
const now = "2026-01-20T09:00:00.000Z";

const money = (value: number) => Math.round(value * 100) / 100;

// ---------- Brands ----------

export const mockBrands: Brand[] = [
  { id: "b-sym", name: "SYM", nameAr: "سيم", slug: "sym", logoUrl: null, website: "https://www.sym-global.com", description: "مصنع تايواني متخصص في السكوترات ودراجات الـ 125-300 سي سي.", order: 1, createdAt: earlier, updatedAt: now },
  { id: "b-boxer", name: "Boxer", nameAr: "بوكسَر", slug: "boxer", logoUrl: null, website: null, description: "دراجات اقتصادية شائعة الاستخدام في السوق المصري.", order: 2, createdAt: earlier, updatedAt: now },
  { id: "b-dayun", name: "Dayun", nameAr: "دايون", slug: "dayun", logoUrl: null, website: null, description: "علامة صينية للدراجات النارية وقطع غيارها.", order: 3, createdAt: earlier, updatedAt: now },
  { id: "b-haojiang", name: "Haojiang", nameAr: "هاوجيانج", slug: "haojiang", logoUrl: null, website: null, description: "دراجات نارية صينية بمقاسات متوسطة.", order: 4, createdAt: earlier, updatedAt: now },
  { id: "b-haojue", name: "Haojue", nameAr: "هاوجي", slug: "haojue", logoUrl: null, website: null, description: "من أكبر المصنعين الصينيين للدراجات النارية.", order: 5, createdAt: earlier, updatedAt: now },
  { id: "b-kymco", name: "Kymco", nameAr: "كيمكو", slug: "kymco", logoUrl: null, website: "https://www.kymco.com", description: "سكوترات تايوانية عالية الجودة.", order: 6, createdAt: earlier, updatedAt: now },
  { id: "b-pne", name: "PNE", nameAr: "بي إني إي", slug: "pne", logoUrl: null, website: null, description: "دراجات وسكوترات بمعدل تكلفة مناسب.", order: 7, createdAt: earlier, updatedAt: now },
  { id: "b-cmg", name: "CMG", nameAr: "سي إم جي", slug: "cmg", logoUrl: null, website: null, description: "دراجات نارية نوعية بمقاسات كبيرة.", order: 8, createdAt: earlier, updatedAt: now },
];

const findBrand = (id: string | null): Brand | undefined =>
  id ? mockBrands.find((brand) => brand.id === id) : undefined;

// ---------- Machine models ----------

const mkModel = (
  brandId: string,
  name: string,
  nameAr: string,
  slug: string,
  category: string,
  engineCc: number,
  yearFrom: number | null = null
): MachineModel => ({
  id: `m-${slug}`,
  brandId,
  brand: findBrand(brandId),
  name,
  nameAr,
  slug,
  category,
  yearFrom,
  yearTo: null,
  engineCc,
  description: null,
  imageUrl: null,
  createdAt: earlier,
});

export const mockModels: MachineModel[] = [
  mkModel("b-sym", "Fiddle 125", "فيدل 125", "fiddle-125", "سكوترات", 125, 2019),
  mkModel("b-sym", "Jet 14", "جت 14", "jet-14", "سكوترات", 150, 2020),
  mkModel("b-sym", "HD 300", "إتش دي 300", "hd-300", "دراجات نارية", 300, 2021),
  mkModel("b-sym", "Husky 165", "هاوسكي 165", "husky-165", "دراجات نارية", 165, 2018),
  mkModel("b-boxer", "JR 125", "جي آر 125", "jr-125", "دراجات نارية", 125, 2017),
  mkModel("b-boxer", "GR 150", "جي آر 150", "gr-150", "دراجات نارية", 150, 2019),
  mkModel("b-dayun", "DK 150", "دي كي 150", "dk-150", "دراجات نارية", 150, 2018),
  mkModel("b-dayun", "Cruiser 250", "كروزر 250", "cruiser-250", "دراجات نارية", 250, 2020),
  mkModel("b-haojiang", "HJ 250", "إتش جي 250", "hj-250", "دراجات نارية", 250, 2019),
  mkModel("b-haojiang", "Speed 150", "سبيد 150", "speed-150", "دراجات نارية", 150, 2021),
  mkModel("b-haojue", "UY 125", "يو واي 125", "uy-125", "سكوترات", 125, 2020),
  mkModel("b-haojue", "GZ 250", "جي زي 250", "gz-250", "دراجات نارية", 250, 2019),
  mkModel("b-kymco", "Agility 125", "أجيليتي 125", "agility-125", "سكوترات", 125, 2018),
  mkModel("b-kymco", "Like 125", "لايك 125", "like-125", "سكوترات", 125, 2021),
  mkModel("b-pne", "RX 200", "آر إكس 200", "rx-200", "دراجات نارية", 200, 2020),
  mkModel("b-cmg", "CR 250", "سي آر 250", "cr-250", "دراجات نارية", 250, 2022),
];

// ---------- Part categories (2-level tree) ----------

const mkCategory = (
  id: string,
  name: string,
  nameAr: string,
  slug: string,
  order: number,
  parentId: string | null = null
): PartCategory => ({
  id,
  name,
  nameAr,
  slug,
  parentId,
  parent: null,
  order,
  createdAt: earlier,
});

export const mockCategories: PartCategory[] = [
  mkCategory("cat-filters", "Filters", "فلاتر", "filters", 1),
  mkCategory("cat-oil-filter", "Oil filter", "فلتر زيت", "oil-filter", 2, "cat-filters"),
  mkCategory("cat-air-filter", "Air filter", "فلتر هواء", "air-filter", 3, "cat-filters"),
  mkCategory("cat-cables", "Cables", "كابلات", "cables", 4),
  mkCategory("cat-throttle-cable", "Throttle cable", "كابل دواسة", "throttle-cable", 5, "cat-cables"),
  mkCategory("cat-spark-plugs", "Spark plugs", "بوجيهات", "spark-plugs", 6),
  mkCategory("cat-chains", "Chains & sprockets", "سلاسل وطرمبات", "chains", 7),
  mkCategory("cat-tires", "Tires & tubes", "إطارات وكاميرات", "tires", 8),
  mkCategory("cat-oils", "Oils & fluids", "زيوت وسوائل", "oils", 9),
  mkCategory("cat-electrical", "Electrical", "كهرباء", "electrical", 10),
  mkCategory("cat-batteries", "Batteries", "بطاريات", "batteries", 11, "cat-electrical"),
  mkCategory("cat-engine", "Engine parts", "قطع محرك", "engine", 12),
  mkCategory("cat-transmission", "Transmission", "ناقل حركة", "transmission", 13),
  mkCategory("cat-suspension", "Suspension", "تعليق", "suspension", 14),
];

const findCategory = (id: string | null): PartCategory | undefined =>
  id ? mockCategories.find((category) => category.id === id) : undefined;

// ---------- Branches ----------

export const mockBranches: Branch[] = [
  {
    id: "br-cai",
    code: "BR-CAI-01",
    slug: "cairo-mohandessin",
    nameAr: "فرع القاهرة - المهندسين",
    nameEn: "Cairo - Mohandessin",
    type: "retail",
    phone: "01001234561",
    whatsapp: "201001234561",
    address: "12 ش جامعة الدول العربية، المهندسين",
    addressEn: "12 Gamet El Dowla St, Mohandessin",
    governorate: "القاهرة",
    latitude: 30.0626,
    longitude: 31.2088,
    openingHours: { "sat-thu": "10:00 - 22:00", fri: "14:00 - 22:00" },
    managerId: "emp-001",
    // manager embed intentionally null (employee.branch is embedded instead —
    // embedding both would create a circular object graph for RSC serialization)
    manager: null,
    active: true,
    displayOrder: 1,
    createdAt: earlier,
    updatedAt: now,
  },
  {
    id: "br-giz",
    code: "BR-GIZ-01",
    slug: "giza-dokki",
    nameAr: "فرع الجيزة - الدقي",
    nameEn: "Giza - Dokki",
    type: "retail",
    phone: "01112345672",
    whatsapp: "201112345672",
    address: "45 ش التحرير، الدقي",
    addressEn: "45 El Tahrir St, Dokki",
    governorate: "الجيزة",
    latitude: 30.0388,
    longitude: 31.2119,
    openingHours: { "sat-thu": "10:00 - 22:00", fri: "14:00 - 22:00" },
    managerId: null,
    manager: null,
    active: true,
    displayOrder: 2,
    createdAt: earlier,
    updatedAt: now,
  },
  {
    id: "br-alx",
    code: "BR-ALX-01",
    slug: "alexandria-smouha",
    nameAr: "فرع الإسكندرية - سموحة",
    nameEn: "Alexandria - Smouha",
    type: "retail",
    phone: "01223456783",
    whatsapp: "201223456783",
    address: "9 ش فؤاد، سموحة",
    addressEn: "9 Fouad St, Smouha",
    governorate: "الإسكندرية",
    latitude: 31.2117,
    longitude: 29.9465,
    openingHours: { "sat-thu": "10:00 - 21:30", fri: "14:00 - 21:30" },
    managerId: null,
    manager: null,
    active: true,
    displayOrder: 3,
    createdAt: earlier,
    updatedAt: now,
  },
];

const findBranch = (id: string): Branch | undefined =>
  mockBranches.find((branch) => branch.id === id);

// ---------- Products ----------

type RawProduct = Omit<Product, "inventory">;

const mkProduct = (
  code: string,
  name: string,
  brandId: string,
  partCategoryId: string,
  retailPrice: number,
  extra: Partial<RawProduct> = {}
): RawProduct => ({
  id: `p-${code.toLowerCase()}`,
  code,
  name,
  nameEn: null,
  description: null,
  oemCode: null,
  partCategoryId,
  brandId,
  supplierId: null,
  costPrice: money(retailPrice * 0.7),
  wholesalePrice: money(retailPrice * 0.85),
  retailPrice,
  vipPrice: money(retailPrice * 0.95),
  taxRate: 0.14,
  unitOfMeasure: "قطعة",
  reorderLevel: 5,
  tags: [],
  type: "spare-parts",
  isFeatured: false,
  onSale: false,
  discountPercent: null,
  active: true,
  deletedAt: null,
  createdAt: earlier,
  updatedAt: now,
  ...extra,
});

const rawProducts: RawProduct[] = [
  mkProduct("SYM-FLT-001", "فلتر زيت SYM Fiddle 125", "b-sym", "cat-oil-filter", 85, { nameEn: "Oil filter SYM Fiddle 125", oemCode: "18-320-KAB-01" }),
  mkProduct("SYM-FLT-002", "فلتر هواء SYM Jet 14", "b-sym", "cat-air-filter", 120, { nameEn: "Air filter SYM Jet 14" }),
  mkProduct("SYM-SPK-003", "بوجيه NGK لـ SYM HD 300", "b-sym", "cat-spark-plugs", 65, { nameEn: "NGK spark plug SYM HD 300", tags: ["اصلي", "NGK"] }),
  mkProduct("SYM-TRN-004", "جوانات صندوق SYM HD 300", "b-sym", "cat-transmission", 560, { nameEn: "Gearbox gasket set SYM HD 300" }),
  mkProduct("BOX-KAB-001", "كابل دواسة Boxer JR 125", "b-boxer", "cat-throttle-cable", 95, { nameEn: "Throttle cable Boxer JR 125" }),
  mkProduct("BOX-CHN-002", "سلسلة نقل حركة Boxer GR 150", "b-boxer", "cat-chains", 260, { nameEn: "Drive chain Boxer GR 150" }),
  mkProduct("BOX-TIR-003", "إطار خلفي 110/80-14", "b-boxer", "cat-tires", 480, { nameEn: "Rear tire 110/80-14", tags: ["اطار"] }),
  mkProduct("BOX-ELE-004", "كويل إشعال Boxer JR", "b-boxer", "cat-electrical", 275, { nameEn: "Ignition coil Boxer JR" }),
  mkProduct("DAY-FLT-001", "فلتر زيت Dayun DK 150", "b-dayun", "cat-oil-filter", 90, { nameEn: "Oil filter Dayun DK 150" }),
  mkProduct("DAY-TRN-002", "دبرياج Dayun Cruiser 250", "b-dayun", "cat-transmission", 640, { nameEn: "Clutch kit Dayun Cruiser 250" }),
  mkProduct("HJI-ENG-001", "بيبستون 63مم Haojiang HJ 250", "b-haojiang", "cat-engine", 780, { nameEn: "63mm piston Haojiang HJ 250", tags: ["محرك"] }),
  mkProduct("HJI-SPK-002", "بوجيه إيريديوم Haojiang Speed 150", "b-haojiang", "cat-spark-plugs", 130, { nameEn: "Iridium spark plug Haojiang Speed 150" }),
  mkProduct("HJO-OIL-001", "زيت محرك 10W-40 (1 لتر) Haojue", "b-haojue", "cat-oils", 145, { nameEn: "Engine oil 10W-40 1L Haojue", tags: ["زيت"] }),
  mkProduct("HJO-BAT-002", "بطارية 12V 7Ah Haojue UY 125", "b-haojue", "cat-batteries", 390, { nameEn: "Battery 12V 7Ah Haojue UY 125" }),
  mkProduct("KYM-FLT-001", "فلتر زيت Kymco Agility 125", "b-kymco", "cat-oil-filter", 95, { nameEn: "Oil filter Kymco Agility 125" }),
  mkProduct("KYM-ELE-002", "ستاتر Kymco Like 125", "b-kymco", "cat-electrical", 520, { nameEn: "Starter motor Kymco Like 125" }),
  mkProduct("KYM-TIR-003", "إطار أمامي 110/70-12", "b-kymco", "cat-tires", 395, { nameEn: "Front tire 110/70-12" }),
  mkProduct("PNE-CAB-001", "كابل دواسة PNE RX 200", "b-pne", "cat-throttle-cable", 110, { nameEn: "Throttle cable PNE RX 200" }),
  mkProduct("PNE-CHN-002", "طقم سلسلة وطرمبة PNE RX 200", "b-pne", "cat-chains", 310, { nameEn: "Chain & sprocket kit PNE RX 200" }),
  mkProduct("CMG-SUS-001", "مقصات أمامية CMG CR 250", "b-cmg", "cat-suspension", 890, { nameEn: "Front forks CMG CR 250", tags: ["تعليق"] }),
];

const productsWithRefs: RawProduct[] = rawProducts.map((product) => ({
  ...product,
  brand: findBrand(product.brandId) ?? null,
  partCategory: findCategory(product.partCategoryId) ?? null,
  supplier: null,
}));

const findProduct = (id: string): RawProduct | undefined =>
  productsWithRefs.find((product) => product.id === id);

// ---------- Inventory (branch stock rows) ----------

const inventoryRow = (
  id: string,
  branchId: string,
  productId: string,
  quantity: number,
  reorderLevel: number | null = null
): BranchInventory => ({
  id,
  branchId,
  productId,
  quantity,
  reorderLevel,
  updatedAt: now,
  branch: findBranch(branchId),
  product: findProduct(productId),
});

export const mockInventory: BranchInventory[] = [
  inventoryRow("inv-01", "br-cai", "p-sym-flt-001", 24),
  inventoryRow("inv-02", "br-cai", "p-sym-flt-002", 3),
  inventoryRow("inv-03", "br-cai", "p-box-kab-001", 18),
  inventoryRow("inv-04", "br-cai", "p-hjo-oil-001", 40),
  inventoryRow("inv-05", "br-cai", "p-kym-flt-001", 4),
  inventoryRow("inv-06", "br-giz", "p-sym-flt-001", 12),
  inventoryRow("inv-07", "br-giz", "p-box-chn-002", 0),
  inventoryRow("inv-08", "br-giz", "p-kym-tir-003", 9),
  inventoryRow("inv-09", "br-giz", "p-hjo-bat-002", 2),
  inventoryRow("inv-10", "br-alx", "p-day-flt-001", 15),
  inventoryRow("inv-11", "br-alx", "p-hji-eng-001", 6),
  inventoryRow("inv-12", "br-alx", "p-pne-chn-002", 1, 2),
];

export const mockProducts: Product[] = productsWithRefs.map((product, index) => ({
  ...product,
  isFeatured: index < 3,
  inventory: mockInventory.filter((item) => item.productId === product.id),
}));

// ---------- Employees ----------

const mkEmployee = (
  id: string,
  employeeNumber: string,
  nameAr: string,
  phone: string,
  role: string,
  branchId: string
): Employee => ({
  id,
  employeeNumber,
  nameAr,
  nameEn: null,
  nationalId: null,
  phone,
  email: null,
  role,
  branchId,
  branch: findBranch(branchId) ?? null,
  active: true,
  createdAt: earlier,
});

export const mockEmployees: Employee[] = [
  mkEmployee("emp-001", "EMP-001", "أحمد منصور", "01009876541", "manager", "br-cai"),
  mkEmployee("emp-002", "EMP-002", "مريم عبد الله", "01009876542", "cashier", "br-cai"),
  mkEmployee("emp-003", "EMP-003", "خالد الشناوي", "01119876543", "cashier", "br-giz"),
  mkEmployee("emp-004", "EMP-004", "سامح فؤاد", "01119876544", "warehouse", "br-giz"),
  mkEmployee("emp-005", "EMP-005", "نورهان سيد", "01229876545", "admin", "br-alx"),
];

// ---------- Customers ----------

export const mockCustomers: Customer[] = [
  { id: "cus-001", code: "CUS-001", name: "محمد رجب", phone: "01001112233", phone2: null, email: null, type: "retail", address: null, governorate: "القاهرة", taxNumber: null, creditLimit: null, notes: null, createdAt: earlier },
  { id: "cus-002", code: "CUS-002", name: "مؤسسة النيل للصيانة", phone: "01122334455", phone2: null, email: "nile@example.com", type: "wholesale", address: "شارع الهرم، الجيزة", governorate: "الجيزة", taxNumber: "TAX-998877", creditLimit: 20000, notes: "عميل جملة - خصم خاص", createdAt: earlier },
  { id: "cus-003", code: "CUS-003", name: "أحمد فاروق", phone: "01233445566", phone2: null, email: null, type: "vip", address: null, governorate: "الإسكندرية", taxNumber: null, creditLimit: 5000, notes: null, createdAt: earlier },
];

// ---------- Product ↔ model compatibility ----------

const mkCompatibility = (
  id: string,
  productId: string,
  modelId: string
): ProductCompatibility => ({ id, productId, modelId, note: null });

export const mockCompatibilities: ProductCompatibility[] = [
  mkCompatibility("cmp-01", "p-sym-flt-001", "m-fiddle-125"),
  mkCompatibility("cmp-02", "p-sym-flt-001", "m-jet-14"),
  mkCompatibility("cmp-03", "p-sym-flt-002", "m-jet-14"),
  mkCompatibility("cmp-04", "p-sym-spk-003", "m-hd-300"),
  mkCompatibility("cmp-05", "p-box-kab-001", "m-jr-125"),
  mkCompatibility("cmp-06", "p-box-chn-002", "m-gr-150"),
  mkCompatibility("cmp-07", "p-day-flt-001", "m-dk-150"),
  mkCompatibility("cmp-08", "p-hjo-oil-001", "m-uy-125"),
  mkCompatibility("cmp-09", "p-hjo-oil-001", "m-gz-250"),
  mkCompatibility("cmp-10", "p-kym-flt-001", "m-agility-125"),
  mkCompatibility("cmp-11", "p-pne-cab-001", "m-rx-200"),
  mkCompatibility("cmp-12", "p-cmg-sus-001", "m-cr-250"),
  mkCompatibility("cmp-13", "p-hji-spk-002", "m-speed-150"),
];

// ---------- Orders ----------

type ItemSpec = [productId: string, quantity: number, unitPrice: number, discount?: number];

const mkOrder = (
  id: string,
  orderNumber: string,
  status: string,
  paymentMethod: string,
  paymentStatus: string,
  customerId: string,
  branchId: string,
  employeeId: string,
  specs: ItemSpec[],
  createdAt: string
): Order => {
  const items: OrderItem[] = specs.map(([productId, quantity, unitPrice, discount = 0], index) => ({
    id: `${id}-item-${index + 1}`,
    orderId: id,
    productId,
    quantity,
    unitPrice,
    discount,
    lineTotal: money(quantity * unitPrice - discount),
    note: null,
    product: findProduct(productId),
  }));
  const subtotal = money(
    specs.reduce((sum, [, quantity, unitPrice]) => sum + quantity * unitPrice, 0)
  );
  const discount = money(items.reduce((sum, item) => sum + item.discount, 0));
  const taxAmount = money((subtotal - discount) * 0.14);
  return {
    id,
    orderNumber,
    customerId,
    customer: mockCustomers.find((customer) => customer.id === customerId) ?? null,
    branchId,
    branch: findBranch(branchId) ?? null,
    employeeId,
    employee: mockEmployees.find((employee) => employee.id === employeeId) ?? null,
    status,
    subtotal,
    taxAmount,
    discount,
    total: money(subtotal - discount + taxAmount),
    paymentMethod,
    paymentStatus,
    notes: null,
    deletedAt: null,
    createdAt,
    updatedAt: createdAt,
    items,
  };
};

export const mockOrders: Order[] = [
  mkOrder("ord-001", "ORD-2026-0001", "pending", "cash", "unpaid", "cus-001", "br-cai", "emp-002", [
    ["p-sym-flt-001", 2, 85],
    ["p-box-kab-001", 1, 95],
  ], "2026-01-18T11:30:00.000Z"),
  mkOrder("ord-002", "ORD-2026-0002", "confirmed", "transfer", "paid", "cus-002", "br-giz", "emp-003", [
    ["p-kym-tir-003", 2, 395, 50],
    ["p-hjo-oil-001", 4, 145],
  ], "2026-01-19T14:05:00.000Z"),
  mkOrder("ord-003", "ORD-2026-0003", "delivered", "cash", "paid", "cus-003", "br-alx", "emp-005", [
    ["p-cmg-sus-001", 1, 890],
  ], "2026-01-20T16:40:00.000Z"),
];

// ---------- Derived counts (kept in sync with the arrays above) ----------

mockBrands.forEach((brand) => {
  brand._count = {
    models: mockModels.filter((model) => model.brandId === brand.id).length,
    products: productsWithRefs.filter((product) => product.brandId === brand.id).length,
  };
});

mockModels.forEach((model) => {
  model._count = {
    compatibilities: mockCompatibilities.filter((compat) => compat.modelId === model.id).length,
  };
});

mockCategories.forEach((category) => {
  category._count = {
    products: productsWithRefs.filter((product) => product.partCategoryId === category.id).length,
  };
});

mockBranches.forEach((branch) => {
  branch._count = {
    inventory: mockInventory.filter((item) => item.branchId === branch.id).length,
    employees: mockEmployees.filter((employee) => employee.branchId === branch.id).length,
    orders: mockOrders.filter((order) => order.branchId === branch.id).length,
  };
});

mockEmployees.forEach((employee) => {
  employee._count = {
    orders: mockOrders.filter((order) => order.employeeId === employee.id).length,
    branchAssignments: 0,
  };
});
