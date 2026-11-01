import { HRScorecardRecord, Task } from '../../types';
import { taskApi } from './task.api';
import { userApi } from './user.api';

export const hrApi = {
  getScorecards: async (): Promise<HRScorecardRecord[]> => {
    const [tasks, users] = await Promise.all([taskApi.getTasks(), userApi.getUsers()]);
    return users.map((user) => {
      const assigned = tasks.filter((task) => String(task.assigneeId) === String(user.id));
      const completed = assigned.filter((task) => task.status === 'COMPLETED');
      const overdue = assigned.filter((task) => task.status === 'OVERDUE' || (task.overdueDays || 0) > 0);
      const completionRate = assigned.length ? Math.round(completed.length / assigned.length * 100) : 0;
      return {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        departmentName: user.departmentName || '-',
        roleName: user.role,
        totalTasks: assigned.length,
        completedTasks: completed.length,
        onTimeTasks: completed.length,
        onTimeRate: completionRate,
        overdueTasks: overdue.length,
        avgOverdueDays: overdue.length ? 1 : 0,
        avgWeightScore: assigned.length ? 1 : 0,
        overallScore: completionRate,
        rankTier: completionRate >= 80 ? 'A' : completionRate >= 50 ? 'B' : 'C',
      };
    });
  },

  getViolations: async (): Promise<Task[]> => {
    // Lấy danh sách các task vi phạm hoặc cần đánh giá kỷ luật
    const tasks = await taskApi.getTasks();
    return tasks.filter((task) => (task.overdueDays ?? 0) > 0 || task.status === 'OVERDUE');
  },
};
