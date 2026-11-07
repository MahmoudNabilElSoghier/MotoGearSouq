import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { createEmployeeSchema, createRoleSchema, updateEmployeeSchema, updateRoleSchema, type CreateEmployeeInput, type CreateRoleInput, type UpdateEmployeeInput, type UpdateRoleInput } from "@motogearsouq/shared";
import { AdminAuthGuard } from "../common/guards/admin-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { EmployeesService } from "./employees.service";

@ApiTags("employees")
@Controller("employees")
export class EmployeesController {
  constructor(@Inject(EmployeesService) private readonly employees: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: "List employees (ordered by employee number)" })
  getEmployees() {
    return this.employees.getEmployees();
  }

  @Get("roles")
  @ApiOperation({ summary: "List available employee roles (auto-seeds defaults)" })
  getRoles() {
    return this.employees.getRoles();
  }

  @Post("roles")
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiOperation({ summary: "Create role (admin, requires x-admin-api-key or Bearer JWT)" })
  createRole(@Body(new ZodValidationPipe(createRoleSchema)) body: CreateRoleInput) {
    return this.employees.createRole(body);
  }

  @Patch("roles/:id")
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiParam({ name: "id" })
  @ApiOperation({ summary: "Update role (admin, requires x-admin-api-key or Bearer JWT)" })
  updateRole(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateRoleSchema)) body: UpdateRoleInput,
  ) {
    return this.employees.updateRole(id, body);
  }

  @Delete("roles/:id")
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiParam({ name: "id" })
  @ApiOperation({ summary: "Delete role (admin; system/in-use roles rejected)" })
  removeRole(@Param("id") id: string) {
    return this.employees.removeRole(id);
  }

  @Post()
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiOperation({ summary: "Create employee (admin, requires x-admin-api-key or Bearer JWT)" })
  create(
    @Body(new ZodValidationPipe(createEmployeeSchema)) body: CreateEmployeeInput,
  ) {
    return this.employees.create(body);
  }

  @Patch(":id")
  @UseGuards(AdminAuthGuard)
  @ApiHeader({ name: "x-admin-api-key", required: false })
  @ApiParam({ name: "id" })
  @ApiOperation({ summary: "Update employee (admin, requires x-admin-api-key or Bearer JWT)" })
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateEmployeeSchema)) body: UpdateEmployeeInput,
  ) {
    return this.employees.update(id, body);
  }
}
