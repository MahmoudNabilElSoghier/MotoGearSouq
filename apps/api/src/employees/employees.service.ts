import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { fromPrismaEmployee, mockEmployees } from "@motogearsouq/shared";
import type { CreateEmployeeInput, Employee, UpdateEmployeeInput } from "@motogearsouq/shared";
import { withDb, type DbResult } from "../common/with-db";
import { toDomainError } from "../common/prisma-errors";
import { PrismaService } from "../prisma/prisma.service";

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
}
