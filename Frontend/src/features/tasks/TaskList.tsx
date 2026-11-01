import React, { useState } from 'react';
import { useFilterStore } from '../../store/filter.store';
import { useAuthStore } from '../../store/auth.store';
import { useGetTasks, useCreateTask, useUpdateTask, useDeleteTask, useReassignTask } from '../../hooks/useTasks';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonTable } from '../../components/common/SkeletonTable';
import { ChevronLeft, ChevronRight, Plus, UserCheck, Edit2, Trash2 } from 'lucide-react';
import { Task } from '../../types';
import { TaskFormModal } from './TaskFormModal';
import { ReassignTaskModal } from './ReassignTaskModal';
import { TaskFormData } from '../../schema/task.schema';

export const TaskList: React.FC = () => {
  const { filters } = useFilterStore();
  const { canCreateTask, canEditTask, canDeleteTask, canReassignLeader } = useAuthStore();
  const { tasks, isLoading, refetch } = useGetTasks(filters);
  const { createTask } = useCreateTask();
  const { updateTask } = useUpdateTask();
  const { deleteTask } = useDeleteTask();
  const { reassignTask } = useReassignTask();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [reassigningTask, setReassigningTask] = useState<Task | null>(null);

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

  const handleReassign = async (taskId: number | string, newAssigneeId: string) => {
    await reassignTask({
      taskId: String(taskId),
      newAssigneeId,
      reason: 'Điều chuyển phân công theo chỉ đạo quản trị',
    });
    refetch();
  };

  const hasAnyAction = canEditTask() || canReassignLeader() || canDeleteTask();

  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Bảng công việc</h2>
          <p className="text-xs text-slate-400 mt-0.5">Quản lý toàn bộ tiến độ, phân công và kiểm soát phân quyền</p>
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
          title="Không tìm thấy công việc"
          description="Vui lòng thử điều chỉnh lại bộ lọc."
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
                    <StatusBadge status={t.status} />
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
    </div>
  );
};
