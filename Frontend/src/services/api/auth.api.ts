import { apiClient, ApiResponse, unwrapResponse } from './client';

export interface LoginResponse {
  token?: string;
  accessToken?: string;
  tokenType?: string;
  userId: number;
  fullName: string;
  email: string;
  systemRole: string;
  departmentId?: number;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', { email, password });
    return unwrapResponse(response.data);
  },
  getCurrentUser: async (): Promise<LoginResponse> => {
    const response = await apiClient.get<ApiResponse<LoginResponse>>('/auth/me');
    return unwrapResponse(response.data);
  },
};
