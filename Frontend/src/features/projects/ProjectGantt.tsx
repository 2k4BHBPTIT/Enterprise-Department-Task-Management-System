import React from 'react';
import { Project, Task } from '../../types';

interface ProjectGanttProps {
  project: Project;
  tasks: Task[];
}

const getDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

const formatDate = (value: number) => new Date(value).toISOString().slice(0, 10);

const taskStatusColor: Record<Task['status'], string> = {
  TODO: 'bg-slate-400',
  IN_PROGRESS: 'bg-blue-500',
  WAITING: 'bg-sky-500',
  BLOCKED: 'bg-amber-500',
  COMPLETED: 'bg-emerald-500',
  OVERDUE: 'bg-rose-500',
  CANCELLED: 'bg-slate-300',
};

export const ProjectGantt: React.FC<ProjectGanttProps> = ({ project, tasks }) => {
  const taskDates = tasks.flatMap((task) => [
    getDate(task.startDate || task.start_date),
    getDate(task.deadline || task.dueDate),
  ]).filter((value): value is number => value !== null);
  const projectStart = getDate(project.startDate || project.start_date);
  const projectEnd = getDate(project.endDate || project.end_date);
  const dates = [projectStart, projectEnd, ...taskDates].filter((value): value is number => value !== null);

  if (!dates.length) {
    return <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-xs text-slate-400">Chưa có ngày bắt đầu hoặc deadline để dựng Gantt. Hãy cập nhật ngày dự án hoặc deadline của task.</div>;
  }

  const axisStartDate = new Date(Math.min(...dates));
  axisStartDate.setUTCDate(1);
  axisStartDate.setUTCHours(0, 0, 0, 0);
  const axisEndDate = new Date(Math.max(...dates));
  axisEndDate.setUTCDate(1);
  axisEndDate.setUTCMonth(axisEndDate.getUTCMonth() + 1);
  axisEndDate.setUTCHours(0, 0, 0, 0);
  const axisStart = axisStartDate.getTime();
  const axisEnd = axisEndDate.getTime();
  const axisDuration = Math.max(1, axisEnd - axisStart);
  const months: Array<{ start: number; end: number; label: string }> = [];
  const cursor = new Date(axisStartDate);
  while (cursor.getTime() < axisEnd) {
    const start = cursor.getTime();
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    months.push({
      start,
      end: cursor.getTime(),
      label: new Intl.DateTimeFormat('vi-VN', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(start),
    });
  }

  const timelineWidth = Math.min(4800, Math.max(800, months.length * 112));
  const position = (date: number) => Math.max(0, Math.min(timelineWidth, ((date - axisStart) / axisDuration) * timelineWidth));
  const resolvedProjectStart = projectStart ?? (taskDates.length ? Math.min(...taskDates) : null);
  const resolvedProjectEnd = projectEnd ?? (taskDates.length ? Math.max(...taskDates) : null);

  const renderTrack = (start: number | null, end: number | null, label: string, color: string) => {
    const first = start ?? end;
    const last = end ?? start;
    const left = first === null ? null : position(Math.min(first, last ?? first));
    const right = last === null ? null : position(Math.max(first ?? last, last));
    const markerColor = start === null || end === null ? 'bg-amber-500' : color;
    return (
      <div className="relative h-11" style={{ width: timelineWidth }}>
        {months.map((month, index) => <span key={month.start} className={`absolute inset-y-0 border-l ${index % 2 === 0 ? 'border-slate-100 bg-slate-50/40' : 'border-slate-100'}`} style={{ left: position(month.start), width: ((month.end - month.start) / axisDuration) * timelineWidth }} />)}
        {left !== null && right !== null && start !== null && end !== null && (
          <span title={`${label}: ${formatDate(start)} – ${formatDate(end)}`} className={`absolute top-[15px] h-3.5 rounded px-2 text-[9px] font-semibold leading-[14px] text-white ${color}`} style={{ left, width: Math.max(14, right - left) }}>
            <span className="block truncate">{label}</span>
          </span>
        )}
        {start !== null && (
          <span
            title={`Ngày bắt đầu · ${label}: ${formatDate(start)}`}
            aria-label={`Ngày bắt đầu ${label} ${formatDate(start)}`}
            className={`absolute top-[16px] z-[1] h-3 w-3 rounded-full border-2 border-white ${end === null ? 'bg-amber-500' : 'bg-slate-700'}`}
            style={{ left: `calc(${position(start)}px - 6px)` }}
          />
        )}
        {end !== null && (
          <span
            title={`Milestone deadline · ${label}: ${formatDate(end)}`}
            aria-label={`Milestone deadline ${label} ${formatDate(end)}`}
            className={`absolute top-[16px] z-[1] h-3 w-3 rotate-45 rounded-[2px] border-2 border-white ${markerColor}`}
            style={{ left: `calc(${position(end)}px - 6px)` }}
          />
        )}
      </div>
    );
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div><h3 className="text-sm font-bold text-slate-800">Tiến độ Gantt</h3><p className="mt-1 text-[10px] text-slate-400">Timeline dùng chung task với Kanban; hình thoi đánh dấu deadline.</p></div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">{months.length} tháng</span>
      </div>
      <div className="border-b border-amber-100 bg-amber-50 px-5 py-2.5 text-[10px] leading-5 text-amber-800">Milestone hiện được thể hiện bằng ngày bắt đầu/kết thúc dự án và deadline của task. Backend chưa cung cấp trường hoặc API cho milestone độc lập.</div>
      <div className="overflow-x-auto">
        <div className="min-w-max" style={{ width: 280 + timelineWidth }}>
          <div className="grid border-b border-slate-200 bg-slate-50" style={{ gridTemplateColumns: `280px ${timelineWidth}px` }}>
            <div className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Công việc</div>
            <div className="flex">{months.map((month) => <div key={month.start} className="shrink-0 border-l border-slate-200 px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500" style={{ width: ((month.end - month.start) / axisDuration) * timelineWidth }}>{month.label}</div>)}</div>
          </div>
          <div className="grid border-b border-slate-100 bg-slate-50/70" style={{ gridTemplateColumns: `280px ${timelineWidth}px` }}>
            <div className="flex items-center px-5 py-2.5 text-[11px] font-bold text-slate-800">Thời gian dự án</div>
            {renderTrack(resolvedProjectStart, resolvedProjectEnd, project.name, 'bg-slate-700')}
          </div>
          {tasks.map((task) => {
            const start = getDate(task.startDate || task.start_date);
            const deadline = getDate(task.deadline || task.dueDate);
            return (
              <div key={task.id} className="grid border-b border-slate-50 hover:bg-blue-50/30" style={{ gridTemplateColumns: `280px ${timelineWidth}px` }}>
                <div className="min-w-0 px-5 py-2">
                  <div className="truncate text-[10px] font-semibold text-slate-700" title={task.title}>{task.title}</div>
                  <div className="mt-0.5 truncate text-[9px] text-slate-400">{task.assigneeName || task.assignee_name || 'Chưa phân công'} · {start ? formatDate(start) : 'Chưa có ngày bắt đầu'} → {deadline ? formatDate(deadline) : 'Chưa có deadline'}</div>
                </div>
                {renderTrack(start, deadline, task.title, taskStatusColor[task.status])}
              </div>
            );
          })}
          {!tasks.length && <div className="px-5 py-10 text-center text-xs text-slate-400">Dự án chưa có task để hiển thị.</div>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 px-5 py-3 text-[10px] text-slate-400"><span className="h-2.5 w-5 rounded bg-slate-700" />Khoảng thời gian<span className="ml-3 h-2.5 w-2.5 rounded-full bg-slate-700" />Ngày bắt đầu<span className="ml-3 h-2.5 w-2.5 rotate-45 bg-blue-500" />Deadline / milestone<span className="ml-3 h-2.5 w-5 rounded bg-amber-500" />Thiếu mốc ngày</div>
    </section>
  );
};
