import { apiClient, ApiResponse, unwrapResponse } from './client';

export interface ProjectMember {
  projectId: number;
  userId: number;
  fullName: string;
  email: string;
  departmentId?: number;
  departmentName?: string;
  projectRole: string;
  joinedAt?: string;
}

export const projectMemberApi = {
  getMembers: async (projectId: number | string): Promise<ProjectMember[]> => {
    const response = await apiClient.get<ApiResponse<ProjectMember[]>>(`/projects/${projectId}/members`);
    return unwrapResponse(response.data);
  },
  addMember: async (projectId: number | string, payload: { userId: number; projectRole: string }): Promise<ProjectMember> => {
    const response = await apiClient.post<ApiResponse<ProjectMember>>(`/projects/${projectId}/members`, payload);
    return unwrapResponse(response.data);
  },
  updateMember: async (projectId: number | string, userId: number | string, projectRole: string): Promise<ProjectMember> => {
    const response = await apiClient.put<ApiResponse<ProjectMember>>(`/projects/${projectId}/members/${userId}`, { userId: Number(userId), projectRole });
    return unwrapResponse(response.data);
  },
  removeMember: async (projectId: number | string, userId: number | string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/members/${userId}`);
  },
};
