import { apiClient, ApiResponse, unwrapResponse } from './client';

export interface DashboardOverview {
  [key: string]: unknown;
}

export const dashboardApi = {
  getOverview: async (): Promise<DashboardOverview> => {
    const response = await apiClient.get<ApiResponse<DashboardOverview>>('/dashboard/overview');
    return unwrapResponse(response.data);
  },
  getDepartmentWorkload: async (): Promise<Array<Record<string, unknown>>> => {
    const response = await apiClient.get<ApiResponse<Array<Record<string, unknown>>>>('/dashboard/department-workload');
    return unwrapResponse(response.data);
  },
};
