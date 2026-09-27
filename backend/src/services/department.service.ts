import { prisma } from '../config/db';
import { AppError } from '../utils/AppError';

export class DepartmentService {
  async getAll() {
    return prisma.department.findMany({
      include: { manager: true, _count: { select: { employees: true, projects: true } } }
    });
  }

  async create(name: string) {
    if (!name) throw new AppError('Department name is required', 400);
    return prisma.department.create({ data: { name } });
  }

  async update(id: string, name: string) {
    return prisma.department.update({
      where: { id },
      data: { name }
    });
  }

  async delete(id: string) {
    return prisma.department.delete({ where: { id } });
  }

  async assignManager(id: string, employeeId: string) {
    // 1. Verify employee exists and has MANAGER role
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: { include: { role: true } } }
    });

    if (!employee) throw new AppError('Employee not found', 404);
    if (employee.user.role.name !== 'MANAGER') {
      throw new AppError('Employee must have MANAGER role', 400);
    }

    // 2. Assign manager
    return prisma.$transaction(async (tx) => {
      // Update employee's department if they are from another dept
      if (employee.department_id !== id) {
        await tx.employee.update({
          where: { id: employeeId },
          data: { department_id: id }
        });
      }

      // Update department manager
      return tx.department.update({
        where: { id },
        data: { manager_id: employeeId }
      });
    });
  }
}
