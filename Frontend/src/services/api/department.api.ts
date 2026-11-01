import { apiClient, ApiResponse, unwrapResponse } from './client';
import { Department } from '../../types';

interface BackendDepartment {
  id: number;
  name: string;
  description?: string;
  managerId?: number;
  managerName?: string;
  memberCount?: number;
}

const mapDepartment = (department: BackendDepartment): Department => ({
  id: department.id,
  name: department.name,
  description: department.description,
  manager_id: department.managerId,
  managerName: department.managerName,
  memberCount: department.memberCount,
});

export const departmentApi = {
  getDepartments: async (): Promise<Department[]> => {
    const response = await apiClient.get<ApiResponse<BackendDepartment[] | { content?: BackendDepartment[] }>>('/departments', {
      params: { all: true, page: 0, size: 1000, sort: 'id,desc' },
    });
    const data = unwrapResponse(response.data);
    const departments = Array.isArray(data) ? data : data.content || [];
    return departments.map(mapDepartment);
  },
  getDepartment: async (id: number | string): Promise<Department> => {
    const response = await apiClient.get<ApiResponse<BackendDepartment>>(`/departments/${id}`);
    return mapDepartment(unwrapResponse(response.data));
  },
  createDepartment: async (payload: { name: string; description?: string; managerId?: number }): Promise<Department> => {
    const response = await apiClient.post<ApiResponse<BackendDepartment>>('/departments', payload);
    return mapDepartment(unwrapResponse(response.data));
  },
  updateDepartment: async (id: number | string, payload: { name: string; description?: string; managerId?: number }): Promise<Department> => {
    const response = await apiClient.put<ApiResponse<BackendDepartment>>(`/departments/${id}`, payload);
    return mapDepartment(unwrapResponse(response.data));
  },
  deleteDepartment: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/departments/${id}`);
  },
};
