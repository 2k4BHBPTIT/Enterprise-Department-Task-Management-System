import React, { useEffect, useMemo, useState } from 'react';
import { taskApi } from '../../services/api/task.api';
import { Task } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Calendar as CalendarIcon } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState('');
  useEffect(() => { taskApi.getTasks().then(setTasks).catch(() => setTasks([])); }, []);

  const days = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const count = new Date(year, monthIndex + 1, 0).getDate();
    const firstOffset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
    return [
      ...Array.from({ length: firstOffset }, () => null),
      ...Array.from({ length: count }, (_, index) => index + 1),
    ];
  }, [month]);
  const dateKey = (day: number) => `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const selectedTasks = tasks.filter((task) => (task.deadline || '').slice(0, 10) === selectedDate);
  const monthLabel = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(month);

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4">
      <div className="bg-white rounded-3xl border p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold flex gap-2 items-center"><CalendarIcon className="w-4 h-4 text-blue-600" />Lịch công việc - {monthLabel}</h2>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>Tháng trước</button>
            <button className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>Tháng sau</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 text-xs">
          {['T2','T3','T4','T5','T6','T7','CN'].map((name) => <div key={name} className="text-center text-slate-400 font-semibold py-2">{name}</div>)}
          {days.map((day, index) => {
            const key = day ? dateKey(day) : '';
            const count = day ? tasks.filter((task) => (task.deadline || '').slice(0, 10) === key).length : 0;
            return <button key={index} disabled={!day} onClick={() => setSelectedDate(key)} className={`h-20 border rounded-xl p-2 text-left ${day && selectedDate === key ? 'border-blue-500 bg-blue-50' : 'border-slate-100'} ${!day ? 'invisible' : ''}`}>
              {day && <><strong>{day}</strong>{count > 0 && <span className="block mt-3 text-[10px] text-blue-600">{count} công việc</span>}</>}
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
