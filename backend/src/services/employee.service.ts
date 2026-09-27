import { prisma } from '../config/db';
import { AppError } from '../utils/AppError';
import bcrypt from 'bcrypt';

export class EmployeeService {
  async getAll(userRole: string, departmentId?: string) {
    let whereClause = {};
    if (userRole === 'MANAGER' && departmentId) {
      whereClause = { department_id: departmentId };
    }
    return prisma.employee.findMany({
      where: whereClause,
      include: { user: { select: { email: true, role: true } }, department: true, position: true }
    });
  }

  async create(data: { email: string, passwordString: string, full_name: string, role_id: string, department_id?: string, position_id?: string, phone?: string }) {
    if (!data.email || !data.passwordString || !data.full_name || !data.role_id) {
      throw new AppError('Missing required fields', 400);
    }

    const hashedPassword = await bcrypt.hash(data.passwordString, 10);

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          role_id: data.role_id,
          employee: {
            create: {
              full_name: data.full_name,
              phone: data.phone,
              department_id: data.department_id,
              position_id: data.position_id
            }
          }
        },
        include: { employee: true }
      });
      return user;
    });
  }

  async update(id: string, data: { department_id?: string, position_id?: string }) {
    return prisma.employee.update({
      where: { id },
      data: {
        department_id: data.department_id,
        position_id: data.position_id
      }
    });
  }
}
