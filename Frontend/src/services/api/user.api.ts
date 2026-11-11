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
  dateOfBirth?: string;
  phone?: string;
  address?: string;
  specialization?: string;
  skills?: string[];
  education?: string;
  experienceYears?: number;
  seniority?: string;
  salary?: number;
  cvFileName?: string;
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
    date_of_birth: user.dateOfBirth,
    phone: user.phone,
    address: user.address,
    specialization: user.specialization,
    skills: user.skills || [],
    education: user.education,
    experience_years: user.experienceYears,
    seniority: user.seniority,
    salary: user.salary,
    cv_file_name: user.cvFileName,
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
    const current = await userApi.getUsers();
    const user = current.find((item) => String(item.id) === String(id));
    if (!user) throw new Error('Không tìm thấy nhân sự để cập nhật phân quyền.');
    const response = await apiClient.put<ApiResponse<BackendUser>>(`/users/${id}`, {
      fullName: payload.fullName ?? user.full_name ?? user.name,
      email: payload.email ?? user.email,
      departmentId: payload.departmentId ?? (Number(user.departmentId || user.department_id) || undefined),
      systemRole: payload.systemRole,
    });
    return mapUser(unwrapResponse(response.data));
  },
  deleteUser: async (id: number | string): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<unknown> | undefined>(`/users/${id}`);
    if (response.data && 'success' in response.data) {
      unwrapResponse(response.data);
    }
  },
};
