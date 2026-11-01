import React, { useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { useFilterStore } from '../../store/filter.store';
import { useGetProjects, useCreateProject, useUpdateProject, useDeleteProject } from '../../hooks/useProjects';
import { Trash2, Edit2, Plus, AlertCircle, Users } from 'lucide-react';
import { Project } from '../../types';
import { ProjectFormModal } from './ProjectFormModal';
import { SkeletonTable } from '../../components/common/SkeletonTable';
import { EmptyState } from '../../components/common/EmptyState';
import { ProjectFormData } from '../../schema/project.schema';
import { ProjectMembersModal } from './ProjectMembersModal';

export const ProjectList: React.FC = () => {
  const { canCreateProject, canEditProject, canDeleteProject, canManageProject } = useAuthStore();
  const { filters } = useFilterStore();
  const { projects, isLoading, refetch } = useGetProjects(filters);
  const { createProject } = useCreateProject();
  const { updateProject } = useUpdateProject();
  const { deleteProject } = useDeleteProject();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedMembersProject, setSelectedMembersProject] = useState<Project | null>(null);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleSaveProject = async (data: ProjectFormData, isEditing: boolean) => {
    if (isEditing && editingProject) {
      await updateProject(editingProject.id, data);
    } else {
      await createProject(data);
    }
    refetch();
  };

  const handleDelete = async (projectId: number | string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn dự án này không?')) {
      await deleteProject(projectId);
      refetch();
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Mức độ hoàn chỉnh dự án</h2>
          <p className="text-xs text-slate-400 mt-0.5">Click dự án để xem chi tiết hoặc chuyển sang tab Gantt</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ['Tổng dự án', projects.length, 'text-slate-800 bg-slate-50'],
            ['Đang thực hiện', projects.filter((project) => project.status === 'IN_PROGRESS').length, 'text-blue-600 bg-blue-50'],
            ['Hoàn thành', projects.filter((project) => project.status === 'COMPLETED').length, 'text-emerald-600 bg-emerald-50'],
            ['Đang có cảnh báo', projects.filter((project) => project.hasOverdueTasks || project.has_overdue_tasks).length, 'text-red-600 bg-red-50'],
          ].map(([label, value, style]) => (
            <div key={String(label)} className={`rounded-2xl p-3 ${style}`}>
              <div className="text-xl font-bold">{value as number}</div>
              <div className="text-[11px] text-slate-500 mt-1">{String(label)}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-600 rounded-xl">
            {projects.length} dự án
          </span>
          {canCreateProject() && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Tạo dự án mới
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <SkeletonTable rows={4} cols={6} />
      ) : projects.length === 0 ? (
        <EmptyState
          title="Không tìm thấy dự án"
          description="Vui lòng thử điều chỉnh lại bộ lọc tìm kiếm hoặc tạo dự án mới."
          actionText={canCreateProject() ? 'Tạo dự án' : undefined}
          onAction={canCreateProject() ? handleOpenCreate : undefined}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium">
                <th className="pb-3 font-semibold">Dự án</th>
                <th className="pb-3 font-semibold">PM / Leader</th>
                <th className="pb-3 font-semibold">Trạng thái</th>
                <th className="pb-3 font-semibold">Thời gian</th>
                <th className="pb-3 font-semibold w-48">Mức độ hoàn chỉnh</th>
                <th className="pb-3 font-semibold text-right">Việc</th>
                {(canEditProject() || canDeleteProject() || canManageProject()) && (
                  <th className="pb-3 font-semibold text-center w-24">Hành động</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition group">
                  <td className="py-3.5 pr-3">
                    <div className="font-bold text-slate-800">{p.name}</div>
                    <div className="text-[11px] text-slate-400">{p.description}</div>
                  </td>
                  <td className="py-3.5 pr-3 font-medium text-slate-700">{p.leader_name || p.pmName}</td>
                  <td className="py-3.5 pr-3">
                    {(p.has_overdue_tasks || p.hasOverdueTasks) && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-600 border border-red-200">
                        <AlertCircle className="w-3 h-3" />
                        Có quá hạn
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 pr-3 text-slate-500 whitespace-nowrap">
                    {p.start_date || p.startDate} ~ {p.end_date || p.endDate}
                  </td>
                  <td className="py-3.5 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${p.progress_percent ?? p.progressPercent}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 w-8 text-right">
                        {p.progress_percent ?? p.progressPercent}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 text-right font-medium text-slate-600">
                    {p.completed_tasks ?? p.completedTasks}/{p.total_tasks ?? p.totalTasks}
                  </td>
                  {(canEditProject() || canDeleteProject() || canManageProject()) && (
                    <td className="py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                        {canManageProject() && (
                          <button
                            onClick={() => setSelectedMembersProject(p)}
                            title="Quản lý thành viên dự án"
                            className="p-1 hover:bg-blue-50 rounded-lg text-slate-500 hover:text-blue-600 transition"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canEditProject() && (
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Chỉnh sửa dự án"
                            className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-blue-600 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDeleteProject() && (
                          <button
                            onClick={() => handleDelete(p.id)}
                            title="Xóa dự án (Admin/Manager)"
                            className="p-1 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition"
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

      <ProjectFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitSuccess={handleSaveProject}
        initialProject={editingProject}
      />
      <ProjectMembersModal project={selectedMembersProject} onClose={() => setSelectedMembersProject(null)} />
    </div>
  );
};
