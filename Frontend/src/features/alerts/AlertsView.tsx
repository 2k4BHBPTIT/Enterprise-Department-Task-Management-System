import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Calendar, CheckCircle2, Clock3, Edit2 } from 'lucide-react';
import { taskApi } from '../../services/api/task.api';
import { Task } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { TaskFormModal } from '../tasks/TaskFormModal';
import { TaskFormData } from '../../schema/task.schema';
import { useAuthStore } from '../../store/auth.store';

const dayDifference = (deadline: string) => {
  const due = new Date(`${deadline.slice(0, 10)}T23:59:59`);
  return Math.ceil((due.getTime() - new Date().getTime()) / 86400000);
};

export const AlertsView: React.FC = () => {
  const { canEditTask } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'overdue' | 'today' | 'soon'>('all');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const loadTasks = () => taskApi.getTasks().then(setTasks).catch(() => setTasks([]));
  useEffect(() => { loadTasks(); }, []);

  const overdue = tasks.filter((task) => task.status === 'OVERDUE' || dayDifference(task.deadline) < 0 && task.status !== 'COMPLETED');
  const today = tasks.filter((task) => dayDifference(task.deadline) === 0 && task.status !== 'COMPLETED');
  const soon = tasks.filter((task) => {
    const days = dayDifference(task.deadline);
    return days > 0 && days <= 7 && task.status !== 'COMPLETED';
  });

  const visibleTasks = useMemo(() => {
    if (filter === 'overdue') return overdue;
    if (filter === 'today') return today;
    if (filter === 'soon') return soon;
    return [...overdue, ...today, ...soon].filter((task, index, items) => items.findIndex((item) => item.id === task.id) === index);
  }, [filter, tasks]);

  const completeTask = async (task: Task) => {
    await taskApi.updateTaskStatus(task.id, 'COMPLETED');
    await loadTasks();
  };

  const saveTask = async (data: TaskFormData) => {
    if (editingTask) await taskApi.updateTask(editingTask.id, data);
    await loadTasks();
  };

  const alertStyle = (task: Task) => {
    const days = dayDifference(task.deadline);
    if (days < 0) return 'border-red-200 bg-red-50/60';
    if (days === 0) return 'border-amber-200 bg-amber-50/60';
    return 'border-blue-200 bg-blue-50/60';
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          ['Quá hạn', overdue.length, 'text-red-600 bg-red-50 border-red-100', AlertTriangle, () => setFilter('overdue')],
          ['Đến hạn hôm nay', today.length, 'text-amber-600 bg-amber-50 border-amber-100', Clock3, () => setFilter('today')],
          ['Trong 7 ngày tới', soon.length, 'text-blue-600 bg-blue-50 border-blue-100', Calendar, () => setFilter('soon')],
        ].map(([label, value, style, Icon, action]) => (
          <button key={String(label)} onClick={action as () => void} className={`border rounded-3xl p-4 text-left ${style}`}>
            <div className="flex items-center justify-between"><span className="text-xs font-semibold">{String(label)}</span>{React.createElement(Icon as React.ElementType, { className: 'w-5 h-5' })}</div>
            <div className="text-3xl font-bold mt-2">{value as number}</div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-sm font-bold text-slate-800">Trung tâm cảnh báo công việc</h2><p className="text-xs text-slate-400 mt-1">Danh sách cảnh báo được tính trực tiếp từ deadline và trạng thái backend</p></div>
          <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>Tất cả ({overdue.length + today.length + soon.length})</button>
        </div>
        <div className="p-4 space-y-3">
          {visibleTasks.map((task) => {
            const days = dayDifference(task.deadline);
            return (
              <div key={task.id} className={`rounded-2xl border p-4 flex flex-col lg:flex-row lg:items-center gap-3 ${alertStyle(task)}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap"><span className="font-bold text-sm text-slate-800">{task.title}</span><StatusBadge status={task.status} /><PriorityBadge priority={task.priority} /></div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description || 'Không có mô tả'}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 mt-2"><span>Dự án: <b>{task.projectName || '-'}</b></span><span>Phụ trách: <b>{task.assigneeName || 'Chưa phân công'}</b></span><span>Hạn: <b>{task.deadline?.slice(0, 10)}</b></span></div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-xs font-bold ${days < 0 ? 'text-red-600' : days === 0 ? 'text-amber-600' : 'text-blue-600'}`}>{days < 0 ? `Trễ ${Math.abs(days)} ngày` : days === 0 ? 'Hạn hôm nay' : `${days} ngày nữa`}</div>
                  <div className="flex justify-end gap-1 mt-2">
                    {canEditTask() && <button title="Sửa công việc" onClick={() => setEditingTask(task)} className="p-2 rounded-xl bg-white border border-slate-200 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>}
                    <button title="Đánh dấu hoàn thành" onClick={() => completeTask(task)} className="p-2 rounded-xl bg-white border border-slate-200 hover:text-emerald-600"><CheckCircle2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
          {!visibleTasks.length && <div className="text-center text-sm text-slate-400 py-16">Không có cảnh báo trong nhóm này.</div>}
        </div>
      </div>
      <TaskFormModal isOpen={!!editingTask} onClose={() => setEditingTask(null)} onSubmitSuccess={saveTask} initialTask={editingTask} />
    </div>
  );
};
