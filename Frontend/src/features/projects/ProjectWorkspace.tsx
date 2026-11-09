import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, Edit2, Eye, Plus, Trash2 } from 'lucide-react';
import { Project, Task } from '../../types';
import { taskApi } from '../../services/api/task.api';
import { useAuthStore } from '../../store/auth.store';
import { TaskFormModal } from '../tasks/TaskFormModal';
import { TaskFormData } from '../../schema/task.schema';
import { StatusBadge } from '../../components/common/StatusBadge';

interface ProjectWorkspaceProps {
  project: Project;
  onBack: () => void;
  onEdit: () => void;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ project, onBack, onEdit }) => {
  const { canCreateTask, canEditTask, canDeleteTask, canEditProject } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await taskApi.getTasks({ projectId: String(project.id) });
      setTasks(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTasks().catch(() => undefined); }, [project.id]);

  const timeline = useMemo(() => tasks
    .slice()
    .sort((a, b) => String(a.deadline || a.dueDate).localeCompare(String(b.deadline || b.dueDate)))
    .map((task) => ({
      id: task.id,
      title: task.title,
      date: String(task.deadline || task.dueDate || '').slice(0, 10),
      status: task.status,
      assignee: task.assigneeName || task.assignee_name || 'Chưa phân công',
      progress: task.progressPercent ?? task.progress_percent ?? 0,
      start: String(task.startDate || task.start_date || '').slice(0, 10),
    })), [tasks]);

  const ganttDays = useMemo(() => {
    const taskDates = tasks.flatMap((task) => [
      task.startDate || task.start_date || '',
      task.deadline || task.dueDate || '',
    ]).filter(Boolean).map((date) => new Date(`${String(date).slice(0, 10)}T00:00:00`)).filter((date) => !Number.isNaN(date.getTime()));
    const projectStart = new Date(`${String(project.startDate || project.start_date || '').slice(0, 10)}T00:00:00`);
    const projectEnd = new Date(`${String(project.endDate || project.end_date || '').slice(0, 10)}T00:00:00`);
    const fallbackStart = taskDates.length ? new Date(Math.min(...taskDates.map((date) => date.getTime()))) : new Date();
    fallbackStart.setDate(fallbackStart.getDate() - 1);
    const startCandidate = Number.isNaN(projectStart.getTime()) ? fallbackStart : projectStart;
    const fallbackEnd = taskDates.length ? new Date(Math.max(...taskDates.map((date) => date.getTime()))) : new Date(startCandidate.getTime() + 30 * 86400000);
    fallbackEnd.setDate(fallbackEnd.getDate() + 2);
    const endCandidate = Number.isNaN(projectEnd.getTime()) ? fallbackEnd : projectEnd;
    const start = new Date(projectStart);
    if (Number.isNaN(projectStart.getTime())) start.setTime(startCandidate.getTime());
    start.setHours(0, 0, 0, 0);
    const end = endCandidate.getTime() >= start.getTime()
      ? new Date(endCandidate)
      : new Date(start.getTime() + 30 * 86400000);
    end.setHours(0, 0, 0, 0);
    const days: Date[] = [];
    for (let cursor = new Date(start); cursor <= end && days.length < 365; cursor.setDate(cursor.getDate() + 1)) {
      days.push(new Date(cursor));
    }
    return { start, end: end.getTime() >= start.getTime() ? end : start, days };
  }, [project, tasks]);

  const dayWidth = 40;
  const timelineWidth = Math.max(680, ganttDays.days.length * dayWidth);
  const ganttMonths = ganttDays.days.reduce<{ key: string; label: string; count: number }[]>((months, day) => {
    const key = `${day.getFullYear()}-${day.getMonth()}`;
    const last = months[months.length - 1];
    if (last?.key === key) last.count += 1;
    else months.push({ key, label: day.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }), count: 1 });
    return months;
  }, []);
  const saveTask = async (data: TaskFormData, isEditing: boolean) => {
    const payload = { ...data, projectId: String(project.id) };
    if (isEditing && editingTask) await taskApi.updateTask(editingTask.id, payload);
    else await taskApi.createTask(payload);
    await loadTasks();
  };

  const removeTask = async (task: Task) => {
    if (!window.confirm(`Xóa đầu việc "${task.title}"?`)) return;
    await taskApi.deleteTask(task.id);
    await loadTasks();
  };

  const completed = tasks.filter((task) => task.status === 'COMPLETED').length;
  const progress = tasks.length ? Math.round(completed / tasks.length * 100) : project.progressPercent ?? project.progress_percent;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <button onClick={onBack} className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-blue-600"><ArrowLeft className="h-3.5 w-3.5" />Danh sách dự án</button>
            <h2 className="text-xl font-bold text-slate-800">{project.name}</h2>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">{project.description || 'Chưa có mô tả dự án.'}</p>
          </div>
          <div className="flex gap-2">
            {canEditProject() && <button onClick={onEdit} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"><Edit2 className="h-3.5 w-3.5" />Sửa dự án</button>}
            {canCreateTask() && <button onClick={() => { setEditingTask(null); setTaskModalOpen(true); }} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" />Thêm đầu việc</button>}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[['Tiến độ', `${progress}%`, 'bg-blue-50 text-blue-700'], ['Đầu việc', tasks.length, 'bg-slate-50 text-slate-700'], ['Đang thực hiện', tasks.filter((task) => task.status === 'IN_PROGRESS').length, 'bg-amber-50 text-amber-700'], ['Hoàn thành', completed, 'bg-emerald-50 text-emerald-700']].map(([label, value, style]) => (
            <div key={String(label)} className={`rounded-2xl p-3 ${style}`}><div className="text-xl font-bold">{value}</div><div className="mt-1 text-[11px] opacity-70">{label}</div></div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-slate-800">Đầu việc dự án</h3><span className="text-[11px] text-slate-400">{tasks.length} đầu việc</span></div>
          <div className="mt-3 divide-y divide-slate-100">
            {loading && <div className="py-12 text-center text-xs text-slate-400">Đang tải đầu việc...</div>}
            {!loading && !tasks.length && <div className="py-12 text-center text-xs text-slate-400">Dự án chưa có đầu việc.</div>}
            {tasks.map((task) => (
              <div key={task.id} className="flex flex-wrap items-center gap-3 py-3">
                <button onClick={() => setDetailTask(task)} className="min-w-0 flex-1 text-left">
                  <div className="truncate text-xs font-bold text-slate-800">{task.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400"><span>{task.assigneeName || task.assignee_name || 'Chưa phân công'}</span><span>•</span><span>{String(task.deadline || task.dueDate || '').slice(0, 10)}</span></div>
                </button>
                <StatusBadge status={task.status} />
                <button title="Xem chi tiết" onClick={() => setDetailTask(task)} className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Eye className="h-3.5 w-3.5" /></button>
                {canEditTask() && <button title="Sửa đầu việc" onClick={() => { setEditingTask(task); setTaskModalOpen(true); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Edit2 className="h-3.5 w-3.5" /></button>}
                {canDeleteTask() && <button title="Xóa đầu việc" onClick={() => removeTask(task)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>}
              </div>
            ))}
          </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-blue-600" /><div><h3 className="text-sm font-bold text-slate-800">Timeline tổng quan</h3><p className="mt-0.5 text-[10px] text-slate-400">Lịch trình đầu việc theo trục thời gian dự án</p></div></div>
        {!timeline.length ? (
          <div className="py-12 text-center text-xs text-slate-400">Timeline sẽ được tạo sau khi có đầu việc.</div>
        ) : (
          <div className="mt-4 overflow-auto rounded-2xl border border-slate-200">
            <div className="grid" style={{ gridTemplateColumns: `260px ${timelineWidth}px` }}>
              <div className="sticky left-0 z-30 border-b border-r border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Đầu việc</div>
              </div>
              <div>
                <div className="flex border-b border-slate-200 bg-slate-50">
                  {ganttMonths.map((month) => (
                    <div key={month.key} className="border-r border-slate-200 py-2 text-center text-[10px] font-bold capitalize text-slate-600" style={{ width: month.count * dayWidth }}>
                      {month.label}
                    </div>
                  ))}
                </div>
                <div className="flex bg-white">
                  {ganttDays.days.map((day) => (
                    <div key={day.toISOString()} className={`flex h-9 flex-col items-center justify-center border-r border-slate-100 text-[9px] ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-slate-50 text-slate-400' : 'text-slate-500'}`} style={{ width: dayWidth, minWidth: dayWidth }}>
                      <span className="text-[8px] font-medium uppercase">{day.toLocaleDateString('vi-VN', { weekday: 'narrow' })}</span>
                      <span className="font-bold">{day.getDate()}</span>
                    </div>
                  ))}
                </div>
              </div>
              {timeline.map((item, index) => {
                const deadline = item.date ? new Date(`${item.date}T00:00:00`) : new Date(ganttDays.start.getTime() + 7 * 86400000);
                const fallbackStart = item.start ? new Date(`${item.start}T00:00:00`) : new Date(deadline.getTime() - 6 * 86400000);
                const start = fallbackStart.getTime() < ganttDays.start.getTime() ? ganttDays.start : fallbackStart;
                const left = Math.max(0, Math.round((start.getTime() - ganttDays.start.getTime()) / 86400000) * dayWidth);
                const endDay = Math.max(start.getTime(), deadline.getTime());
                const spanDays = Math.max(1, Math.round((endDay - start.getTime()) / 86400000) + 1);
                const width = Math.max(dayWidth, spanDays * dayWidth - 8);
                const barColor = item.status === 'COMPLETED' ? '#10b981' : item.status === 'OVERDUE' || item.status === 'BLOCKED' ? '#ef4444' : ['#3b82f6', '#f59e0b', '#8b5cf6'][index % 3];
                const todayLeft = Math.round((new Date(new Date().toDateString()).getTime() - ganttDays.start.getTime()) / 86400000) * dayWidth;
                return (
                  <React.Fragment key={item.id}>
                    <button onClick={() => setDetailTask(tasks.find((task) => String(task.id) === String(item.id)) || null)} className="sticky left-0 z-20 h-[56px] border-b border-r border-slate-100 bg-white px-3 text-left hover:bg-blue-50/40">
                      <div className="truncate text-[11px] font-bold text-slate-700">{item.title}</div>
                      <div className="mt-1 truncate text-[9px] text-slate-400">{item.assignee}</div>
                    </button>
                    <div className="relative h-[56px] border-b border-slate-100">
                      <div className="absolute inset-y-0 flex">
                        {ganttDays.days.map((day) => (
                          <div key={day.toISOString()} className={`border-r border-slate-100 ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-slate-50/70' : ''}`} style={{ width: dayWidth, minWidth: dayWidth }} />
                        ))}
                      </div>
                      {todayLeft >= 0 && todayLeft <= timelineWidth && (
                        <div className="pointer-events-none absolute top-0 z-10 h-full w-px bg-red-400" style={{ left: todayLeft }}><div className="absolute -left-1 top-0 h-2 w-2 rounded-full bg-red-400" /></div>
                      )}
                      <div className="absolute top-[12px] flex h-[30px] items-center overflow-hidden rounded-md shadow-sm" title={`${item.start || item.date || 'Chưa có ngày bắt đầu'} → ${item.date || 'Chưa có hạn hoàn thành'} • ${item.progress}%`} style={{ left, width, backgroundColor: barColor }}>
                        <div className="absolute inset-y-0 left-0 bg-white/20" style={{ width: `${Math.min(100, item.progress)}%` }} />
                        <span className="relative px-2 text-[9px] font-bold text-white">{item.progress}%</span>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <TaskFormModal isOpen={taskModalOpen} onClose={() => setTaskModalOpen(false)} onSubmitSuccess={saveTask} initialTask={editingTask} defaultProjectId={String(project.id)} />
      {detailTask && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setDetailTask(null)}><div onClick={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl"><div className="flex items-center justify-between"><h3 className="text-base font-bold text-slate-800">{detailTask.title}</h3><button onClick={() => setDetailTask(null)} className="text-xl text-slate-400">×</button></div><p className="mt-3 text-xs leading-5 text-slate-500">{detailTask.description || 'Không có mô tả.'}</p><div className="mt-5 grid grid-cols-2 gap-3 text-xs"><div className="rounded-2xl bg-slate-50 p-3"><span className="text-slate-400">Người thực hiện</span><b className="mt-1 block">{detailTask.assigneeName || 'Chưa phân công'}</b></div><div className="rounded-2xl bg-slate-50 p-3"><span className="text-slate-400">Hạn hoàn thành</span><b className="mt-1 block">{String(detailTask.deadline || detailTask.dueDate).slice(0, 10)}</b></div><div className="rounded-2xl bg-slate-50 p-3"><span className="text-slate-400">Trạng thái</span><div className="mt-1"><StatusBadge status={detailTask.status} /></div></div><div className="rounded-2xl bg-slate-50 p-3"><span className="text-slate-400">Ưu tiên</span><b className="mt-1 block">{detailTask.priority}</b></div></div></div></div>}
    </div>
  );
};
