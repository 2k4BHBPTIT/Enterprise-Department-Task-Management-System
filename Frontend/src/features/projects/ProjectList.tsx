import React, { useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { useFilterStore } from '../../store/filter.store';
import { useGetProjects, useCreateProject } from '../../hooks/useProjects';
import { ArrowRight, Plus, FolderKanban } from 'lucide-react';
import { Project, ProjectStatus } from '../../types';
import { ProjectFormModal } from './ProjectFormModal';
import { SkeletonTable } from '../../components/common/SkeletonTable';
import { EmptyState } from '../../components/common/EmptyState';
import { ProjectFormData } from '../../schema/project.schema';
import { ProjectWorkspace } from './ProjectWorkspace';
import { Search } from 'lucide-react';

const projectStatusLabels: Record<ProjectStatus, string> = {
  PLANNING: 'Đang lên kế hoạch',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  ON_HOLD: 'Tạm dừng',
  OVERDUE: 'Quá hạn',
};

const projectStatusStyles: Record<ProjectStatus, string> = {
  PLANNING: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  ON_HOLD: 'bg-amber-50 text-amber-700',
  OVERDUE: 'bg-rose-50 text-rose-700',
};

export const ProjectList: React.FC = () => {
  const { currentUser, canCreateProject } = useAuthStore();
  const { filters } = useFilterStore();
  const { projects, isLoading, refetch } = useGetProjects(filters);
  const { createProject } = useCreateProject();

  const [activeSection, setActiveSection] = useState<'list' | 'create'>('list');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [managerSearch, setManagerSearch] = useState('');
  const [managerStatus, setManagerStatus] = useState<'ALL' | ProjectStatus>('ALL');
  const isManager = currentUser.role === 'MANAGER';
  const managedProjects = isManager
    ? projects.filter((project) => String(project.leader_id ?? project.pmId) === String(currentUser.id))
    : projects;
  const displayedProjects = isManager
    ? managedProjects.filter((project) =>
      `${project.name} ${project.description || ''}`.toLowerCase().includes(managerSearch.toLowerCase())
      && (managerStatus === 'ALL' || project.status === managerStatus))
    : managedProjects;

  if (selectedProject) {
    return (
      <ProjectWorkspace
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
      />
    );
  }

  const handleOpenCreate = () => {
    setActiveSection('create');
  };

  const handleSaveProject = async (data: ProjectFormData) => {
    await createProject(data);
    await refetch();
    setActiveSection('list');
  };

  const sectionTabs = (
    <div role="tablist" aria-label="Dự án" className="flex w-fit gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        role="tab"
        aria-selected={activeSection === 'list'}
        onClick={() => setActiveSection('list')}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${activeSection === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
      >
        <FolderKanban className="h-4 w-4" aria-hidden="true" />
        Danh sách dự án
      </button>
      {canCreateProject() && (
        <button
          type="button"
          role="tab"
          aria-selected={activeSection === 'create'}
          onClick={handleOpenCreate}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${activeSection === 'create' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Tạo dự án
        </button>
      )}
    </div>
  );

  if (activeSection === 'create' && canCreateProject()) {
    return (
      <div className="space-y-4">
        {sectionTabs}
        <ProjectFormModal
          isOpen
          presentation="page"
          onClose={() => setActiveSection('list')}
          onSubmitSuccess={handleSaveProject}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sectionTabs}
      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-sm font-bold text-slate-800">{isManager ? 'Dự án của tôi' : 'Danh sách dự án'}</h2><p className="mt-1 text-xs text-slate-400">{isManager ? 'Các dự án do bạn chủ trì; tìm kiếm và lọc theo trạng thái.' : 'Theo dõi trạng thái, thời gian và tiến độ dự án'}</p></div>
          {canCreateProject() && <button type="button" onClick={handleOpenCreate} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"><Plus className="h-4 w-4" />Tạo dự án</button>}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {[
            ['Tổng số dự án', managedProjects.length, 'bg-slate-50 text-slate-700'],
            ['Đang lên kế hoạch', managedProjects.filter((project) => project.status === 'PLANNING').length, 'bg-slate-50 text-slate-700'],
            ['Đang thực hiện', managedProjects.filter((project) => project.status === 'IN_PROGRESS').length, 'bg-blue-50 text-blue-700'],
            ['Hoàn thành', managedProjects.filter((project) => project.status === 'COMPLETED').length, 'bg-emerald-50 text-emerald-700'],
            ['Tạm dừng / quá hạn', managedProjects.filter((project) => project.status === 'ON_HOLD' || project.status === 'OVERDUE').length, 'bg-amber-50 text-amber-700'],
          ].map(([label, value, style]) => <div key={String(label)} className={`rounded-2xl p-3 ${style}`}><div className="text-xl font-bold">{value as number}</div><div className="mt-1 text-[10px] opacity-75">{String(label)}</div></div>)}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-bold text-slate-800">{isManager ? `Dự án chủ trì (${displayedProjects.length})` : `Các dự án (${displayedProjects.length})`}</h3>
          {isManager && <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <label className="relative block sm:w-64"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input value={managerSearch} onChange={(event) => setManagerSearch(event.target.value)} placeholder="Tìm tên hoặc mô tả dự án..." className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
            <select aria-label="Lọc dự án theo trạng thái" value={managerStatus} onChange={(event) => setManagerStatus(event.target.value as 'ALL' | ProjectStatus)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none focus:border-blue-400">
              <option value="ALL">Tất cả trạng thái</option>
              {Object.entries(projectStatusLabels).map(([status, label]) => <option key={status} value={status}>{label}</option>)}
            </select>
          </div>}
        </div>
        {isLoading ? <SkeletonTable rows={4} cols={6} /> : displayedProjects.length === 0 ? (
          <EmptyState title={isManager ? (managedProjects.length ? 'Không tìm thấy dự án phù hợp' : 'Bạn chưa chủ trì dự án nào') : 'Chưa có dự án'} description={isManager ? (managedProjects.length ? 'Thử từ khóa hoặc trạng thái khác.' : 'Các dự án do bạn chủ trì sẽ xuất hiện tại đây.') : 'Tạo dự án mới để bắt đầu theo dõi tiến độ.'} actionText={canCreateProject() && !isManager ? 'Tạo dự án' : undefined} onAction={canCreateProject() && !isManager ? handleOpenCreate : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr><th className="px-5 py-3 font-semibold">Dự án</th><th className="px-4 py-3 font-semibold">PM phụ trách</th><th className="px-4 py-3 font-semibold">Trạng thái</th><th className="px-4 py-3 font-semibold">Thời gian</th><th className="px-4 py-3 font-semibold">Tiến độ</th><th className="px-4 py-3 text-center font-semibold">Công việc</th><th className="px-5 py-3 text-right font-semibold">Hành động</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedProjects.map((project) => {
                  const progress = Math.max(0, Math.min(100, Number(project.progressPercent ?? project.progress_percent ?? 0)));
                  return <tr key={project.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-3.5"><div className="font-semibold text-slate-800">{project.name}</div><div className="mt-1 max-w-sm truncate text-[10px] text-slate-400">{project.description || 'Chưa có mô tả'}</div></td>
                    <td className="px-4 py-3.5 text-slate-600">{project.leader_name || project.pmName || '—'}</td>
                    <td className="px-4 py-3.5"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${projectStatusStyles[project.status]}`}>{projectStatusLabels[project.status]}</span></td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">{String(project.startDate || project.start_date || '').slice(0, 10)} – {String(project.endDate || project.end_date || '').slice(0, 10)}</td>
                    <td className="px-4 py-3.5"><div className="flex min-w-28 items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} /></div><span className="w-10 text-right text-[10px] font-bold text-slate-700">{progress}%</span></div></td>
                    <td className="px-4 py-3.5 text-center text-slate-600">{project.completedTasks ?? project.completed_tasks ?? 0}/{project.totalTasks ?? project.total_tasks ?? 0}</td>
                    <td className="px-5 py-3.5 text-right"><button type="button" aria-label={`Mở chi tiết dự án ${project.name}`} title="Mở chi tiết dự án" onClick={() => setSelectedProject(project)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-50"><ArrowRight className="h-4 w-4" /></button></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
