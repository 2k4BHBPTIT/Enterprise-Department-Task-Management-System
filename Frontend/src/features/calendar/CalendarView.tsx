import React, { useEffect, useMemo, useState } from 'react';
import { taskApi } from '../../services/api/task.api';
import { Task } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Calendar as CalendarIcon } from 'lucide-react';
import { projectApi } from '../../services/api/project.api';

interface CalendarViewProps {
  assigneeId?: string;
  managerId?: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ assigneeId, managerId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState('');
  const [periodView, setPeriodView] = useState<'month' | 'week'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if ((!assigneeId && !managerId) || selectedDate) return;
    const today = new Date();
    setSelectedDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
  }, [assigneeId, managerId, selectedDate]);
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError('');
    const loadTasks = async () => {
      if (managerId) {
        const [projects, allTasks] = await Promise.all([projectApi.getProjects(), taskApi.getTasks()]);
        const managedProjectIds = new Set(projects
          .filter((project) => String(project.leader_id ?? project.pmId) === managerId)
          .map((project) => String(project.id)));
        return allTasks.filter((task) => managedProjectIds.has(String(task.projectId ?? task.project_id)));
      }
      return taskApi.getTasks(assigneeId ? { assigneeId } : undefined);
    };
    loadTasks()
      .then((data) => { if (active) setTasks(data); })
      .catch((loadError: unknown) => {
        if (!active) return;
        setTasks([]);
        setError(loadError instanceof Error ? loadError.message : 'Không thể tải lịch công việc.');
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [assigneeId, managerId]);

  const days = useMemo(() => {
    if (periodView === 'week') {
      const start = new Date(month);
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        return date;
      });
    }
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const count = new Date(year, monthIndex + 1, 0).getDate();
    const firstOffset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
    return [
      ...Array.from({ length: firstOffset }, () => null),
      ...Array.from({ length: count }, (_, index) => new Date(year, monthIndex, index + 1)),
    ];
  }, [month, periodView]);
  const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const selectedTasks = tasks.filter((task) => (task.deadline || '').slice(0, 10) === selectedDate);
  const monthLabel = periodView === 'week'
    ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(days.find(Boolean) || month)
      + ' – ' + new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(days.filter(Boolean).slice(-1)[0] || month)
    : new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(month);

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4">
      <div className="bg-white rounded-3xl border p-5">
        <div className="flex justify-between items-center mb-4">
          <div><h2 className="font-bold flex gap-2 items-center"><CalendarIcon className="w-4 h-4 text-blue-600" />{managerId ? 'Lịch làm việc' : assigneeId ? 'Lịch cá nhân' : 'Lịch công việc'} - {monthLabel}</h2><p className="mt-1 text-[11px] text-slate-400">{managerId ? 'Deadline các dự án do bạn chủ trì.' : assigneeId ? 'Deadline của các công việc được giao cho bạn.' : 'Deadline của các công việc trong dự án.'}</p></div>
          <div className="flex flex-wrap justify-end gap-2">
            <div className="flex rounded-xl bg-slate-100 p-0.5">
              <button type="button" aria-pressed={periodView === 'week'} className={`rounded-lg px-2.5 py-1.5 text-[11px] ${periodView === 'week' ? 'bg-white font-semibold text-blue-700 shadow-sm' : 'text-slate-500'}`} onClick={() => setPeriodView('week')}>Tuần</button>
              <button type="button" aria-pressed={periodView === 'month'} className={`rounded-lg px-2.5 py-1.5 text-[11px] ${periodView === 'month' ? 'bg-white font-semibold text-blue-700 shadow-sm' : 'text-slate-500'}`} onClick={() => setPeriodView('month')}>Tháng</button>
            </div>
            <button className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs" onClick={() => setMonth(periodView === 'week' ? new Date(month.getFullYear(), month.getMonth(), month.getDate() - 7) : new Date(month.getFullYear(), month.getMonth() - 1, 1))}>{periodView === 'week' ? 'Tuần trước' : 'Tháng trước'}</button>
            <button className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs" onClick={() => setMonth(periodView === 'week' ? new Date(month.getFullYear(), month.getMonth(), month.getDate() + 7) : new Date(month.getFullYear(), month.getMonth() + 1, 1))}>{periodView === 'week' ? 'Tuần sau' : 'Tháng sau'}</button>
          </div>
        </div>
        {error && <div role="alert" className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
        {managerId && <div className="mb-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[10px] text-amber-800">Lịch hiện hiển thị deadline task. Backend chưa cung cấp API lịch họp nhóm nên sự kiện họp chưa được tích hợp.</div>}
        {isLoading && <div role="status" className="mb-3 text-xs text-slate-400">Đang tải lịch công việc...</div>}
        <div className="grid grid-cols-7 gap-2 text-xs">
          {['T2','T3','T4','T5','T6','T7','CN'].map((name) => <div key={name} className="text-center text-slate-400 font-semibold py-2">{name}</div>)}
          {days.map((day, index) => {
            const key = day ? dateKey(day) : '';
            const count = day ? tasks.filter((task) => (task.deadline || '').slice(0, 10) === key).length : 0;
            return <button key={index} disabled={!day} onClick={() => day && setSelectedDate(key)} className={`h-20 border rounded-xl p-2 text-left ${day && selectedDate === key ? 'border-blue-500 bg-blue-50' : 'border-slate-100'} ${!day ? 'invisible' : ''}`}>
              {day && <><strong>{periodView === 'week' ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(day) : day.getDate()}</strong>{count > 0 && <span className="block mt-3 text-[10px] text-blue-600">{count} công việc</span>}</>}
            </button>;
          })}
        </div>
      </div>
      <div className="bg-white rounded-3xl border p-5 h-fit">
        <h3 className="font-bold text-sm">{selectedDate || 'Chọn một ngày'}</h3>
        <div className="mt-4 space-y-3">{selectedTasks.map((task) => (
          <div key={task.id} className="border rounded-xl p-3 text-xs"><div className="font-semibold">{task.title}</div><div className="text-slate-500 mt-1">{task.projectName}</div><StatusBadge status={task.status} /></div>
        ))}{selectedDate && !selectedTasks.length && <p className="text-xs text-slate-400">Không có công việc hạn trong ngày này.</p>}</div>
      </div>
    </div>
  );
};
