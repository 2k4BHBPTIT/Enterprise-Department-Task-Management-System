import React, { useEffect, useMemo, useState } from 'react';
import { CalendarRange, Search } from 'lucide-react';
import { Project, Task } from '../../types';
import { projectApi } from '../../services/api/project.api';
import { taskApi } from '../../services/api/task.api';

type TimelineScale = 'day' | 'month' | 'year';
type DateRange = { start: number; end: number };
type ProjectRow = { project: Project; tasks: Task[]; start: number | null; end: number | null };

const getDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const defaultRangeValues = (scale: TimelineScale) => {
  const now = new Date();
  if (scale === 'day') {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: dateKey(first), end: dateKey(last) };
  }
  if (scale === 'month') {
    const first = new Date(now.getFullYear(), 0, 1);
    const last = new Date(now.getFullYear(), 11, 1);
    return { start: dateKey(first).slice(0, 7), end: dateKey(last).slice(0, 7) };
  }
  const year = now.getFullYear();
  return { start: String(year - 2), end: String(year + 2) };
};

const parseRange = (scale: TimelineScale, startValue: string, endValue: string): DateRange | null => {
  if (!startValue || !endValue || startValue > endValue) return null;
  if (scale === 'day') {
    const start = getDate(startValue);
    const end = getDate(endValue);
    return start === null || end === null ? null : { start, end: end + 24 * 60 * 60 * 1000 };
  }
  if (scale === 'month') {
    const [startYear, startMonth] = startValue.split('-').map(Number);
    const [endYear, endMonth] = endValue.split('-').map(Number);
    if (!startYear || !startMonth || !endYear || !endMonth) return null;
    return {
      start: Date.UTC(startYear, startMonth - 1, 1),
      end: Date.UTC(endYear, endMonth, 1),
    };
  }
  const startYear = Number(startValue);
  const endYear = Number(endValue);
  if (!Number.isInteger(startYear) || !Number.isInteger(endYear)) return null;
  return { start: Date.UTC(startYear, 0, 1), end: Date.UTC(endYear + 1, 0, 1) };
};

const taskStatusColor: Record<Task['status'], string> = {
  TODO: 'bg-slate-400',
  IN_PROGRESS: 'bg-blue-500',
  WAITING: 'bg-sky-500',
  BLOCKED: 'bg-amber-500',
  COMPLETED: 'bg-emerald-500',
  OVERDUE: 'bg-rose-500',
  CANCELLED: 'bg-slate-300',
};

const projectStatusColor: Record<Project['status'], string> = {
  PLANNING: 'bg-slate-700',
  IN_PROGRESS: 'bg-blue-700',
  COMPLETED: 'bg-emerald-700',
  ON_HOLD: 'bg-amber-600',
  OVERDUE: 'bg-rose-700',
};

const intersectsRange = (start: number | null, end: number | null, range: DateRange) => {
  const first = start ?? end;
  const last = end ?? start;
  return first !== null && last !== null && Math.min(first, last) < range.end && Math.max(first, last) >= range.start;
};

export const ProjectTimelineView: React.FC<{ managerId?: string }> = ({ managerId }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [scale, setScale] = useState<TimelineScale>('month');
  const [rangeValues, setRangeValues] = useState(() => defaultRangeValues('month'));
  const [search, setSearch] = useState('');
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(() => new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError('');
    Promise.all([projectApi.getProjects(), taskApi.getTasks()])
      .then(([allProjects, allTasks]) => {
        if (!active) return;
        const visibleProjects = managerId
          ? allProjects.filter((project) => String(project.leader_id ?? project.pmId) === managerId)
          : allProjects;
        const projectIds = new Set(visibleProjects.map((project) => String(project.id)));
        setProjects(visibleProjects);
        setTasks(allTasks.filter((task) => projectIds.has(String(task.projectId ?? task.project_id))));
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Không thể tải dữ liệu timeline.');
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [managerId]);

  const range = useMemo(() => parseRange(scale, rangeValues.start, rangeValues.end), [scale, rangeValues]);
  const rangeError = useMemo(() => {
    if (!range) return 'Chọn khoảng thời gian hợp lệ để hiển thị timeline.';
    const count = scale === 'day'
      ? (range.end - range.start) / (24 * 60 * 60 * 1000)
      : scale === 'month'
        ? (new Date(range.end).getUTCFullYear() - new Date(range.start).getUTCFullYear()) * 12
          + new Date(range.end).getUTCMonth() - new Date(range.start).getUTCMonth()
        : new Date(range.end).getUTCFullYear() - new Date(range.start).getUTCFullYear();
    const limit = scale === 'day' ? 93 : scale === 'month' ? 60 : 20;
    return count > limit ? `Khoảng lọc quá dài cho chế độ ${scale === 'day' ? 'ngày' : scale === 'month' ? 'tháng' : 'năm'}; giới hạn ${limit} đơn vị mỗi lần xem.` : '';
  }, [range, scale]);

  const rows = useMemo(() => {
    if (!range || rangeError) return [];
    const term = search.trim().toLowerCase();
    return projects.flatMap((project): ProjectRow[] => {
      const projectTasks = tasks.filter((task) => String(task.projectId ?? task.project_id) === String(project.id));
      const taskDates = projectTasks.flatMap((task) => [
        getDate(task.startDate || task.start_date),
        getDate(task.deadline || task.dueDate),
      ]).filter((value): value is number => value !== null);
      const projectStart = getDate(project.startDate || project.start_date) ?? (taskDates.length ? Math.min(...taskDates) : null);
      const projectEnd = getDate(project.endDate || project.end_date) ?? (taskDates.length ? Math.max(...taskDates) : null);
      const projectMatchesSearch = !term || `${project.name} ${project.description || ''}`.toLowerCase().includes(term);
      const visibleTasks = projectTasks.filter((task) => {
        const start = getDate(task.startDate || task.start_date);
        const end = getDate(task.deadline || task.dueDate);
        return intersectsRange(start, end, range)
          && (projectMatchesSearch || `${task.title} ${task.assigneeName || task.assignee_name || ''}`.toLowerCase().includes(term));
      });
      if (!intersectsRange(projectStart, projectEnd, range) && !visibleTasks.length) return [];
      if (term && !projectMatchesSearch && !visibleTasks.length) return [];
      return [{ project, tasks: visibleTasks, start: projectStart, end: projectEnd }];
    });
  }, [projects, tasks, range, rangeError, search]);

  const axis = useMemo(() => {
    if (!range || rangeError) return null;
    let start = range.start;
    let end = range.end;
    if (scale === 'month') {
      const first = new Date(start);
      first.setUTCDate(1);
      start = first.getTime();
      const last = new Date(end);
      if (last.getUTCDate() !== 1) last.setUTCDate(1);
      end = last.getTime();
    } else if (scale === 'year') {
      const first = new Date(start);
      first.setUTCMonth(0, 1);
      start = first.getTime();
      const last = new Date(end);
      last.setUTCMonth(0, 1);
      end = last.getTime();
    }

    const ticks: Array<{ start: number; end: number; label: string }> = [];
    const cursor = new Date(start);
    while (cursor.getTime() < end) {
      const tickStart = cursor.getTime();
      if (scale === 'day') cursor.setUTCDate(cursor.getUTCDate() + 1);
      else if (scale === 'month') cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      else cursor.setUTCFullYear(cursor.getUTCFullYear() + 1);
      const label = scale === 'day'
        ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }).format(tickStart)
        : scale === 'month'
          ? new Intl.DateTimeFormat('vi-VN', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(tickStart)
          : new Intl.DateTimeFormat('vi-VN', { year: 'numeric', timeZone: 'UTC' }).format(tickStart);
      ticks.push({ start: tickStart, end: cursor.getTime(), label });
    }
    return { start, end, ticks };
  }, [range, rangeError, scale]);

  const timelineWidth = axis
    ? Math.max(900, axis.ticks.length * (scale === 'day' ? 44 : scale === 'month' ? 112 : 160))
    : 900;
  const position = (date: number) => axis
    ? Math.max(0, Math.min(timelineWidth, ((date - axis.start) / (axis.end - axis.start)) * timelineWidth))
    : 0;
  const dateLabel = (time: number | null) => time === null
    ? 'Chưa có ngày'
    : new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(time);

  const renderTrack = (start: number | null, end: number | null, label: string, color: string) => {
    const first = start ?? end;
    const last = end ?? start;
    const left = first === null ? null : position(Math.min(first, last ?? first));
    const right = last === null ? null : position(Math.max(first ?? last, last));
    const incompleteColor = start === null || end === null;
    return (
      <div className="relative h-11" style={{ width: timelineWidth }}>
        {axis?.ticks.map((tick, index) => <span key={tick.start} className={`absolute inset-y-0 border-l ${index % 2 === 0 ? 'border-slate-100 bg-slate-50/40' : 'border-slate-100'}`} style={{ left: position(tick.start), width: ((tick.end - tick.start) / (axis.end - axis.start)) * timelineWidth }} />)}
        {left !== null && right !== null && start !== null && end !== null && <span title={`${label}: ${dateLabel(start)} – ${dateLabel(end)}`} className={`absolute top-[15px] h-3.5 overflow-hidden rounded px-2 text-[9px] font-semibold leading-[14px] text-white ${color}`} style={{ left, width: Math.max(14, right - left) }}><span className="block truncate">{label}</span></span>}
        {start !== null && <span title={`${label} · Bắt đầu ${dateLabel(start)}`} className={`absolute top-[16px] z-[1] h-3 w-3 rounded-full border-2 border-white ${incompleteColor ? 'bg-amber-500' : 'bg-slate-700'}`} style={{ left: `calc(${position(start)}px - 6px)` }} />}
        {end !== null && <span title={`${label} · Deadline / milestone ${dateLabel(end)}`} className={`absolute top-[16px] z-[1] h-3 w-3 rotate-45 rounded-[2px] border-2 border-white ${incompleteColor ? 'bg-amber-500' : color}`} style={{ left: `calc(${position(end)}px - 6px)` }} />}
      </div>
    );
  };

  const inputType = scale === 'day' ? 'date' : scale === 'month' ? 'month' : 'number';
  const inputStep = scale === 'year' ? 1 : undefined;
  const inputMin = scale === 'year' ? 1970 : undefined;
  const inputMax = scale === 'year' ? 2200 : undefined;

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><CalendarRange className="h-5 w-5" /></div>
            <div><h2 className="text-sm font-bold text-slate-800">Timeline dự án</h2><p className="mt-1 text-xs text-slate-400">Theo dõi tiến độ dự án và task trên cùng một trục thời gian.</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl bg-slate-100 p-0.5" role="group" aria-label="Độ chi tiết timeline">
              {(['day', 'month', 'year'] as const).map((value) => <button key={value} type="button" aria-pressed={scale === value} onClick={() => { setScale(value); setRangeValues(defaultRangeValues(value)); }} className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold ${scale === value ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>{value === 'day' ? 'Ngày' : value === 'month' ? 'Tháng' : 'Năm'}</button>)}
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
          <label className="text-[10px] font-semibold text-slate-500">{scale === 'day' ? 'Từ ngày' : scale === 'month' ? 'Từ tháng' : 'Từ năm'}<input type={inputType} step={inputStep} min={inputMin} max={inputMax} value={rangeValues.start} onChange={(event) => setRangeValues((current) => ({ ...current, start: event.target.value }))} className="mt-1 block rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
          <label className="text-[10px] font-semibold text-slate-500">{scale === 'day' ? 'Đến ngày' : scale === 'month' ? 'Đến tháng' : 'Đến năm'}<input type={inputType} step={inputStep} min={inputMin} max={inputMax} value={rangeValues.end} onChange={(event) => setRangeValues((current) => ({ ...current, end: event.target.value }))} className="mt-1 block rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
          <label className="relative block min-w-56 flex-1 sm:max-w-sm"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm dự án, công việc, nhân sự..." className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
          <div className="ml-auto self-center text-[10px] text-slate-400">{rows.length} dự án · {rows.reduce((total, row) => total + row.tasks.length, 0)} task</div>
        </div>
      </section>

      {error && <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>}
      {rangeError && <div role="alert" className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800">{rangeError}</div>}
      {isLoading ? <div role="status" className="rounded-3xl border border-slate-100 bg-white p-12 text-center text-xs text-slate-400">Đang tải timeline...</div>
        : !rangeError && !rows.length ? <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center text-xs text-slate-400">Không có dự án hoặc task trong khoảng thời gian đã chọn.</div>
          : !rangeError && axis && (
            <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div><h3 className="text-sm font-bold text-slate-800">Tiến độ và lịch công việc</h3><p className="mt-1 text-[10px] text-slate-400">Mở/thu gọn dự án để xem task; hình thoi biểu thị deadline hoặc milestone.</p></div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">{scale === 'day' ? `${axis.ticks.length} ngày` : scale === 'month' ? `${axis.ticks.length} tháng` : `${axis.ticks.length} năm`}</span>
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-max" style={{ width: 300 + timelineWidth }}>
                  <div className="grid border-b border-slate-200 bg-slate-50" style={{ gridTemplateColumns: `300px ${timelineWidth}px` }}>
                    <div className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Dự án / công việc</div>
                    <div className="flex">{axis.ticks.map((tick) => <div key={tick.start} className="shrink-0 overflow-hidden border-l border-slate-200 px-2 py-3 text-center text-[9px] font-semibold text-slate-500" style={{ width: ((tick.end - tick.start) / (axis.end - axis.start)) * timelineWidth }}>{tick.label}</div>)}</div>
                  </div>
                  {rows.map(({ project, tasks: projectTasks, start, end }) => {
                    const collapsed = collapsedProjects.has(String(project.id));
                    const projectColor = projectStatusColor[project.status];
                    return <React.Fragment key={project.id}>
                      <div className="grid border-b border-slate-100 bg-slate-50/70" style={{ gridTemplateColumns: `300px ${timelineWidth}px` }}>
                        <button type="button" aria-expanded={!collapsed} onClick={() => setCollapsedProjects((current) => {
                          const next = new Set(current);
                          if (next.has(String(project.id))) next.delete(String(project.id));
                          else next.add(String(project.id));
                          return next;
                        })} className="flex min-w-0 items-center gap-2 px-4 py-2.5 text-left hover:bg-blue-50" title={project.name}>
                          <span className={`h-2 w-2 shrink-0 rounded-sm ${projectColor}`} />
                          <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-slate-800">{project.name}</span>
                          <span className="shrink-0 rounded-full bg-white px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">{projectTasks.length}</span>
                        </button>
                        {renderTrack(start, end, project.name, projectColor)}
                      </div>
                      {!collapsed && projectTasks.map((task) => (
                        <div key={task.id} className="grid border-b border-slate-50 hover:bg-blue-50/30" style={{ gridTemplateColumns: `300px ${timelineWidth}px` }}>
                          <div className="flex min-w-0 items-center gap-2 py-2 pl-10 pr-4">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                            <div className="min-w-0 flex-1"><div className="truncate text-[10px] font-medium text-slate-700" title={task.title}>{task.title}</div><div className="mt-0.5 truncate text-[9px] text-slate-400">{task.assigneeName || task.assignee_name || 'Chưa phân công'} · {dateLabel(getDate(task.startDate || task.start_date))} → {dateLabel(getDate(task.deadline || task.dueDate))}</div></div>
                          </div>
                          {renderTrack(getDate(task.startDate || task.start_date), getDate(task.deadline || task.dueDate), task.title, taskStatusColor[task.status])}
                        </div>
                      ))}
                    </React.Fragment>;
                  })}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 px-5 py-3 text-[10px] text-slate-400"><span className="h-2.5 w-5 rounded bg-blue-700" />Dự án / trạng thái<span className="ml-3 h-2.5 w-2.5 rounded-full bg-slate-700" />Ngày bắt đầu<span className="ml-3 h-2.5 w-2.5 rotate-45 bg-blue-500" />Deadline / milestone<span className="ml-3 h-2.5 w-5 rounded bg-amber-500" />Thiếu mốc ngày</div>
            </section>
          )}
    </div>
  );
};
