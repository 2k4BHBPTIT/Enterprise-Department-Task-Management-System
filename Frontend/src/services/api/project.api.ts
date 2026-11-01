import { apiClient, ApiResponse, unwrapResponse } from './client';
import { Project, GlobalFilterParams, ProjectStatus } from '../../types';
import { ProjectFormData } from '../../schema/project.schema';

interface BackendProject {
  id: number;
  name: string;
  description?: string;
  leaderId?: number;
  leaderName?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  memberCount?: number;
  totalTasks?: number;
  completedTasks?: number;
  progressPercentage?: number;
}

const mapProject = (project: BackendProject): Project => ({
  id: project.id,
  name: project.name,
  description: project.description || '',
  department_id: 0,
  departmentId: 0,
  leader_id: project.leaderId ?? 0,
  pmId: project.leaderId ?? 0,
  leader_name: project.leaderName,
  pmName: project.leaderName,
  start_date: project.startDate || '',
  startDate: project.startDate || '',
  end_date: project.endDate || '',
  endDate: project.endDate || '',
  progress_percent: project.progressPercentage ?? 0,
  progressPercent: project.progressPercentage ?? 0,
  status: (project.status || 'PLANNING') as ProjectStatus,
  total_tasks: project.totalTasks ?? 0,
  totalTasks: project.totalTasks ?? 0,
  completed_tasks: project.completedTasks ?? 0,
  completedTasks: project.completedTasks ?? 0,
});

const toBackendProject = (data: Partial<ProjectFormData>) => ({
  name: data.name,
  description: data.description || undefined,
  leaderId: data.pmId ? Number(data.pmId) : undefined,
  startDate: data.startDate ? `${data.startDate}T00:00:00` : undefined,
  endDate: data.endDate ? `${data.endDate}T23:59:59` : undefined,
});

export const projectApi = {
  getProjects: async (params?: Partial<GlobalFilterParams>): Promise<Project[]> => {
    const response = await apiClient.get<ApiResponse<{ content?: BackendProject[] } | BackendProject[]>>('/projects', {
      params: { page: 0, size: 1000, sort: 'id,desc' },
    });
    const data = unwrapResponse(response.data);
    const projects = Array.isArray(data) ? data : data.content || [];
    const term = params?.searchTerm?.toLowerCase();
    const start = params?.fromDate;
    const end = params?.toDate;

    return projects
      .map(mapProject)
      .filter((project) => !term || `${project.name} ${project.description}`.toLowerCase().includes(term))
      .filter((project) => !params?.status || params.status === 'ALL' || project.status === params.status)
      .filter((project) => !params?.projectId || params.projectId === 'ALL' || String(project.id) === params.projectId)
      .filter((project) => !start || String(project.startDate || project.start_date).slice(0, 10) >= start)
      .filter((project) => !end || String(project.endDate || project.end_date).slice(0, 10) <= end);
  },

  getProjectById: async (id: number | string): Promise<Project> => {
    const response = await apiClient.get<ApiResponse<BackendProject>>(`/projects/${id}`);
    return mapProject(unwrapResponse(response.data));
  },

  createProject: async (data: ProjectFormData): Promise<Project> => {
    const response = await apiClient.post<ApiResponse<BackendProject>>('/projects', toBackendProject(data));
    return mapProject(unwrapResponse(response.data));
  },

  updateProject: async (id: number | string, data: Partial<ProjectFormData>): Promise<Project> => {
    const response = await apiClient.put<ApiResponse<BackendProject>>(`/projects/${id}`, toBackendProject(data));
    return mapProject(unwrapResponse(response.data));
  },

  deleteProject: async (id: number | string): Promise<{ success: boolean }> => {
    await apiClient.delete(`/projects/${id}`);
    return { success: true };
  },
};
