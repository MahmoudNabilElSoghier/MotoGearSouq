import { Body, Controller, Get, Inject, Param, Patch, Post, NotFoundException, UseGuards } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { createSupplierSchema, updateSupplierSchema, type CreateSupplierInput, type UpdateSupplierInput } from "@motogearsouq/shared";
import { AdminAuthGuard } from "../common/guards/admin-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { SuppliersService } from "./suppliers.service";

@ApiTags("suppliers")
@Controller("suppliers")
export class SuppliersController {
  constructor(@Inject(SuppliersService) private readonly suppliers: SuppliersService) {}

  @Get()
  @ApiOperation({ summary: "List suppliers with product and PO counts" })
  getSuppliers() {
    return this.suppliers.getSuppliers();
  }

  @Get(":id")
  @ApiParam({ name: "id" })
  @ApiOperation({ summary: "Supplier by ID with products and purchase orders" })
  async getById(@Param("id") id: string) {
    const res = await this.suppliers.getSupplierById(id);
    if (!res.data) throw new NotFoundException(`Supplier "${id}" not found`);
    return res;
  }

  @Post()
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiOperation({ summary: "Create supplier (admin)" })
  create(@Body(new ZodValidationPipe(createSupplierSchema)) body: CreateSupplierInput) {
    return this.suppliers.create(body);
  }

  @Patch(":id")
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiParam({ name: "id" })
  @ApiOperation({ summary: "Update supplier (admin)" })
  update(@Param("id") id: string, @Body(new ZodValidationPipe(updateSupplierSchema)) body: UpdateSupplierInput) {
    return this.suppliers.update(id, body);
  }
}
