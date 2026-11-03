import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AnalyticsModule } from "./analytics/analytics.module";
import { AuthModule } from "./auth/auth.module";
import { BrandsModule } from "./brands/brands.module";
import { BranchesModule } from "./branches/branches.module";
import { CartModule } from "./cart/cart.module";
import { CategoriesModule } from "./categories/categories.module";
import { CustomersModule } from "./customers/customers.module";
import { DocumentsModule } from "./documents/documents.module";
import { EmployeesModule } from "./employees/employees.module";
import { HealthModule } from "./health/health.module";
import { InventoryModule } from "./inventory/inventory.module";
import { ModelsModule } from "./models/models.module";
import { OrdersModule } from "./orders/orders.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProductsModule } from "./products/products.module";
import { StorageModule } from "./storage/storage.module";
import { SuppliersModule } from "./suppliers/suppliers.module";
import { StockMovementsModule } from "./stock-movements/stock-movements.module";
import { PurchasesModule } from "./purchases/purchases.module";
import { ShippingModule } from "./shipping/shipping.module";
import { PaymentsModule } from "./payments/payments.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    StorageModule,
    AnalyticsModule,
    CartModule,
    AuthModule,
    HealthModule,
    BrandsModule,
    BranchesModule,
    CategoriesModule,
    CustomersModule,
    DocumentsModule,
    EmployeesModule,
    InventoryModule,
    ModelsModule,
    OrdersModule,
    ProductsModule,
    SuppliersModule,
    StockMovementsModule,
    PurchasesModule,
    ShippingModule,
    PaymentsModule,
  ],
})
export class AppModule {}
