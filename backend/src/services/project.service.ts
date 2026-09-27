import { prisma } from '../config/db';
import { AppError } from '../utils/AppError';

export class ProjectService {
  async getAll(userRole: string, employeeId?: string, departmentId?: string) {
    let whereClause = {};
    if (userRole === 'MANAGER') {
      whereClause = { department_id: departmentId };
    } else if (userRole === 'EMPLOYEE') {
      whereClause = { members: { some: { employee_id: employeeId } } };
    }

    return prisma.project.findMany({
      where: whereClause,
      include: { 
        department: true,
        _count: { select: { members: true, tasks: true } }
      }
    });
  }

  async getById(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: { include: { employee: true } },
        tasks: { include: { assignee: true } }
      }
    });
    if (!project) throw new AppError('Project not found', 404);
    return project;
  }

  async create(data: { name: string, department_id: string, start_date: string, end_date: string }) {
    return prisma.project.create({
      data: {
        name: data.name,
        department_id: data.department_id,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date)
      }
    });
  }

  async addMember(projectId: string, employeeId: string) {
    // Check if employee is in the same department as the project
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });

    if (!project || !employee) throw new AppError('Project or Employee not found', 404);

    if (project.department_id !== employee.department_id) {
      throw new AppError('Employee must be in the same department as the project', 400);
    }

    return prisma.projectMember.create({
      data: {
        project_id: projectId,
        employee_id: employeeId
      }
    });
  }
}
