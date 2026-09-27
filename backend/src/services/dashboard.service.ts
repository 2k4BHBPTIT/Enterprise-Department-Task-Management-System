import { prisma } from '../config/db';
import { RoleName } from '@prisma/client';

export class DashboardService {
  async getSummary(userRole: string, departmentId?: string) {
    let deptFilter = {};
    let projectFilter = {};
    if (userRole === RoleName.MANAGER && departmentId) {
      deptFilter = { id: departmentId };
      projectFilter = { department_id: departmentId };
    }

    const [totalEmployees, projects, tasks] = await Promise.all([
      prisma.employee.count({ where: { department: deptFilter } }),
      prisma.project.findMany({
        where: projectFilter,
        include: { _count: { select: { tasks: true } } }
      }),
      prisma.task.findMany({
        where: { project: projectFilter },
        select: { status: true, due_date: true, progress: true }
      })
    ]);

    const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;

    let completedTasks = 0;
    let overdueTasks = 0;
    const now = new Date();

    const taskStatusCounts = tasks.reduce((acc: any, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      if (task.status === 'DONE') completedTasks++;
      if (task.due_date < now && task.status !== 'DONE') overdueTasks++;
      return acc;
    }, {});

    return {
      totalEmployees,
      totalProjects: projects.length,
      activeProjects,
      totalTasks: tasks.length,
      completedTasks,
      overdueTasks,
      taskStatusCounts
    };
  }
}
