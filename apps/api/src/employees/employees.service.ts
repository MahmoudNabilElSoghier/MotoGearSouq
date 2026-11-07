import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { fromPrismaEmployee, mockEmployees } from "@motogearsouq/shared";
import type {
  CreateEmployeeInput,
  CreateRoleInput,
  Employee,
  Role,
  UpdateEmployeeInput,
  UpdateRoleInput,
} from "@motogearsouq/shared";
import { withDb, type DbResult } from "../common/with-db";
import { toDomainError } from "../common/prisma-errors";
import { PrismaService } from "../prisma/prisma.service";

const DEFAULT_ROLES = [
  { key: "admin", nameAr: "مدير", nameEn: "Admin", order: 1 },
  { key: "manager", nameAr: "مشرف", nameEn: "Manager", order: 2 },
  { key: "cashier", nameAr: "كاشير", nameEn: "Cashier", order: 3 },
  { key: "warehouse", nameAr: "مستودع", nameEn: "Warehouse", order: 4 },
] as const;

function mockRoles(): Role[] {
  return DEFAULT_ROLES.map((r) => ({
    id: `mock-${r.key}`,
    key: r.key,
    nameAr: r.nameAr,
    nameEn: r.nameEn,
    system: true,
    order: r.order,
    createdAt: new Date().toISOString(),
  }));
}

@Injectable()
export class EmployeesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  getEmployees(): Promise<DbResult<Employee[]>> {
    return withDb(
      this.prisma,
      async (db) => {
        const rows = await db.employee.findMany({
          orderBy: { employeeNumber: "asc" },
          include: {
            branch: true,
            _count: { select: { orders: true, branchAssignments: true } },
          },
        });
        return rows.map(fromPrismaEmployee);
      },
      () => mockEmployees,
    );
  }

  async create(input: CreateEmployeeInput): Promise<DbResult<Employee>> {
    if (!process.env.DATABASE_URL) {
      const now = new Date().toISOString();
      return {
        data: {
          id: `tmp-${input.employeeNumber.toLowerCase()}`,
          employeeNumber: input.employeeNumber,
          nameAr: input.nameAr,
          nameEn: input.nameEn ?? null,
          nationalId: input.nationalId ?? null,
          phone: input.phone,
          email: input.email || null,
          role: input.role,
          branchId: input.branchId ?? null,
          active: input.active ?? true,
          createdAt: now,
        },
        isMock: true,
      };
    }
    try {
      const created = await this.prisma.get().employee.create({
        data: {
          employeeNumber: input.employeeNumber,
          nameAr: input.nameAr,
          nameEn: input.nameEn ?? null,
          nationalId: input.nationalId ?? null,
          phone: input.phone,
          email: input.email || null,
          role: input.role,
          branchId: input.branchId || null,
          active: input.active ?? true,
        },
      });
      return { data: fromPrismaEmployee(created), isMock: false };
    } catch (error) {
      toDomainError(error);
    }
  }

  async update(id: string, input: UpdateEmployeeInput): Promise<DbResult<Employee>> {
    if (!process.env.DATABASE_URL) {
      const emp = mockEmployees.find((e) => e.id === id);
      if (!emp) throw new NotFoundException(`Employee with ID "${id}" not found`);
      const updated: Employee = {
        ...emp,
        ...(input.nameAr !== undefined && { nameAr: input.nameAr }),
        ...(input.nameEn !== undefined && { nameEn: input.nameEn ?? null }),
        ...(input.nationalId !== undefined && { nationalId: input.nationalId || null }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.email !== undefined && { email: input.email || null }),
        ...(input.role !== undefined && { role: input.role }),
        ...(input.branchId !== undefined && { branchId: input.branchId || null }),
        ...(input.active !== undefined && { active: input.active ?? emp.active }),
      };
      return { data: updated, isMock: true };
    }

    const existing = await this.prisma.get().employee.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }

    if (input.branchId) {
      const branch = await this.prisma.get().branch.findUnique({ where: { id: input.branchId } });
      if (!branch) {
        throw new BadRequestException("الفرع غير موجود");
      }
    }

    try {
      const updated = await this.prisma.get().employee.update({
        where: { id },
        data: {
          ...(input.nameAr !== undefined && { nameAr: input.nameAr }),
          ...(input.nameEn !== undefined && { nameEn: input.nameEn ?? null }),
          ...(input.nationalId !== undefined && { nationalId: input.nationalId || null }),
          ...(input.phone !== undefined && { phone: input.phone }),
          ...(input.email !== undefined && { email: input.email || null }),
          ...(input.role !== undefined && { role: input.role }),
          ...(input.branchId !== undefined && { branchId: input.branchId || null }),
          ...(input.active !== undefined && { active: input.active }),
        },
        include: {
          branch: true,
          _count: { select: { orders: true, branchAssignments: true } },
        },
      });
      return { data: fromPrismaEmployee(updated), isMock: false };
    } catch (error) {
      toDomainError(error);
    }
  }

  getRoles(): Promise<DbResult<Role[]>> {
    return withDb(
      this.prisma,
      async (db) => {
        for (const role of DEFAULT_ROLES) {
          await db.role.upsert({
            where: { key: role.key },
            update: {},
            create: { ...role, system: true },
          });
        }
        return db.role.findMany({
          orderBy: [{ order: "asc" }, { key: "asc" }],
        });
      },
      () => mockRoles(),
    );
  }

  async createRole(input: CreateRoleInput): Promise<DbResult<Role>> {
    if (!process.env.DATABASE_URL) {
      return {
        data: {
          id: `mock-${input.key}`,
          key: input.key,
          nameAr: input.nameAr,
          nameEn: input.nameEn,
          system: false,
          order: input.order ?? DEFAULT_ROLES.length + 1,
          createdAt: new Date().toISOString(),
        },
        isMock: true,
      };
    }
    try {
      const db = this.prisma.get();
      const nextOrder = input.order ?? (await db.role.count()) + 1;
      const created = await db.role.create({
        data: {
          key: input.key,
          nameAr: input.nameAr,
          nameEn: input.nameEn,
          order: nextOrder,
        },
      });
      return { data: created, isMock: false };
    } catch (error) {
      toDomainError(error);
    }
  }

  async updateRole(id: string, input: UpdateRoleInput): Promise<DbResult<Role>> {
    if (!process.env.DATABASE_URL) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }
    const existing = await this.prisma.get().role.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }
    try {
      const updated = await this.prisma.get().role.update({
        where: { id },
        data: {
          ...(input.nameAr !== undefined && { nameAr: input.nameAr }),
          ...(input.nameEn !== undefined && { nameEn: input.nameEn }),
          ...(input.order !== undefined && { order: input.order }),
        },
      });
      return { data: updated, isMock: false };
    } catch (error) {
      toDomainError(error);
    }
  }

  async removeRole(id: string): Promise<DbResult<{ id: string }>> {
    if (!process.env.DATABASE_URL) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }
    const db = this.prisma.get();
    const existing = await db.role.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }
    if (existing.system) {
      throw new BadRequestException("لا يمكن حذف دور أساسي");
    }
    const inUse = await db.employee.count({ where: { role: existing.key } });
    if (inUse > 0) {
      throw new ConflictException("لا يمكن حذف دور مستخدم من موظفين");
    }
    try {
      await db.role.delete({ where: { id } });
    } catch (error) {
      toDomainError(error);
    }
    return { data: { id }, isMock: false };
  }
}
