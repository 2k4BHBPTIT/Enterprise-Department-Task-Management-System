import { apiClient, ApiResponse, unwrapResponse } from './client';

export interface AiPlanItem {
  title: string;
  phase: string;
  duration: string;
  output: string;
}

export interface GenerateProjectPlanRequest {
  description: string;
  projectName?: string;
  documentName?: string;
  documentContent?: string;
}

export const aiApi = {
  generateProjectPlan: async (payload: GenerateProjectPlanRequest): Promise<AiPlanItem[]> => {
    const response = await apiClient.post<ApiResponse<AiPlanItem[] | { plan: AiPlanItem[] }>>(
      '/ai/project-plan',
      payload,
    );
    const data = unwrapResponse(response.data);
    return Array.isArray(data) ? data : data.plan;
  },
};
