import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reassignSchema, ReassignFormData } from '../../schema/reassign.schema';
import { X, Loader2, UserCheck } from 'lucide-react';
import { Task, User } from '../../types';
import { userApi } from '../../services/api/user.api';

interface ReassignTaskModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onReassignSuccess: (taskId: string, newAssigneeId: string, newAssigneeName: string) => void;
}

export const ReassignTaskModal: React.FC<ReassignTaskModalProps> = ({
  isOpen,
  task,
  onClose,
  onReassignSuccess,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => { userApi.getUsers().then(setUsers).catch(() => setUsers([])); }, []);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReassignFormData>({
    resolver: zodResolver(reassignSchema),
    values: {
      taskId: String(task?.id || ''),
      newAssigneeId: '',
      reason: '',
    },
  });

  if (!isOpen || !task) return null;

  const handleFormSubmit: SubmitHandler<ReassignFormData> = async (data) => {
    const targetUser = users.find((u) => String(u.id) === String(data.newAssigneeId));
    if (targetUser) {
      onReassignSuccess(data.taskId, data.newAssigneeId, targetUser.name);
    }
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Đổi người phụ trách chính</h3>
              <p className="text-[11px] text-slate-400">Chuyển giao quyền Assignee cho nhân sự khác</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
          <span className="text-[11px] text-slate-400 block mb-0.5">Công việc đang xử lý:</span>
          <span className="font-bold text-slate-800 block truncate">{task.title}</span>
          <span className="text-[11px] text-slate-500 block mt-1">
            Người phụ trách hiện tại: <strong className="text-slate-700">{task.assigneeName}</strong>
          </span>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <input type="hidden" {...register('taskId')} />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Người chịu trách nhiệm mới <span className="text-red-500">*</span>
            </label>
            <select
              {...register('newAssigneeId')}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">-- Chọn nhân sự thay thế --</option>
              {users
                .filter((u) => String(u.id) !== String(task.assigneeId))
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.departmentName} - {u.role})
                  </option>
                ))}
            </select>
            {errors.newAssigneeId && (
              <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.newAssigneeId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lý do chuyển giao <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              {...register('reason')}
              placeholder="Ghi rõ lý do (VD: Quá tải tiến độ, điều chuyển công tác...)"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {errors.reason && (
              <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.reason.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận đổi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
