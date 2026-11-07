export interface DeadStockProduct {
  productId: string;
  code: string;
  name: string;
  currentStock: number;
  costPrice: number;
  capitalTied: number;
  lastSoldAt: string | null;
  daysSinceLastSale: number | null;
}

export interface DeadStockResponse {
  items: DeadStockProduct[];
  totalDeadStock: number;
  totalChecked: number;
  capitalTied: number;
  threshold: number;
}
