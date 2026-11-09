import { apiClient, ApiResponse, unwrapResponse } from './client';
import { HRScorecardRecord, Task } from '../../types';
import { taskApi } from './task.api';
import { userApi } from './user.api';

export const hrApi = {
  getScorecards: async (): Promise<HRScorecardRecord[]> => {
    try {
      const response = await apiClient.get<ApiResponse<HRScorecardRecord[]> | HRScorecardRecord[]>('/hr/scorecards');
      const payload = response.data;
      const records = ('success' in payload ? unwrapResponse(payload) : payload) as HRScorecardRecord[];
      if (records.length) return records.map(normalizeScorecard);
    } catch {
      // Use the local aggregation only when the optional HR endpoint is unavailable.
    }
    const [tasks, users] = await Promise.all([taskApi.getTasks(), userApi.getUsers()]);
    return users.map((user) => {
      const assigned = tasks.filter((task) => String(task.assigneeId) === String(user.id));
      const completed = assigned.filter((task) => task.status === 'COMPLETED');
      const overdue = assigned.filter((task) => task.status === 'OVERDUE' || (task.overdueDays || 0) > 0);
      const completionRate = assigned.length ? Math.round(completed.length / assigned.length * 100) : 0;
      const onTime = completed.filter((task) => !(task.status === 'OVERDUE' || (task.overdueDays || 0) > 0)).length;
      return {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        departmentName: user.departmentName || '-',
        roleName: user.role,
        totalTasks: assigned.length,
        completedTasks: completed.length,
        onTimeTasks: onTime,
        onTimeRate: completed.length ? Math.round(onTime / completed.length * 100) : 0,
        overdueTasks: overdue.length,
        avgOverdueDays: overdue.length
          ? Number((overdue.reduce((sum, task) => sum + (task.overdueDays || 0), 0) / overdue.length).toFixed(1))
          : 0,
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

const normalizeScorecard = (record: HRScorecardRecord): HRScorecardRecord => ({
  ...record,
  totalTasks: Number(record.totalTasks ?? 0),
  completedTasks: Number(record.completedTasks ?? 0),
  onTimeTasks: Number(record.onTimeTasks ?? 0),
  overdueTasks: Number(record.overdueTasks ?? 0),
  onTimeRate: Number(record.onTimeRate ?? 0),
  avgOverdueDays: Number(record.avgOverdueDays ?? 0),
  avgWeightScore: Number(record.avgWeightScore ?? 0),
  overallScore: Number(record.overallScore ?? 0),
  rankTier: record.rankTier || '-',
});
