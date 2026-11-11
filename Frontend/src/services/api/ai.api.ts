import { apiClient, ApiResponse, unwrapResponse } from './client';

export interface AiPlanItem {
  title: string;
  description?: string;
  priority?: string;
  estimatedDays?: number;
  suggestedRole?: string;
  dependencyTaskTitles?: string[];
}

export interface AiProjectPlan {
  projectName: string;
  executiveSummary: string;
  estimatedTotalDays: number;
  phases: Array<{
    phaseName: string;
    durationDays: number;
    description: string;
  }>;
  suggestedTasks: AiPlanItem[];
  recommendedRoles: string[];
  potentialRisks: string[];
}

export interface GenerateProjectPlanRequest {
  projectName: string;
  description: string;
  estimatedDurationDays?: number;
  targetDeliverables?: string[];
  availableRoles?: string[];
}

interface BackendPlanResponse {
  projectName?: string;
  executiveSummary?: string;
  estimatedTotalDays?: number;
  phases?: Array<{
    phaseName?: string;
    durationDays?: number;
    description?: string;
  }>;
  suggestedTasks?: Array<{
    title?: string;
    description?: string;
    priority?: string;
    estimatedDays?: number;
    suggestedRole?: string;
    dependencyTaskTitles?: string[];
  }>;
  recommendedRoles?: string[];
  potentialRisks?: string[];
}

export const aiApi = {
  generateProjectPlan: async (payload: GenerateProjectPlanRequest): Promise<AiProjectPlan> => {
    const response = await apiClient.post<ApiResponse<BackendPlanResponse>>(
      '/ai/project-plan',
      payload,
    );
    const data = unwrapResponse(response.data);
    const phases = (data.phases || []).map((phase) => ({
      phaseName: phase.phaseName || 'Giai đoạn dự án',
      durationDays: phase.durationDays ?? 0,
      description: phase.description || '',
    }));
    const suggestedTasks = (data.suggestedTasks || []).map((task) => ({
      title: task.title || 'Công việc đề xuất',
      description: task.description || '',
      priority: task.priority || '',
      estimatedDays: task.estimatedDays ?? 0,
      suggestedRole: task.suggestedRole || '',
      dependencyTaskTitles: task.dependencyTaskTitles || [],
    }));
    if (phases.length === 0 && suggestedTasks.length === 0) {
      throw new Error('API không trả về giai đoạn hoặc công việc đề xuất.');
    }
    return {
      projectName: data.projectName || payload.projectName,
      executiveSummary: data.executiveSummary || '',
      estimatedTotalDays: data.estimatedTotalDays ?? 0,
      phases,
      suggestedTasks,
      recommendedRoles: data.recommendedRoles || [],
      potentialRisks: data.potentialRisks || [],
    };
  },
};
