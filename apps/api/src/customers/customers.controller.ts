import { Body, Controller, Get, Inject, Param, Patch, Query, Req, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { AdminAuthGuard } from "../common/guards/admin-auth.guard";
import { CustomersService } from "./customers.service";

@ApiTags("admin-customers")
@Controller("admin/customers")
@UseGuards(AdminAuthGuard)
export class CustomersController {
  constructor(@Inject(CustomersService) private readonly customers: CustomersService) {}

  private adminId(req: Request & { user?: { sub?: string; type?: string } }): string {
    return req.user?.sub || req.user?.type || "unknown";
  }

  private page(value?: string): number | undefined {
    if (!value) return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  @Get()
  @ApiOperation({ summary: "List customers (admin, paginated, filterable)" })
  async list(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("customerType") customerType?: string,
    @Query("approvalStatus") approvalStatus?: string,
    @Query("search") search?: string,
  ) {
    const data = await this.customers.list({
      page: this.page(page),
      pageSize: this.page(pageSize),
      customerType: customerType || undefined,
      approvalStatus: approvalStatus || undefined,
      search: search || undefined,
    });
    return { data, isMock: false };
  }

  @Get("pending/count")
  @ApiOperation({ summary: "Count of pending wholesale applications (dashboard badge)" })
  async pendingCount() {
    const count = await this.customers.countPending();
    return { data: { count }, isMock: false };
  }

  @Get("pending")
  @ApiOperation({ summary: "Pending wholesale applications awaiting approval" })
  async pending(@Query("page") page?: string, @Query("pageSize") pageSize?: string) {
    const data = await this.customers.listPending(this.page(page), this.page(pageSize));
    return { data, isMock: false };
  }

  @Patch(":id/approve")
  @ApiOperation({ summary: "Approve a wholesale customer application" })
  async approve(@Param("id") id: string, @Req() req: Request & { user?: { sub?: string; type?: string } }) {
    const data = await this.customers.approve(id, this.adminId(req));
    return { data, isMock: false };
  }

  @Patch(":id/reject")
  @ApiOperation({ summary: "Reject a wholesale customer application" })
  async reject(
    @Param("id") id: string,
    @Body() body: { reason?: string } | undefined,
    @Req() req: Request & { user?: { sub?: string; type?: string } },
  ) {
    const data = await this.customers.reject(id, body?.reason, this.adminId(req));
    return { data, isMock: false };
  }
}
