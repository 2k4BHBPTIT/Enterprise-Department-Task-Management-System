import { apiClient, ApiResponse, unwrapResponse } from './client';
import { User, Role } from '../../types';

interface BackendUser {
  id: number;
  fullName: string;
  email: string;
  departmentId?: number;
  departmentName?: string;
  systemRole?: string;
  status?: string;
}

const mapUser = (user: BackendUser): User => {
  const role = (user.systemRole || 'EMPLOYEE') as Role;
  return {
    id: user.id,
    full_name: user.fullName,
    name: user.fullName,
    email: user.email,
    department_id: user.departmentId ?? 0,
    departmentId: user.departmentId ?? 0,
    department_name: user.departmentName,
    departmentName: user.departmentName,
    system_role: role,
    role,
    status: user.status || 'ACTIVE',
  };
};

export const userApi = {
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<ApiResponse<{ content?: BackendUser[] } | BackendUser[]>>('/users', {
      params: { page: 0, size: 1000, sort: 'id,desc' },
    });
    const data = unwrapResponse(response.data);
    return (Array.isArray(data) ? data : data.content || []).map(mapUser);
  },
  createUser: async (payload: { fullName: string; email: string; password: string; departmentId?: number; systemRole: string }): Promise<User> => {
    const response = await apiClient.post<ApiResponse<BackendUser>>('/users', payload);
    return mapUser(unwrapResponse(response.data));
  },
  updateUser: async (id: number | string, payload: Partial<{ fullName: string; email: string; departmentId: number; systemRole: string }>): Promise<User> => {
    const response = await apiClient.put<ApiResponse<BackendUser>>(`/users/${id}`, payload);
    return mapUser(unwrapResponse(response.data));
  },
  deleteUser: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
