import React, { useEffect, useState } from 'react';
import { ArrowLeft, Edit2, Eye, Plus, Trash2 } from 'lucide-react';
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

      <TaskFormModal isOpen={taskModalOpen} onClose={() => setTaskModalOpen(false)} onSubmitSuccess={saveTask} initialTask={editingTask} defaultProjectId={String(project.id)} />
      {detailTask && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setDetailTask(null)}><div onClick={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl"><div className="flex items-center justify-between"><h3 className="text-base font-bold text-slate-800">{detailTask.title}</h3><button onClick={() => setDetailTask(null)} className="text-xl text-slate-400">×</button></div><p className="mt-3 text-xs leading-5 text-slate-500">{detailTask.description || 'Không có mô tả.'}</p><div className="mt-5 grid grid-cols-2 gap-3 text-xs"><div className="rounded-2xl bg-slate-50 p-3"><span className="text-slate-400">Người thực hiện</span><b className="mt-1 block">{detailTask.assigneeName || 'Chưa phân công'}</b></div><div className="rounded-2xl bg-slate-50 p-3"><span className="text-slate-400">Hạn hoàn thành</span><b className="mt-1 block">{String(detailTask.deadline || detailTask.dueDate).slice(0, 10)}</b></div><div className="rounded-2xl bg-slate-50 p-3"><span className="text-slate-400">Trạng thái</span><div className="mt-1"><StatusBadge status={detailTask.status} /></div></div><div className="rounded-2xl bg-slate-50 p-3"><span className="text-slate-400">Ưu tiên</span><b className="mt-1 block">{detailTask.priority}</b></div></div></div></div>}
    </div>
  );
};
