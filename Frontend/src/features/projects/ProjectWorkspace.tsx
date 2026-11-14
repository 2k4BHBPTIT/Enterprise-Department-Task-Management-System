import React, { useEffect, useState } from 'react';
import { ArrowLeft, Edit2, Eye, LayoutDashboard, Plus, Trash2, Users } from 'lucide-react';
import { Project, Task, TaskStatus } from '../../types';
import { taskApi } from '../../services/api/task.api';
import { ProjectMember, projectMemberApi } from '../../services/api/project-member.api';
import { useAuthStore } from '../../store/auth.store';
import { TaskFormModal } from '../tasks/TaskFormModal';
import { TaskFormData } from '../../schema/task.schema';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { ProjectGantt } from './ProjectGantt';

interface ProjectWorkspaceProps {
  project: Project;
  onBack: () => void;
}

type ProjectTab = 'overview' | 'kanban' | 'gantt';

const taskColumns: Array<{ status: TaskStatus; label: string }> = [
  { status: 'TODO', label: 'Chưa bắt đầu' },
  { status: 'IN_PROGRESS', label: 'Đang thực hiện' },
  { status: 'WAITING', label: 'Đang chờ' },
  { status: 'BLOCKED', label: 'Bị chặn' },
  { status: 'OVERDUE', label: 'Quá hạn' },
  { status: 'COMPLETED', label: 'Hoàn thành' },
  { status: 'CANCELLED', label: 'Đã hủy' },
];

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ project, onBack }) => {
  const { currentUser, canCreateTask, canEditTask, canDeleteTask } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ProjectTab>('overview');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(true);
  const [taskError, setTaskError] = useState('');
  const [memberError, setMemberError] = useState('');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);

  const loadTasks = async () => {
    setLoading(true);
    setTaskError('');
    try {
      setTasks(await taskApi.getTasks({ projectId: String(project.id) }));
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : 'Không thể tải đầu việc dự án.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    setMembersLoading(true);
    setMemberError('');
    try {
      setMembers(await projectMemberApi.getMembers(project.id));
    } catch (error) {
      setMemberError(error instanceof Error ? error.message : 'Không thể tải thành viên dự án.');
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks().catch(() => undefined);
    void loadMembers();
  }, [project.id]);

  const saveTask = async (data: TaskFormData, isEditing: boolean) => {
    const payload = { ...data, projectId: String(project.id) };
    if (isEditing && editingTask) await taskApi.updateTask(editingTask.id, payload);
    else await taskApi.createTask(payload);
    await loadTasks();
    setTaskModalOpen(false);
  };

  const removeTask = async (task: Task) => {
    if (!window.confirm(`Xóa đầu việc "${task.title}"?`)) return;
    setTaskError('');
    try {
      await taskApi.deleteTask(task.id);
      setTasks((currentTasks) => currentTasks.filter((currentTask) => String(currentTask.id) !== String(task.id)));
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : 'Không thể xóa đầu việc.');
    }
  };

  const canUpdateTaskStatus = (task: Task) =>
    canEditTask() || (currentUser.role === 'EMPLOYEE'
      && String(task.assigneeId ?? task.assignee_id) === String(currentUser.id));

  const updateTaskStatus = async (task: Task, status: TaskStatus) => {
    if (status === task.status || !canUpdateTaskStatus(task)) return;
    setSavingTaskId(String(task.id));
    setTaskError('');
    try {
      const updatedTask = await taskApi.updateTaskStatus(task.id, status);
      setTasks((currentTasks) => currentTasks.map((currentTask) =>
        String(currentTask.id) === String(task.id) ? { ...currentTask, ...updatedTask } : currentTask));
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái đầu việc.');
    } finally {
      setSavingTaskId(null);
      setDraggingTaskId(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
    event.preventDefault();
    const task = tasks.find((item) => String(item.id) === event.dataTransfer.getData('text/plain'));
    if (task) void updateTaskStatus(task, status);
  };

  const completed = tasks.filter((task) => task.status === 'COMPLETED').length;
  const progress = tasks.length
    ? Math.round(completed / tasks.length * 100)
    : project.progressPercent ?? project.progress_percent;

  const tabs: Array<{ id: ProjectTab; label: string; icon: typeof LayoutDashboard }> = [
    { id: 'overview', label: 'Tổng quan & Thành viên', icon: LayoutDashboard },
    { id: 'kanban', label: 'Bảng công việc', icon: Users },
    { id: 'gantt', label: 'Tiến độ Gantt', icon: LayoutDashboard },
  ];

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <button type="button" onClick={onBack} className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-blue-600"><ArrowLeft className="h-3.5 w-3.5" />Danh sách dự án</button>
            <h2 className="truncate text-xl font-bold text-slate-800">{project.name}</h2>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">{project.description || 'Chưa có mô tả dự án.'}</p>
          </div>
          {activeTab === 'kanban' && canCreateTask() && <button type="button" onClick={() => { setEditingTask(null); setTaskModalOpen(true); }} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"><Plus className="h-3.5 w-3.5" />Thêm đầu việc</button>}
        </div>
        <div role="tablist" aria-label="Thông tin chi tiết dự án" className="mt-5 flex gap-1 overflow-x-auto border-b border-slate-100">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" role="tab" aria-selected={activeTab === id} onClick={() => setActiveTab(id)} className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold transition ${activeTab === id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>
      </section>

      {taskError && <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">{taskError}</div>}

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ['Tiến độ', `${progress}%`, 'bg-blue-50 text-blue-700'],
                ['Đầu việc', tasks.length, 'bg-slate-50 text-slate-700'],
                ['Đang thực hiện', tasks.filter((task) => task.status === 'IN_PROGRESS').length, 'bg-amber-50 text-amber-700'],
                ['Hoàn thành', completed, 'bg-emerald-50 text-emerald-700'],
              ].map(([label, value, style]) => <div key={String(label)} className={`rounded-2xl p-3 ${style}`}><div className="text-xl font-bold">{value}</div><div className="mt-1 text-[11px] opacity-70">{label}</div></div>)}
            </div>
            <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-[11px] text-slate-500 sm:grid-cols-3">
              <div><span className="text-slate-400">Quản lý dự án</span><strong className="mt-1 block text-slate-700">{project.leader_name || project.pmName || 'Chưa cập nhật'}</strong></div>
              <div><span className="text-slate-400">Ngày bắt đầu</span><strong className="mt-1 block text-slate-700">{String(project.startDate || project.start_date || '').slice(0, 10) || 'Chưa cập nhật'}</strong></div>
              <div><span className="text-slate-400">Ngày kết thúc</span><strong className="mt-1 block text-slate-700">{String(project.endDate || project.end_date || '').slice(0, 10) || 'Chưa cập nhật'}</strong></div>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h3 className="text-sm font-bold text-slate-800">Thành viên dự án</h3><p className="mt-1 text-[10px] text-slate-400">Vai trò hiển thị là vai trò của thành viên trong dự án.</p></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">{members.length} thành viên</span></div>
            {membersLoading ? <div role="status" className="p-8 text-center text-xs text-slate-400">Đang tải thành viên...</div>
              : memberError ? <div role="alert" className="m-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{memberError}</div>
                : members.length === 0 ? <div className="p-8 text-center text-xs text-slate-400">Dự án chưa có thành viên được ghi nhận.</div>
                  : <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500"><tr><th className="px-5 py-3 font-semibold">Thành viên</th><th className="px-4 py-3 font-semibold">Phòng ban</th><th className="px-5 py-3 font-semibold">Vai trò dự án</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">{members.map((member) => <tr key={`${member.projectId}-${member.userId}`} className="hover:bg-slate-50/70"><td className="px-5 py-3"><div className="font-semibold text-slate-800">{member.fullName}</div><div className="mt-1 text-[10px] text-slate-400">{member.email}</div></td><td className="px-4 py-3 text-slate-500">{member.departmentName || 'Chưa cập nhật'}</td><td className="px-5 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">{member.projectRole}</span></td></tr>)}</tbody>
                  </table></div>}
          </section>
          {currentUser.role === 'EMPLOYEE' && (
            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5"><h3 className="text-sm font-bold text-amber-900">Tài liệu và số hóa dự án</h3><p className="mt-1 text-xs leading-5 text-amber-800">Backend hiện chưa có API lưu trữ và xem tài liệu của dự án. Trợ lý số hóa AI hiện chỉ chạy trong luồng tạo dự án, nên chưa có tài liệu đã lưu để mở lại tại đây.</p></section>
          )}
        </div>
      )}

      {activeTab === 'kanban' && (
        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><div><h3 className="text-sm font-bold text-slate-800">Bảng công việc (Kanban)</h3><p className="mt-1 text-[10px] text-slate-400">Kéo thả task sang cột trạng thái khác hoặc chọn trạng thái trong thẻ.</p></div><span className="text-[11px] text-slate-400">{tasks.length} task</span></div>
          {loading ? <div role="status" className="py-12 text-center text-xs text-slate-400">Đang tải bảng công việc...</div>
            : tasks.length === 0 ? <div className="py-12 text-center text-xs text-slate-400">Dự án chưa có đầu việc.</div>
              : <div className="flex gap-3 overflow-x-auto pb-2">
                {taskColumns.map(({ status, label }) => {
                  const columnTasks = tasks.filter((task) => task.status === status);
                  return <div key={status} onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, status)} className="w-72 shrink-0 rounded-2xl bg-slate-50 p-3">
                    <div className="mb-3 flex items-center justify-between"><h4 className="text-xs font-bold text-slate-700">{label}</h4><span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">{columnTasks.length}</span></div>
                    <div className="min-h-24 space-y-2">
                      {columnTasks.map((task) => (
                        <article key={task.id} draggable={canUpdateTaskStatus(task)} onDragStart={(event) => { setDraggingTaskId(String(task.id)); event.dataTransfer.setData('text/plain', String(task.id)); }} onDragEnd={() => setDraggingTaskId(null)} className={`rounded-xl border border-slate-200 bg-white p-3 shadow-sm ${draggingTaskId === String(task.id) ? 'opacity-50' : ''} ${canUpdateTaskStatus(task) ? 'cursor-grab active:cursor-grabbing' : ''}`}>
                          <button type="button" onClick={() => setDetailTask(task)} className="w-full text-left text-xs font-semibold text-slate-800 hover:text-blue-700">{task.title}</button>
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2"><PriorityBadge priority={task.priority} /><span className="text-[10px] text-slate-400">{String(task.deadline || task.dueDate || '').slice(0, 10) || 'Chưa có deadline'}</span></div>
                          <div className="mt-2 truncate text-[10px] text-slate-500">{task.assigneeName || task.assignee_name || 'Chưa phân công'}</div>
                          <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                            <select aria-label={`Trạng thái ${task.title}`} value={task.status} disabled={!canUpdateTaskStatus(task) || savingTaskId === String(task.id)} onChange={(event) => void updateTaskStatus(task, event.target.value as TaskStatus)} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] text-slate-600 disabled:opacity-50">{taskColumns.map((column) => <option key={column.status} value={column.status}>{column.label}</option>)}</select>
                            <div className="flex shrink-0 items-center gap-1">
                              <button type="button" title="Xem chi tiết" onClick={() => setDetailTask(task)} className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Eye className="h-3.5 w-3.5" /></button>
                              {canEditTask() && <button type="button" title="Sửa đầu việc" onClick={() => { setEditingTask(task); setTaskModalOpen(true); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Edit2 className="h-3.5 w-3.5" /></button>}
                              {canDeleteTask() && <button type="button" title="Xóa đầu việc" onClick={() => void removeTask(task)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>}
                            </div>
                          </div>
                        </article>
                      ))}
                      {!columnTasks.length && <div className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-[10px] text-slate-400">Thả công việc vào đây</div>}
                    </div>
                  </div>;
                })}
              </div>}
        </section>
      )}

      {activeTab === 'gantt' && (
        loading ? <div role="status" className="rounded-3xl border border-slate-100 bg-white p-12 text-center text-xs text-slate-400">Đang tải tiến độ...</div>
          : <ProjectGantt project={project} tasks={tasks} />
      )}

      <TaskFormModal isOpen={taskModalOpen} onClose={() => setTaskModalOpen(false)} onSubmitSuccess={saveTask} initialTask={editingTask} defaultProjectId={String(project.id)} />
      {detailTask && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setDetailTask(null)}><div onClick={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl"><div className="flex items-center justify-between"><h3 className="text-base font-bold text-slate-800">{detailTask.title}</h3><button type="button" onClick={() => setDetailTask(null)} className="text-xl text-slate-400" aria-label="Đóng">×</button></div><p className="mt-3 text-xs leading-5 text-slate-500">{detailTask.description || 'Không có mô tả.'}</p><div className="mt-5 grid grid-cols-2 gap-3 text-xs"><div className="rounded-2xl bg-slate-50 p-3"><span className="text-slate-400">Người thực hiện</span><b className="mt-1 block">{detailTask.assigneeName || detailTask.assignee_name || 'Chưa phân công'}</b></div><div className="rounded-2xl bg-slate-50 p-3"><span className="text-slate-400">Ngày bắt đầu</span><b className="mt-1 block">{String(detailTask.startDate || detailTask.start_date || '').slice(0, 10) || 'Chưa cập nhật'}</b></div><div className="rounded-2xl bg-slate-50 p-3"><span className="text-slate-400">Hạn hoàn thành</span><b className="mt-1 block">{String(detailTask.deadline || detailTask.dueDate || '').slice(0, 10) || 'Chưa cập nhật'}</b></div><div className="rounded-2xl bg-slate-50 p-3"><span className="text-slate-400">Trạng thái</span><div className="mt-1"><StatusBadge status={detailTask.status} /></div></div><div className="rounded-2xl bg-slate-50 p-3"><span className="text-slate-400">Ưu tiên</span><div className="mt-1"><PriorityBadge priority={detailTask.priority} /></div></div></div></div></div>}
    </div>
  );
};
