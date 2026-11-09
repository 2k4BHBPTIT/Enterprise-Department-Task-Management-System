import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  ListTodo,
  Sparkles,
  Target,
} from 'lucide-react';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { taskApi } from '../../services/api/task.api';
import { useAuthStore } from '../../store/auth.store';
import { Task } from '../../types';

const getDeadlineTime = (task: Task) => {
  const deadline = task.deadline || task.dueDate;
  const dateValue = /^\d{4}-\d{2}-\d{2}$/.test(deadline) ? `${deadline}T23:59:59` : deadline;
  const timestamp = new Date(dateValue).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY;
};

const formatDeadline = (task: Task) => {
  const timestamp = getDeadlineTime(task);
  return Number.isFinite(timestamp)
    ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(timestamp)
    : 'Chưa có hạn';
};

export const EmployeeOverview: React.FC = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const setActiveTab = useAuthStore((state) => state.setActiveTab);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    taskApi.getTasks({ assigneeId: String(currentUser.id) })
      .then((data) => {
        if (!active) return;
        setTasks(data.filter((task) => String(task.assigneeId ?? task.assignee_id) === String(currentUser.id)));
        setError('');
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Không thể tải công việc của bạn');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [currentUser.id]);

  const stats = useMemo(() => {
    const activeTasks = tasks.filter((task) => !['COMPLETED', 'CANCELLED'].includes(task.status));
    const completed = tasks.filter((task) => task.status === 'COMPLETED').length;
    const overdue = activeTasks.filter((task) => {
      const deadline = getDeadlineTime(task);
      return task.status === 'OVERDUE' || (Number.isFinite(deadline) && deadline < Date.now());
    }).length;
    const dueSoon = activeTasks.filter((task) => {
      const daysLeft = (getDeadlineTime(task) - Date.now()) / 86400000;
      return daysLeft >= 0 && daysLeft <= 3;
    }).length;
    return { total: tasks.length, active: activeTasks.length, completed, overdue, dueSoon };
  }, [tasks]);

  const upcomingTasks = useMemo(
    () => tasks
      .filter((task) => !['COMPLETED', 'CANCELLED'].includes(task.status))
      .sort((a, b) => getDeadlineTime(a) - getDeadlineTime(b))
      .slice(0, 5),
    [tasks],
  );
  const firstName = currentUser.name.trim().split(/\s+/).slice(-1)[0] || 'bạn';

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 p-6 text-white shadow-lg shadow-blue-200/60 sm:p-8">
        <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full border-[28px] border-white/10" aria-hidden="true" />
        <div className="absolute bottom-0 right-28 h-24 w-24 rounded-full bg-cyan-300/20 blur-2xl" aria-hidden="true" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-blue-50">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Không gian làm việc của bạn
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Xin chào, {firstName}!</h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-blue-100">
              Đây là tổng quan công việc được giao cho bạn. Hãy cập nhật tiến độ để cả nhóm cùng nắm bắt nhé.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600"
          >
            Xem công việc của tôi <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </section>

      <section aria-label="Thống kê công việc" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Tổng công việc', value: stats.total, detail: 'Được giao cho bạn', icon: ListTodo, valueClass: 'text-blue-600', iconClass: 'bg-blue-50 text-blue-600' },
          { label: 'Chưa hoàn thành', value: stats.active, detail: `${stats.dueSoon} việc sắp đến hạn`, icon: Clock3, valueClass: 'text-amber-600', iconClass: 'bg-amber-50 text-amber-600' },
          { label: 'Đã hoàn thành', value: stats.completed, detail: 'Hoàn tất công việc', icon: CheckCircle2, valueClass: 'text-emerald-600', iconClass: 'bg-emerald-50 text-emerald-600' },
          { label: 'Quá hạn', value: stats.overdue, detail: 'Cần ưu tiên xử lý', icon: Target, valueClass: 'text-rose-600', iconClass: 'bg-rose-50 text-rose-600' },
        ].map(({ label, value, detail, icon: Icon, valueClass, iconClass }) => (
          <div key={label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className={`mt-2 text-3xl font-bold tracking-tight ${valueClass}`}>{isLoading ? '—' : value}</p>
              </div>
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-[11px] text-slate-400">{detail}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Công việc cần tập trung</h2>
            <p className="mt-1 text-xs text-slate-400">Các việc chưa hoàn thành, sắp xếp theo hạn chót</p>
          </div>
          <button type="button" onClick={() => setActiveTab('tasks')} className="inline-flex items-center gap-1 self-start text-xs font-semibold text-blue-600 hover:text-blue-700 sm:self-auto">
            Xem tất cả <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        {error ? (
          <div role="alert" className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : isLoading ? (
          <div role="status" className="space-y-3 p-5" aria-label="Đang tải công việc">
            {[1, 2, 3].map((row) => <div key={row} className="h-16 animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none" />)}
          </div>
        ) : upcomingTasks.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-slate-700">Bạn đã hoàn thành mọi việc!</p>
            <p className="mt-1 text-xs text-slate-400">Công việc mới được giao sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcomingTasks.map((task) => (
              <button
                type="button"
                key={task.id}
                onClick={() => setActiveTab('tasks')}
                className="group flex w-full flex-col gap-3 px-5 py-4 text-left transition hover:bg-slate-50/80 sm:flex-row sm:items-center sm:px-6"
              >
                <Circle className="hidden h-4 w-4 shrink-0 text-slate-300 group-hover:text-blue-500 sm:block" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-blue-700">{task.title}</p>
                  <p className="mt-1 truncate text-xs text-slate-400">{task.projectName || task.project_name || 'Chưa gắn dự án'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatDeadline(task)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
