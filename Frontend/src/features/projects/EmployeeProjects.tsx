import React, { useEffect, useState } from 'react';
import { ArrowRight, FolderKanban } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { Project } from '../../types';
import { projectApi } from '../../services/api/project.api';
import { ProjectMember, projectMemberApi } from '../../services/api/project-member.api';
import { useAuthStore } from '../../store/auth.store';
import { ProjectWorkspace } from './ProjectWorkspace';

export const EmployeeProjects: React.FC = () => {
  const currentUserId = useAuthStore((state) => state.currentUser.id);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError('');
    const loadProjects = async () => {
      try {
        const allProjects = await projectApi.getProjects();
        const memberships: ProjectMember[][] = [];
        for (let index = 0; index < allProjects.length; index += 8) {
          const batch = allProjects.slice(index, index + 8);
          memberships.push(...await Promise.all(batch.map((project) => projectMemberApi.getMembers(project.id))));
        }
        if (!active) return;
        const participatingIds = new Set(memberships.flat()
          .filter((member) => String(member.userId) === String(currentUserId))
          .map((member) => String(member.projectId)));
        setProjects(allProjects.filter((project) => participatingIds.has(String(project.id))));
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách dự án tham gia.');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void loadProjects();
    return () => { active = false; };
  }, [currentUserId]);

  if (selectedProject) {
    return <ProjectWorkspace project={selectedProject} onBack={() => setSelectedProject(null)} />;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><FolderKanban className="h-5 w-5" /></div>
          <div><h2 className="text-sm font-bold text-slate-800">Dự án tham gia</h2><p className="mt-1 text-xs text-slate-400">Xem thông tin chung và công việc trong các dự án bạn là thành viên.</p></div>
        </div>
      </section>

      {error && <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>}
      {isLoading ? (
        <div role="status" className="rounded-3xl border border-slate-100 bg-white p-12 text-center text-xs text-slate-400">Đang tải dự án tham gia...</div>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4"><h3 className="text-sm font-bold text-slate-800">Danh sách dự án ({projects.length})</h3></div>
          {projects.length === 0 ? <EmptyState title="Chưa có dự án tham gia" description="Các dự án được phân công cho bạn sẽ xuất hiện tại đây." /> : (
            <div className="divide-y divide-slate-100">
              {projects.map((project) => (
                <div key={project.id} className="flex flex-wrap items-center gap-3 px-5 py-4 transition hover:bg-slate-50/70">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><FolderKanban className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1"><h4 className="truncate text-sm font-semibold text-slate-800">{project.name}</h4><p className="mt-1 truncate text-[11px] text-slate-400">{project.description || 'Chưa có mô tả dự án.'}</p><p className="mt-1 text-[10px] text-slate-500">Quản lý: {project.leader_name || project.pmName || 'Chưa cập nhật'} · Tiến độ: {project.progressPercent ?? project.progress_percent ?? 0}%</p></div>
                  <button type="button" onClick={() => setSelectedProject(project)} className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50">Xem dự án<ArrowRight className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
