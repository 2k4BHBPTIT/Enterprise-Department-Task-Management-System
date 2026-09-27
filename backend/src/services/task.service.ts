import { prisma } from '../config/db';
import { AppError } from '../utils/AppError';
import { TaskStatus } from '@prisma/client';

export class TaskService {
  async getAll(userRole: string, employeeId?: string, departmentId?: string) {
    let whereClause = {};
    if (userRole === 'MANAGER') {
      whereClause = { project: { department_id: departmentId } };
    } else if (userRole === 'EMPLOYEE') {
      whereClause = { assignee_id: employeeId };
    }

    return prisma.task.findMany({
      where: whereClause,
      include: { project: true, assignee: true }
    });
  }

  async getById(id: string) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        history: { include: { employee: true }, orderBy: { changed_at: 'desc' } },
        comments: { include: { employee: true }, orderBy: { created_at: 'desc' } }
      }
    });
    if (!task) throw new AppError('Task not found', 404);
    return task;
  }

  async create(data: { project_id: string, title: string, description?: string, due_date: string, assignee_id?: string }) {
    // Basic validation: Check if project and assignee are valid
    if (data.assignee_id) {
      const member = await prisma.projectMember.findUnique({
        where: {
          project_id_employee_id: { project_id: data.project_id, employee_id: data.assignee_id }
        }
      });
      if (!member) throw new AppError('Assignee is not a member of this project', 400);
    }

    return prisma.task.create({
      data: {
        project_id: data.project_id,
        title: data.title,
        description: data.description,
        due_date: new Date(data.due_date),
        assignee_id: data.assignee_id
      }
    });
  }

  async update(taskId: string, userId: string, data: { status?: TaskStatus, progress?: number }) {
    if (data.progress !== undefined && (data.progress < 0 || data.progress > 100)) {
      throw new AppError('Progress must be between 0 and 100', 400);
    }

    return prisma.$transaction(async (tx) => {
      const currentTask = await tx.task.findUnique({ where: { id: taskId } });
      if (!currentTask) throw new AppError('Task not found', 404);

      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: {
          status: data.status,
          progress: data.progress
        }
      });

      // Record History
      const histories = [];
      if (data.status && data.status !== currentTask.status) {
        histories.push({
          task_id: taskId,
          changed_by: userId,
          field_changed: 'status',
          old_value: currentTask.status,
          new_value: data.status
        });
      }
      if (data.progress !== undefined && data.progress !== currentTask.progress) {
        histories.push({
          task_id: taskId,
          changed_by: userId,
          field_changed: 'progress',
          old_value: currentTask.progress.toString(),
          new_value: data.progress.toString()
        });
      }

      if (histories.length > 0) {
        await tx.taskHistory.createMany({ data: histories });
      }

      return updatedTask;
    });
  }

  async addComment(taskId: string, employeeId: string, content: string) {
    if (!content) throw new AppError('Content is required', 400);

    return prisma.taskComment.create({
      data: {
        task_id: taskId,
        employee_id: employeeId,
        content
      }
    });
  }
}
