import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { taskApi } from '../../services/api/task.api';
import { projectApi } from '../../services/api/project.api';
import { Task, Project } from '../../types';
import { useAuthStore } from '../../store/auth.store';
import { useFilterStore } from '../../store/filter.store';

export const PMOverview: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const setActiveTab = useAuthStore((state) => state.setActiveTab);
  const currentUser = useAuthStore((state) => state.currentUser);
  const setFilters = useFilterStore((state) => state.setFilters);

  const openProjects = (projectId?: number | string) => {
    if (projectId) setFilters({ searchTerm: '', fromDate: '', toDate: '', status: 'ALL', priority: 'ALL', projectId: String(projectId), assigneeId: 'ALL', departmentId: 'ALL', taskType: 'ALL', onlyOverdue: false });
    setActiveTab('projects');
  };

  useEffect(() => {
    let active = true;
    Promise.all([taskApi.getTasks(), projectApi.getProjects()])
      .then(([taskData, projectData]) => {
        if (!active) return;
        const managedProjects = currentUser.role === 'MANAGER'
          ? projectData.filter((project) => String(project.leader_id ?? project.pmId) === String(currentUser.id))
          : projectData;
        const projectIds = new Set(managedProjects.map((project) => String(project.id)));
        setTasks(currentUser.role === 'MANAGER'
          ? taskData.filter((task) => projectIds.has(String(task.projectId ?? task.project_id)))
          : taskData);
        setProjects(managedProjects);
        setError('');
      })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu tổng quan'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [currentUser.id, currentUser.role]);

  const count = (status: string) => tasks.filter((task) => task.status === status).length;
  const overdue = tasks.filter((task) => task.status === 'OVERDUE' || (task.overdueDays || 0) > 0).length;
  const completedPercent = tasks.length ? Math.round(count('COMPLETED') / tasks.length * 1000) / 10 : 0;
  const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const todayKey = dateKey(today);
  const nextWeekKey = dateKey(nextWeek);
  const dueSoon = tasks.filter((task) => {
    const deadline = String(task.deadline || task.dueDate || '').slice(0, 10);
    return deadline >= todayKey && deadline <= nextWeekKey && !['COMPLETED', 'CANCELLED'].includes(task.status);
  }).length;
  const assignedPeople = new Set(tasks
    .map((task) => String(task.assigneeId ?? task.assignee_id))
    .filter((id) => id !== '0' && id !== 'undefined' && id !== 'null'));
  const cards = currentUser.role === 'MANAGER' ? [
    ['Dự án chủ trì', projects.length, 'text-violet-600'],
    ['Dự án đang làm', projects.filter((project) => project.status === 'IN_PROGRESS').length, 'text-blue-600'],
    ['Task sắp đến hạn', dueSoon, 'text-amber-600'],
    ['Task trễ hạn', overdue, 'text-rose-600'],
    ['Nhân sự đang phân công', assignedPeople.size, 'text-sky-600'],
    ['Hoàn thành', `${completedPercent}%`, 'text-emerald-600'],
  ] as const : [
    ['Tổng công việc', tasks.length, 'text-blue-600'],
    ['Đang làm', count('IN_PROGRESS'), 'text-blue-600'],
    ['Hoàn thành', count('COMPLETED'), 'text-emerald-600'],
    ['Đang chờ', count('WAITING'), 'text-sky-600'],
    ['Bị chặn', count('BLOCKED'), 'text-amber-600'],
    ['Quá hạn', overdue, 'text-rose-600'],
  ] as const;

  const statusData = [
    { name: 'Chưa làm', status: 'TODO', value: count('TODO'), color: '#94A3B8' },
    { name: 'Đang làm', status: 'IN_PROGRESS', value: count('IN_PROGRESS'), color: '#3B82F6' },
    { name: 'Hoàn thành', status: 'COMPLETED', value: count('COMPLETED'), color: '#10B981' },
  ].filter((item) => item.value > 0);

  const priorityData = [
    { name: 'Thấp', priority: 'LOW', value: tasks.filter((task) => task.priority === 'LOW').length, color: '#94A3B8' },
    { name: 'Trung bình', priority: 'MEDIUM', value: tasks.filter((task) => task.priority === 'MEDIUM').length, color: '#38BDF8' },
    { name: 'Cao', priority: 'HIGH', value: tasks.filter((task) => task.priority === 'HIGH').length, color: '#F59E0B' },
    { name: 'Khẩn cấp', priority: 'URGENT', value: tasks.filter((task) => task.priority === 'URGENT').length, color: '#F43F5E' },
  ];

  const workloadData = Array.from(tasks.reduce((result, task) => {
    const name = task.assigneeName || task.assignee_name || 'Chưa phân công';
    const current = result.get(name) || { total: 0, completed: 0 };
    current.total += 1;
    if (task.status === 'COMPLETED') current.completed += 1;
    result.set(name, current);
    return result;
  }, new Map<string, { total: number; completed: number }>()).entries())
    .map(([name, value]) => ({
      name: name.length > 16 ? `${name.slice(0, 16)}...` : name,
      total: value.total,
      completed: value.completed,
      assigneeId: tasks.find((task) => (task.assigneeName || task.assignee_name || 'Chưa phân công') === name)?.assigneeId
        ?? tasks.find((task) => (task.assigneeName || task.assignee_name || 'Chưa phân công') === name)?.assignee_id,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  if (error) return <div className="bg-white rounded-3xl p-5 text-red-600">{error}</div>;
  if (isLoading) return <div className="bg-white rounded-3xl p-10 text-center text-sm text-slate-500">Đang tải dashboard...</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(([label, value, color]) => (
          <div
            key={label}
            className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm"
          >
            <span className="text-xs text-slate-500 font-medium">{label}</span>
            <div className={`mt-2 text-2xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="self-start text-sm font-bold">Tỷ lệ hoàn thành chung</h3>
          <div className="mt-4 flex h-36 w-36 items-center justify-center rounded-full" style={{ background: `conic-gradient(#10B981 ${completedPercent}%, #E2E8F0 ${completedPercent}% 100%)` }}>
            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white"><strong className="text-2xl text-slate-800">{completedPercent}%</strong><span className="mt-1 text-[10px] text-slate-400">{count('COMPLETED')}/{tasks.length} task</span></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold">Phân bổ trạng thái công việc</h3>
          <div className="h-72 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={105}
                  paddingAngle={2}
                  className="outline-none"
                >
                  {statusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold">Công việc theo mức ưu tiên</h3>
          <div className="mt-3 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" name="Số công việc" radius={[8, 8, 0, 0]}>
                  {priorityData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><h3 className="text-sm font-bold">Tiến độ dự án đang thực hiện</h3><span className="text-[10px] text-slate-400">{projects.filter((project) => project.status === 'IN_PROGRESS').length} dự án</span></div>
          <div className="mt-4 max-h-80 space-y-4 overflow-y-auto pr-1">
            {projects.filter((project) => project.status === 'IN_PROGRESS').map((project) => {
              const progress = Math.max(0, Math.min(100, Number(project.progressPercent ?? project.progress_percent ?? 0)));
              return <button key={project.id} type="button" onClick={() => openProjects(project.id)} className="w-full text-left">
                <div className="mb-1.5 flex items-center justify-between gap-3"><span className="truncate text-xs font-semibold text-slate-700">{project.name}</span><span className="shrink-0 text-[11px] font-bold text-blue-700">{progress}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} /></div>
              </button>;
            })}
            {!projects.some((project) => project.status === 'IN_PROGRESS') && <p className="py-12 text-center text-xs text-slate-400">Hiện không có dự án đang thực hiện.</p>}
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold">Khối lượng công việc theo nhân sự</h3>
          <div className="h-80 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" interval={0} angle={-35} textAnchor="end" tick={{ fontSize: 9 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="total" name="Tổng việc" fill="#60A5FA" radius={[5, 5, 0, 0]} />
                <Bar dataKey="completed" name="Đã hoàn thành" fill="#34D399" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
