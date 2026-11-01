import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectSchema, ProjectFormData } from '../../schema/project.schema';
import { X, Loader2 } from 'lucide-react';
import { Department, Project, User } from '../../types';
import { departmentApi } from '../../services/api/department.api';
import { userApi } from '../../services/api/user.api';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (data: ProjectFormData, isEditing: boolean) => void;
  initialProject?: Project | null;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  onSubmitSuccess,
  initialProject,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => {
    Promise.all([departmentApi.getDepartments(), userApi.getUsers()])
      .then(([departmentData, userData]) => { setDepartments(departmentData); setUsers(userData); });
  }, []);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      departmentId: '',
      pmId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    },
  });

  useEffect(() => {
    if (initialProject) {
      reset({
        name: initialProject.name,
        description: initialProject.description,
        departmentId: String(initialProject.departmentId ?? initialProject.department_id ?? ''),
        pmId: String(initialProject.pmId ?? initialProject.leader_id ?? ''),
        startDate: initialProject.startDate ?? initialProject.start_date,
        endDate: initialProject.endDate ?? initialProject.end_date,
      });
    } else {
      reset({
        name: '',
        description: '',
        departmentId: '',
        pmId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
      });
    }
  }, [initialProject, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = async (data: ProjectFormData) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    onSubmitSuccess(data, !!initialProject);
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {initialProject ? 'Chỉnh sửa thông tin dự án' : 'Tạo dự án mới'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Phân cấp quản trị dự án theo chuẩn doanh nghiệp</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên dự án <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="VD: Nâng cấp cổng thông tin khách hàng"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {errors.name && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả mục tiêu</label>
            <textarea
              rows={2}
              {...register('description')}
              placeholder="Mô tả mục tiêu chiến lược và kết quả kỳ vọng..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {errors.description && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phòng ban phụ trách <span className="text-red-500">*</span>
              </label>
              <select
                {...register('departmentId')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">-- Chọn phòng ban --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {errors.departmentId && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.departmentId.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Manager (PM) <span className="text-red-500">*</span>
              </label>
              <select
                {...register('pmId')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">-- Chỉ định PM --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
              {errors.pmId && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.pmId.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {errors.startDate && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.startDate.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày kết thúc <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('endDate')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {errors.endDate && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.endDate.message}</p>}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
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
              ) : initialProject ? (
                'Lưu thay đổi'
              ) : (
                'Tạo dự án'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
