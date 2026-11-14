import React, { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, Search, Users } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { Task, User } from '../../types';
import { projectApi } from '../../services/api/project.api';
import { taskApi } from '../../services/api/task.api';
import { userApi } from '../../services/api/user.api';
import { useAuthStore } from '../../store/auth.store';

export const ManagerTeam: React.FC = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectCount, setProjectCount] = useState(0);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError('');
    Promise.all([userApi.getUsers(), projectApi.getProjects(), taskApi.getTasks()])
      .then(([allUsers, allProjects, allTasks]) => {
        if (!active) return;
        const managedProjects = allProjects.filter((project) =>
          String(project.leader_id ?? project.pmId) === String(currentUser.id));
        const managedProjectIds = new Set(managedProjects.map((project) => String(project.id)));
        const departmentId = currentUser.departmentId ?? currentUser.department_id;
        const teamMembers = departmentId && String(departmentId) !== '0'
          ? allUsers.filter((user) => user.status === 'ACTIVE'
            && String(user.departmentId ?? user.department_id) === String(departmentId)
            && String(user.id) !== String(currentUser.id))
          : [];
        setUsers(teamMembers);
        setTasks(allTasks.filter((task) => managedProjectIds.has(String(task.projectId ?? task.project_id))));
        setProjectCount(managedProjects.length);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Không thể tải dữ liệu nhân sự bộ phận.');
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [currentUser.departmentId, currentUser.department_id, currentUser.id]);

  const workload = useMemo(() => {
    const result = new Map<string, { total: number; inProgress: number; overdue: number }>();
    tasks.forEach((task) => {
      const assigneeId = String(task.assigneeId ?? task.assignee_id);
      if (!assigneeId || assigneeId === '0') return;
      const current = result.get(assigneeId) || { total: 0, inProgress: 0, overdue: 0 };
      current.total += 1;
      if (task.status === 'IN_PROGRESS') current.inProgress += 1;
      if (task.status === 'OVERDUE' || (task.overdueDays ?? 0) > 0) current.overdue += 1;
      result.set(assigneeId, current);
    });
    return result;
  }, [tasks]);

  const visibleUsers = users.filter((user) =>
    `${user.full_name || user.name} ${user.specialization || ''} ${user.email}`.toLowerCase().includes(search.toLowerCase()));
  const departmentId = currentUser.departmentId ?? currentUser.department_id;
  const hasDepartment = Boolean(departmentId) && String(departmentId) !== '0';
  const maxWorkload = Math.max(1, ...visibleUsers.map((user) => workload.get(String(user.id))?.total || 0));
  const assignedTaskCount = tasks.filter((task) => Number(task.assigneeId ?? task.assignee_id) > 0).length;
  const unassignedTaskCount = tasks.length - assignedTaskCount;

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Users className="h-5 w-5" /></div>
          <div><h2 className="text-sm font-bold text-slate-800">Nhân sự bộ phận</h2><p className="mt-1 text-xs text-slate-400">Chức vụ chuyên môn và workload trong các dự án bạn chủ trì.</p></div>
        </div>
      </section>

      {error && <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Nhân sự bộ phận', users.length, 'text-blue-700 bg-blue-50'],
          ['Dự án chủ trì', projectCount, 'text-violet-700 bg-violet-50'],
          ['Task đã phân công', assignedTaskCount, 'text-emerald-700 bg-emerald-50'],
          ['Task chưa phân công', unassignedTaskCount, 'text-amber-700 bg-amber-50'],
        ].map(([label, value, style]) => <div key={String(label)} className={`rounded-2xl p-4 ${style}`}><div className="text-xl font-bold">{value}</div><div className="mt-1 text-[10px] opacity-75">{String(label)}</div></div>)}
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div><h3 className="text-sm font-bold text-slate-800">Thành viên bộ phận ({visibleUsers.length})</h3><p className="mt-1 text-[10px] text-slate-400">Workload tính trên task thuộc các dự án do bạn chủ trì.</p></div>
          <label className="relative block w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên, chức vụ, email..." className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </label>
        </div>
        {isLoading ? <div role="status" className="p-12 text-center text-xs text-slate-400">Đang tải nhân sự và workload...</div>
          : !hasDepartment ? <div className="p-5 text-xs text-amber-700">Tài khoản Manager chưa được gán phòng ban, nên chưa thể xác định danh sách nhân sự thuộc bộ phận.</div>
            : !visibleUsers.length ? <EmptyState title={search ? 'Không tìm thấy nhân sự' : 'Chưa có nhân sự trong bộ phận'} description={search ? 'Thử từ khóa tìm kiếm khác.' : 'Nhân sự đang hoạt động trong cùng phòng ban sẽ xuất hiện tại đây.'} />
              : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500"><tr><th className="px-5 py-3 font-semibold">Nhân viên</th><th className="px-4 py-3 font-semibold">Chức vụ chuyên môn</th><th className="px-4 py-3 font-semibold">Đang thực hiện</th><th className="px-4 py-3 font-semibold">Quá hạn</th><th className="px-5 py-3 font-semibold">Tổng workload</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleUsers.map((user) => {
                        const current = workload.get(String(user.id)) || { total: 0, inProgress: 0, overdue: 0 };
                        return <tr key={user.id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-3.5"><div className="font-semibold text-slate-800">{user.full_name || user.name}</div><div className="mt-1 text-[10px] text-slate-400">{user.email}</div></td>
                          <td className="px-4 py-3.5"><div className="flex items-center gap-1.5 text-slate-600"><BriefcaseBusiness className="h-3.5 w-3.5 text-slate-400" />{user.specialization || 'Chưa cập nhật chức vụ'}</div></td>
                          <td className="px-4 py-3.5 font-semibold text-blue-700">{current.inProgress}</td>
                          <td className="px-4 py-3.5 font-semibold text-rose-600">{current.overdue}</td>
                          <td className="px-5 py-3.5"><div className="flex min-w-32 items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-500" style={{ width: `${current.total / maxWorkload * 100}%` }} /></div><span className="w-8 text-right font-bold text-slate-700">{current.total}</span></div></td>
                        </tr>;
                      })}
                    </tbody>
                  </table>
                </div>
              )}
      </section>
    </div>
  );
};
