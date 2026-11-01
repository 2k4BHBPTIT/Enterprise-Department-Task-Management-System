import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskSchema, TaskFormData } from '../../schema/task.schema';
import { X, Loader2 } from 'lucide-react';
import { Department, Project, Task, User } from '../../types';
import { projectApi } from '../../services/api/project.api';
import { departmentApi } from '../../services/api/department.api';
import { userApi } from '../../services/api/user.api';
import { taskApi } from '../../services/api/task.api';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (data: TaskFormData, isEditing: boolean) => Promise<void> | void;
  initialTask?: Task | null;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  onSubmitSuccess,
  initialTask,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [submitError, setSubmitError] = useState('');
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  useEffect(() => {
    Promise.all([projectApi.getProjects(), departmentApi.getDepartments(), userApi.getUsers()])
      .then(([projectData, departmentData, userData]) => {
        setProjects(projectData);
        setDepartments(departmentData);
        setUsers(userData);
      });
  }, []);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      projectId: '',
      departmentId: '',
      assigneeId: '',
      followerIds: [],
      dependencyIds: [],
      status: 'TODO',
      priority: 'HIGH',
      taskType: 'DEVELOPMENT',
      dueDate: new Date().toISOString().split('T')[0],
      isImportant: false,
      isUrgent: false,
    },
  });

  useEffect(() => {
    if (initialTask) {
      reset({
        title: initialTask.title,
        description: initialTask.description || '',
        projectId: String(initialTask.projectId ?? initialTask.project_id ?? ''),
        departmentId: String(initialTask.departmentId ?? initialTask.department_id ?? ''),
        assigneeId: String(initialTask.assigneeId ?? initialTask.assignee_id ?? ''),
        followerIds: (initialTask.followerIds ?? initialTask.follower_ids ?? []).map(String),
        dependencyIds: (initialTask.dependencyIds ?? []).map(String),
        status: initialTask.status,
        priority: initialTask.priority,
        taskType: initialTask.taskType ?? initialTask.task_type ?? 'DEVELOPMENT',
        dueDate: initialTask.dueDate ?? initialTask.deadline,
        isImportant: initialTask.isImportant ?? initialTask.is_important ?? false,
        isUrgent: initialTask.isUrgent ?? initialTask.is_urgent ?? false,
      });
    } else {
      reset({
        title: '',
        description: '',
        projectId: '',
        departmentId: '',
        assigneeId: '',
        followerIds: [],
        dependencyIds: [],
        status: 'TODO',
        priority: 'HIGH',
        taskType: 'DEVELOPMENT',
        dueDate: new Date().toISOString().split('T')[0],
        isImportant: false,
        isUrgent: false,
      });
    }
  }, [initialTask, reset]);

  const selectedFollowers = watch('followerIds') || [];
  const selectedDependencies = watch('dependencyIds') || [];
  const selectedProjectId = watch('projectId');

  useEffect(() => {
    if (!selectedProjectId) {
      setProjectTasks([]);
      return;
    }
    taskApi.getTasks({ projectId: selectedProjectId })
      .then((tasks) => setProjectTasks(tasks.filter((task) => String(task.id) !== String(initialTask?.id))))
      .catch(() => setProjectTasks([]));
  }, [selectedProjectId, initialTask?.id]);

  if (!isOpen) return null;

  const toggleFollower = (userId: string) => {
    if (selectedFollowers.includes(userId)) {
      setValue('followerIds', selectedFollowers.filter((id) => id !== userId));
    } else {
      setValue('followerIds', [...selectedFollowers, userId]);
    }
  };

  const toggleDependency = (taskId: string) => {
    if (selectedDependencies.includes(taskId)) {
      setValue('dependencyIds', selectedDependencies.filter((id) => id !== taskId));
    } else {
      setValue('dependencyIds', [...selectedDependencies, taskId]);
    }
  };

  const handleFormSubmit = async (data: TaskFormData) => {
    setSubmitError('');
    try {
      await onSubmitSuccess(data, !!initialTask);
      reset();
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Không thể lưu công việc');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {initialTask ? 'Chỉnh sửa thông tin công việc' : 'Giao việc mới'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Mỗi việc có duy nhất 1 Assignee và nhiều Followers</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-4">
          {submitError && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[11px] text-red-700">
              {submitError}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tiêu đề công việc <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('title')}
              placeholder="VD: Kiểm thử chức năng thanh toán"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {errors.title && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dự án trực thuộc <span className="text-red-500">*</span>
              </label>
              <select
                {...register('projectId')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">-- Chọn dự án --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {errors.projectId && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.projectId.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bộ phận thực hiện <span className="text-red-500">*</span>
              </label>
              <select
                {...register('departmentId')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">-- Chọn bộ phận --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {errors.departmentId && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.departmentId.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Người chịu trách nhiệm chính (Assignee) <span className="text-red-500">*</span>
            </label>
            <select
              {...register('assigneeId')}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">-- Chọn nhân sự chịu trách nhiệm chính --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.departmentName} - {u.role})
                </option>
              ))}
            </select>
            {errors.assigneeId && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.assigneeId.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Người theo dõi (Followers)
            </label>
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl max-h-28 overflow-y-auto">
              {users.map((u) => {
                const userIdStr = String(u.id);
                const isChecked = selectedFollowers.includes(userIdStr);
                return (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => toggleFollower(userIdStr)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-medium transition ${
                      isChecked
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {u.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hạn chót <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('dueDate')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {errors.dueDate && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.dueDate.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Công việc phụ thuộc trước</label>
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl max-h-28 overflow-y-auto">
                {!selectedProjectId && <span className="text-[11px] text-slate-400">Chọn dự án để xem các đầu mục có thể phụ thuộc.</span>}
                {selectedProjectId && !projectTasks.length && <span className="text-[11px] text-slate-400">Dự án chưa có công việc khác.</span>}
                {projectTasks.map((task) => {
                  const taskId = String(task.id);
                  const selected = selectedDependencies.includes(taskId);
                  return (
                    <button
                      type="button"
                      key={task.id}
                      onClick={() => toggleDependency(taskId)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-medium border ${selected ? 'bg-violet-600 text-white border-violet-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      {task.title}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mức ưu tiên</label>
              <select
                {...register('priority')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="HIGH">Cao</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="LOW">Thấp</option>
                <option value="URGENT">Khẩn cấp</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Loại việc</label>
              <select
                {...register('taskType')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="PLANNING">Lập kế hoạch</option>
                <option value="DEVELOPMENT">Phát triển</option>
                <option value="DESIGN">Thiết kế</option>
                <option value="MARKETING">Marketing</option>
                <option value="TESTING">Kiểm thử</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang lưu...
                </>
              ) : initialTask ? (
                'Lưu thay đổi'
              ) : (
                'Giao việc'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
