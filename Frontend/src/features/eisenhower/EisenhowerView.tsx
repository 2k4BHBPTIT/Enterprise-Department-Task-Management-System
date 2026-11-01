import React, { useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, Edit2, Grid2X2, Inbox, ListFilter, Trash2, Users } from 'lucide-react';
import { taskApi } from '../../services/api/task.api';
import { Task } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { TaskFormModal } from '../tasks/TaskFormModal';
import { TaskFormData } from '../../schema/task.schema';
import { useAuthStore } from '../../store/auth.store';

const quadrants = [
  { id: 'Q1', name: 'Làm ngay', subtitle: 'Quan trọng và khẩn cấp', icon: AlertTriangle, className: 'border-red-200 bg-red-50/50 text-red-700' },
  { id: 'Q2', name: 'Lên kế hoạch', subtitle: 'Quan trọng, không khẩn cấp', icon: CalendarDays, className: 'border-emerald-200 bg-emerald-50/50 text-emerald-700' },
  { id: 'Q3', name: 'Ủy quyền', subtitle: 'Không quan trọng, khẩn cấp', icon: Users, className: 'border-amber-200 bg-amber-50/50 text-amber-700' },
  { id: 'Q4', name: 'Giảm bớt', subtitle: 'Không quan trọng, không khẩn cấp', icon: Inbox, className: 'border-blue-200 bg-blue-50/50 text-blue-700' },
] as const;

export const EisenhowerView: React.FC = () => {
  const { canEditTask, canDeleteTask } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | Task['quadrant']>('ALL');
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadTasks = () => taskApi.getTasks().then(setTasks).catch(() => setTasks([]));

  useEffect(() => { loadTasks(); }, []);

  const saveTask = async (data: TaskFormData, isEditing: boolean) => {
    if (isEditing && editingTask) await taskApi.updateTask(editingTask.id, data);
    await loadTasks();
  };

  const deleteTask = async (task: Task) => {
    if (!window.confirm(`Xóa công việc "${task.title}"?`)) return;
    await taskApi.deleteTask(task.id);
    await loadTasks();
  };

  const filteredTasks = activeFilter === 'ALL' ? tasks : tasks.filter((task) => task.quadrant === activeFilter);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Ma trận Eisenhower</h2>
            <p className="text-xs text-slate-400 mt-1">Ưu tiên công việc dựa trên mức độ quan trọng và khẩn cấp</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setViewMode('matrix')} className={`px-3 py-2 rounded-xl text-xs font-semibold ${viewMode === 'matrix' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <Grid2X2 className="inline w-4 h-4 mr-1" />Ma trận
            </button>
            <button onClick={() => setViewMode('list')} className={`px-3 py-2 rounded-xl text-xs font-semibold ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <ListFilter className="inline w-4 h-4 mr-1" />Danh sách
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={() => setActiveFilter('ALL')} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${activeFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>Tất cả ({tasks.length})</button>
          {quadrants.map((quadrant) => (
            <button key={quadrant.id} onClick={() => setActiveFilter(quadrant.id)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${activeFilter === quadrant.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {quadrant.id} ({tasks.filter((task) => task.quadrant === quadrant.id).length})
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'matrix' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {quadrants.map((quadrant) => {
            const Icon = quadrant.icon;
            const quadrantTasks = activeFilter === 'ALL' || activeFilter === quadrant.id
              ? tasks.filter((task) => task.quadrant === quadrant.id)
              : [];
            return (
              <section key={quadrant.id} className={`rounded-3xl border p-5 min-h-64 ${quadrant.className}`}>
                <div className="flex items-start justify-between">
                  <div><div className="flex items-center gap-2"><Icon className="w-4 h-4" /><h3 className="text-sm font-bold">{quadrant.id} - {quadrant.name}</h3></div><p className="text-[11px] opacity-70 mt-1">{quadrant.subtitle}</p></div>
                  <span className="bg-white/80 px-2.5 py-1 rounded-full text-xs font-bold">{quadrantTasks.length}</span>
                </div>
                <div className="mt-4 space-y-2 max-h-72 overflow-y-auto">
                  {quadrantTasks.map((task) => (
                    <div key={task.id} className="bg-white rounded-2xl border border-white/80 p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0"><div className="text-xs font-bold text-slate-800 truncate">{task.title}</div><div className="text-[11px] text-slate-400 mt-0.5">{task.projectName || 'Không thuộc dự án'} • {task.assigneeName || 'Chưa phân công'}</div></div>
                        <div className="flex shrink-0 gap-1">
                          {canEditTask() && <button title="Sửa công việc" onClick={() => { setEditingTask(task); setIsModalOpen(true); }} className="p-1 hover:bg-blue-50 rounded-lg"><Edit2 className="w-3.5 h-3.5 text-blue-600" /></button>}
                          {canDeleteTask() && <button title="Xóa công việc" onClick={() => deleteTask(task)} className="p-1 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2"><StatusBadge status={task.status} /><PriorityBadge priority={task.priority} /><span className="text-[10px] text-slate-400 ml-auto">{task.deadline?.slice(0, 10)}</span></div>
                    </div>
                  ))}
                  {!quadrantTasks.length && <div className="text-xs text-slate-400 text-center py-10">Không có công việc trong ô này</div>}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="bg-slate-50 text-slate-400"><th className="text-left p-3">Công việc</th><th>Ma trận</th><th>Trạng thái</th><th>Ưu tiên</th><th>Hạn</th><th className="text-center">Thao tác</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50/60">
                  <td className="p-3"><div className="font-bold text-slate-800">{task.title}</div><div className="text-[11px] text-slate-400">{task.projectName}</div></td>
                  <td className="p-3 text-center font-bold">{task.quadrant}</td>
                  <td className="p-3"><StatusBadge status={task.status} /></td><td className="p-3"><PriorityBadge priority={task.priority} /></td><td className="p-3">{task.deadline?.slice(0, 10)}</td>
                  <td className="p-3 text-center">{canEditTask() && <button onClick={() => { setEditingTask(task); setIsModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-blue-50"><Edit2 className="w-3.5 h-3.5 text-blue-600" /></button>}{canDeleteTask() && <button onClick={() => deleteTask(task)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TaskFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmitSuccess={saveTask} initialTask={editingTask} />
    </div>
  );
};
