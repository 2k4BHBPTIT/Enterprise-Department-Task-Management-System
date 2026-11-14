import React, { useMemo, useState } from 'react';
import { useFilterStore } from '../../store/filter.store';
import { useAuthStore } from '../../store/auth.store';
import { useGetTasks, useCreateTask, useUpdateTask, useDeleteTask, useReassignTask } from '../../hooks/useTasks';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonTable } from '../../components/common/SkeletonTable';
import { ChevronLeft, ChevronRight, Gauge, Loader2, Plus, UserCheck, Edit2, Trash2, X } from 'lucide-react';
import { Task, TaskStatus } from '../../types';
import { taskApi } from '../../services/api/task.api';
import { TaskFormModal } from './TaskFormModal';
import { ReassignTaskModal } from './ReassignTaskModal';
import { TaskFormData } from '../../schema/task.schema';

export const TaskList: React.FC = () => {
  const { filters } = useFilterStore();
  const { currentUser, canCreateTask, canEditTask, canDeleteTask, canReassignLeader } = useAuthStore();
  const taskFilters = useMemo(
    () => currentUser.role === 'EMPLOYEE' ? { ...filters, assigneeId: String(currentUser.id) } : filters,
    [currentUser.id, currentUser.role, filters],
  );
  const { tasks, isLoading, refetch } = useGetTasks(taskFilters);
  const { createTask } = useCreateTask();
  const { updateTask } = useUpdateTask();
  const { deleteTask } = useDeleteTask();
  const { reassignTask } = useReassignTask();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [reassigningTask, setReassigningTask] = useState<Task | null>(null);
  const [progressTask, setProgressTask] = useState<Task | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  const [progressSaving, setProgressSaving] = useState(false);
  const [progressError, setProgressError] = useState('');
  const [progressSavedId, setProgressSavedId] = useState<number | string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>('TODO');
  const [progressDrafts, setProgressDrafts] = useState<Record<string, number>>({});
  const [inlineSavingId, setInlineSavingId] = useState<number | string | null>(null);
  const [inlineError, setInlineError] = useState('');

  const handleOpenCreate = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (data: TaskFormData, isEditing: boolean) => {
    if (isEditing && editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await createTask(data);
    }
    await refetch();
  };

  const handleDeleteTask = async (taskId: number | string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa công việc này không?')) {
      await deleteTask(taskId);
      refetch();
    }
  };

  const openProgress = (task: Task) => {
    setProgressTask(task);
    setProgressValue(getProgress(task));
    setSelectedStatus(task.status);
  };

  const saveProgress = async () => {
    if (!progressTask) return;
    setProgressSaving(true);
    setProgressError('');
    try {
      const status = selectedStatus === 'COMPLETED' && progressValue < 100
        ? 'IN_PROGRESS'
        : progressValue >= 100 ? 'COMPLETED' : selectedStatus;
      await taskApi.updateTaskProgress(
        progressTask.id,
        progressValue,
        status,
        progressTask,
      );
      await taskApi.updateTaskStatus(progressTask.id, status);
      const stored = JSON.parse(localStorage.getItem('taskProgressOverrides') || '{}') as Record<string, number>;
      stored[String(progressTask.id)] = progressValue;
      localStorage.setItem('taskProgressOverrides', JSON.stringify(stored));
      setProgressTask(null);
      setProgressSavedId(progressTask.id);
      await refetch();
    } catch (error) {
      setProgressError(error instanceof Error ? error.message : 'Không thể cập nhật tiến độ');
    } finally {
      setProgressSaving(false);
    }
  };

  const getProgress = (task: Task) => {
    try {
      const stored = JSON.parse(localStorage.getItem('taskProgressOverrides') || '{}') as Record<string, number>;
      if (typeof stored[String(task.id)] === 'number') return stored[String(task.id)];
    } catch {
      return task.progressPercent ?? task.progress_percent ?? 0;
    }
    return task.progressPercent ?? task.progress_percent ?? 0;
  };

  const saveInlineProgress = async (task: Task, progress: number) => {
    const status = progress >= 100
      ? 'COMPLETED'
      : task.status === 'COMPLETED'
        ? 'IN_PROGRESS'
        : progress > 0 && task.status === 'TODO'
          ? 'IN_PROGRESS'
          : task.status;
    setInlineSavingId(task.id);
    setInlineError('');
    try {
      await taskApi.updateTaskProgress(task.id, progress, status, task);
      const stored = JSON.parse(localStorage.getItem('taskProgressOverrides') || '{}') as Record<string, number>;
      stored[String(task.id)] = progress;
      localStorage.setItem('taskProgressOverrides', JSON.stringify(stored));
      setProgressDrafts((drafts) => ({ ...drafts, [String(task.id)]: progress }));
      setProgressSavedId(task.id);
      await refetch();
    } catch (error) {
      setInlineError(error instanceof Error ? error.message : 'Không thể cập nhật tiến độ công việc.');
    } finally {
      setInlineSavingId(null);
    }
  };

  const saveInlineStatus = async (task: Task, status: TaskStatus) => {
    setInlineSavingId(task.id);
    setInlineError('');
    try {
      await taskApi.updateTaskStatus(task.id, status);
      const progress = status === 'COMPLETED'
        ? 100
        : status === 'TODO' || (status === 'IN_PROGRESS' && getProgress(task) >= 100)
          ? 0
          : getProgress(task);
      const stored = JSON.parse(localStorage.getItem('taskProgressOverrides') || '{}') as Record<string, number>;
      stored[String(task.id)] = progress;
      localStorage.setItem('taskProgressOverrides', JSON.stringify(stored));
      setProgressDrafts((drafts) => ({ ...drafts, [String(task.id)]: progress }));
      setProgressSavedId(task.id);
      await refetch();
    } catch (error) {
      setInlineError(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái công việc.');
    } finally {
      setInlineSavingId(null);
    }
  };

  const handleReassign = async (taskId: number | string, newAssigneeId: string) => {
    await reassignTask({
      taskId: String(taskId),
      newAssigneeId,
      reason: 'Điều chuyển phân công theo chỉ đạo quản trị',
    });
    refetch();
  };

  const canUpdateTaskProgress = (task: Task) =>
    canEditTask() || String(task.assigneeId ?? task.assignee_id) === String(currentUser.id);
  const isEmployee = currentUser.role === 'EMPLOYEE';
  const hasAnyAction = !isEmployee;

  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
      {progressSavedId !== null && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
          Đã lưu tiến độ công việc thành công.
          <button type="button" onClick={() => setProgressSavedId(null)} className="ml-3 underline">Đóng</button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800">{isEmployee ? 'Công việc của tôi' : 'Bảng công việc'}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{isEmployee ? 'Cập nhật trạng thái và kéo thanh tiến độ trực tiếp trên từng công việc.' : 'Quản lý toàn bộ tiến độ, phân công và kiểm soát phân quyền'}</p>
        </div>
        <div className="flex items-center gap-2">
          {canCreateTask() && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Giao việc mới
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ['Tổng công việc', tasks.length, 'bg-slate-50 text-slate-800'],
          ['Đang thực hiện', tasks.filter((task) => task.status === 'IN_PROGRESS').length, 'bg-blue-50 text-blue-600'],
          ['Hoàn thành', tasks.filter((task) => task.status === 'COMPLETED').length, 'bg-emerald-50 text-emerald-600'],
          ['Quá hạn / chặn', tasks.filter((task) => task.status === 'OVERDUE' || task.status === 'BLOCKED' || (task.overdueDays || 0) > 0).length, 'bg-red-50 text-red-600'],
        ].map(([label, value, style]) => (
          <div key={String(label)} className={`rounded-2xl p-3 ${style}`}>
            <div className="text-xl font-bold">{value as number}</div>
            <div className="text-[11px] text-slate-500 mt-1">{String(label)}</div>
          </div>
        ))}
      </div>

      {inlineError && <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">{inlineError}</div>}

      <div className="flex items-center justify-between bg-slate-50/70 px-4 py-2 rounded-2xl border border-slate-100">
        <span className="text-xs font-semibold text-blue-600">
          {tasks.length} việc • trang 1/1
        </span>
        <div className="flex items-center gap-1 text-slate-400">
          <button className="p-1 hover:bg-slate-200 rounded-lg disabled:opacity-30" disabled>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 hover:bg-slate-200 rounded-lg disabled:opacity-30" disabled>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} cols={7} />
      ) : tasks.length === 0 ? (
        <EmptyState
          title={isEmployee ? 'Bạn chưa được giao công việc nào' : 'Không tìm thấy công việc'}
          description={isEmployee ? 'Các công việc được giao cho bạn sẽ xuất hiện tại đây.' : 'Vui lòng thử điều chỉnh lại bộ lọc.'}
          actionText={canCreateTask() ? 'Giao việc mới' : undefined}
          onAction={canCreateTask() ? handleOpenCreate : undefined}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium">
                <th className="pb-3 font-semibold">Công việc</th>
                <th className="pb-3 font-semibold">Dự án</th>
                <th className="pb-3 font-semibold">Phụ trách (Assignee)</th>
                <th className="pb-3 font-semibold">Bộ phận</th>
                <th className="pb-3 font-semibold">Trạng thái</th>
                <th className="pb-3 font-semibold min-w-32">Tiến độ</th>
                <th className="pb-3 font-semibold">Ưu tiên</th>
                <th className="pb-3 font-semibold">Hạn chót</th>
                {hasAnyAction && <th className="pb-3 font-semibold text-center w-28">Hành động</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition group">
                  <td className="py-3 pr-3">
                    <div className="font-bold text-slate-800">{t.title}</div>
                    <div className="text-[11px] text-slate-400">{t.description}</div>
                  </td>
                  <td className="py-3 pr-3 text-slate-600 font-medium">{t.projectName}</td>
                  <td className="py-3 pr-3 font-semibold text-slate-700">{t.assigneeName}</td>
                  <td className="py-3 pr-3 text-slate-500">{t.departmentName}</td>
                  <td className="py-3 pr-3">
                    {isEmployee ? (
                      <select
                        aria-label={`Trạng thái ${t.title}`}
                        value={t.status}
                        disabled={inlineSavingId === t.id || !canUpdateTaskProgress(t)}
                        onChange={(event) => void saveInlineStatus(t, event.target.value as TaskStatus)}
                        className="max-w-36 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-700 disabled:opacity-50"
                      >
                        <option value="TODO">Chưa bắt đầu</option>
                        <option value="IN_PROGRESS">Đang thực hiện</option>
                        <option value="WAITING">Chờ xử lý</option>
                        <option value="BLOCKED">Bị chặn</option>
                        <option value="COMPLETED">Hoàn thành</option>
                        <option value="OVERDUE">Quá hạn</option>
                        <option value="CANCELLED">Đã hủy</option>
                      </select>
                    ) : <StatusBadge status={t.status} />}
                  </td>
                  <td className="py-3 pr-3">
                    {isEmployee ? (
                      <div className="min-w-32">
                        <div className="mb-1 flex items-center justify-between text-[10px]"><span className="text-slate-400">{inlineSavingId === t.id ? 'Đang lưu...' : 'Kéo để cập nhật'}</span><span className="font-bold text-slate-700">{progressDrafts[String(t.id)] ?? getProgress(t)}%</span></div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={progressDrafts[String(t.id)] ?? getProgress(t)}
                          disabled={!canUpdateTaskProgress(t) || inlineSavingId === t.id}
                          onChange={(event) => setProgressDrafts((drafts) => ({ ...drafts, [String(t.id)]: Number(event.target.value) }))}
                          onPointerUp={(event) => void saveInlineProgress(t, Number(event.currentTarget.value))}
                          onKeyUp={(event) => void saveInlineProgress(t, Number(event.currentTarget.value))}
                          aria-label={`Tiến độ ${t.title}`}
                          className="w-full accent-blue-600 disabled:opacity-50"
                        />
                      </div>
                    ) : (
                      <button type="button" onClick={() => canUpdateTaskProgress(t) && openProgress(t)} disabled={!canUpdateTaskProgress(t)} className="min-w-28 text-left group disabled:cursor-not-allowed disabled:opacity-70" aria-label={`Cập nhật tiến độ ${t.title}`}>
                        <div className="mb-1 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 group-hover:text-blue-600">Cập nhật</span>
                          <span className="font-bold text-slate-700">{getProgress(t)}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all" style={{ width: `${getProgress(t)}%` }} />
                        </div>
                      </button>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td className="py-3 text-slate-500 whitespace-nowrap">{t.deadline || t.dueDate}</td>
                  {hasAnyAction && (
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                        {canEditTask() && (
                          <button
                            onClick={() => handleOpenEdit(t)}
                            title="Chỉnh sửa công việc"
                            className="p-1 hover:bg-slate-200 text-slate-500 hover:text-blue-600 rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canUpdateTaskProgress(t) && (
                          <button
                            type="button"
                            onClick={() => openProgress(t)}
                            title="Cập nhật tiến độ"
                            className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition"
                          >
                            <Gauge className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canReassignLeader() && (
                          <button
                            onClick={() => setReassigningTask(t)}
                            title="Đổi người phụ trách chính"
                            className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDeleteTask() && (
                          <button
                            onClick={() => handleDeleteTask(t.id)}
                            title="Xóa công việc (Admin/Manager)"
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmitSuccess={handleSaveTask}
        initialTask={editingTask}
      />

      <ReassignTaskModal
        isOpen={!!reassigningTask}
        task={reassigningTask}
        onClose={() => setReassigningTask(null)}
        onReassignSuccess={handleReassign}
      />

      {progressTask && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Cập nhật tiến độ công việc">
          <div className="w-full max-w-md rounded-3xl border border-white bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><h3 className="font-bold text-slate-800">Cập nhật tiến độ</h3><p className="mt-1 text-xs text-slate-500">{progressTask.title}</p></div>
              <button type="button" onClick={() => setProgressTask(null)} aria-label="Đóng" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <div className="flex items-end justify-between"><span className="text-xs font-semibold text-slate-500">Mức hoàn thành</span><span className="text-3xl font-bold text-blue-600">{progressValue}%</span></div>
              <input type="range" min="0" max="100" step="5" value={progressValue} onChange={(event) => setProgressValue(Number(event.target.value))} className="mt-4 w-full accent-blue-600" aria-label="Mức hoàn thành công việc" />
              <div className="mt-2 flex justify-between text-[10px] text-slate-400"><span>0%</span><span>50%</span><span>100%</span></div>
            </div>
            <div className="mt-4">
              <label htmlFor="task-status" className="mb-2 block text-xs font-semibold text-slate-700">Trạng thái công việc</label>
              <select
                id="task-status"
                value={selectedStatus}
                onChange={(event) => {
                  const status = event.target.value as TaskStatus;
                  setSelectedStatus(status);
                  if (status === 'COMPLETED') setProgressValue(100);
                  if (status === 'TODO') setProgressValue(0);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="TODO">Chưa bắt đầu</option>
                <option value="IN_PROGRESS">Đang thực hiện</option>
                <option value="WAITING">Chờ xử lý</option>
                <option value="BLOCKED">Bị chặn</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="OVERDUE">Quá hạn</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>
            {progressError && <div role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{progressError}</div>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setProgressTask(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Hủy</button>
              <button type="button" disabled={progressSaving} onClick={saveProgress} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60">
                {progressSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {progressSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
