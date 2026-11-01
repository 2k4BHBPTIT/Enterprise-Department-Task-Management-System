import { apiClient, ApiResponse, unwrapResponse } from './client';
import { Task, TaskStatus, EisenhowerQuadrant, GlobalFilterParams } from '../../types';
import { TaskFormData } from '../../schema/task.schema';
import { ReassignFormData } from '../../schema/reassign.schema';

interface BackendTask {
  id: number;
  projectId: number;
  projectName?: string;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  assigneeId?: number;
  assigneeName?: string;
  deadline?: string;
  followers?: Array<{ id: number }>;
  overdue?: boolean;
  dependencies?: Array<{ id: number }>;
  taskType?: string;
  type?: string;
  departmentId?: number;
}

const mapTask = (task: BackendTask): Task => {
  const priority = (task.priority || 'MEDIUM') as Task['priority'];
  const status = (task.status || 'TODO') as TaskStatus;
  const rawTaskType = task.taskType || task.type;
  const taskType: Task['taskType'] =
    rawTaskType && ['PLANNING', 'DEVELOPMENT', 'DESIGN', 'MARKETING', 'TESTING', 'OTHER'].includes(rawTaskType)
      ? rawTaskType as Task['taskType']
      : 'OTHER';
  const quadrant: EisenhowerQuadrant =
    priority === 'URGENT' ? 'Q1' : priority === 'HIGH' ? 'Q2' : 'Q4';

  return {
    id: task.id,
    project_id: task.projectId,
    projectId: task.projectId,
    project_name: task.projectName,
    projectName: task.projectName,
    title: task.title,
    description: task.description || '',
    priority,
    status,
    task_type: taskType,
    taskType,
    is_important: priority === 'HIGH' || priority === 'URGENT',
    isImportant: priority === 'HIGH' || priority === 'URGENT',
    is_urgent: priority === 'URGENT',
    isUrgent: priority === 'URGENT',
    quadrant,
    progress_percent: status === 'COMPLETED' ? 100 : 0,
    progressPercent: status === 'COMPLETED' ? 100 : 0,
    assignee_id: task.assigneeId ?? 0,
    assigneeId: task.assigneeId ?? 0,
    assignee_name: task.assigneeName,
    assigneeName: task.assigneeName,
    follower_ids: task.followers?.map((user) => user.id) || [],
    followerIds: task.followers?.map((user) => String(user.id)) || [],
    dependencyIds: task.dependencies?.map((dependency) => String(dependency.id)) || [],
    deadline: task.deadline || '',
    dueDate: task.deadline || '',
    overdueDays: task.overdue ? 1 : 0,
    overdue_days: task.overdue ? 1 : 0,
    department_id: task.departmentId,
    departmentId: task.departmentId,
  };
};

const unwrapTask = (response: ApiResponse<BackendTask>): Task =>
  mapTask(unwrapResponse(response));

const toBackendTask = (data: Partial<TaskFormData>) => ({
  projectId: data.projectId ? Number(data.projectId) : undefined,
  title: data.title,
  description: data.description || undefined,
  priority: data.priority,
  status: data.status,
  assigneeId: data.assigneeId ? Number(data.assigneeId) : undefined,
  deadline: data.dueDate ? `${data.dueDate}T23:59:59` : undefined,
  followerUserIds: data.followerIds?.map(Number),
  dependencyTaskIds: data.dependencyIds?.map(Number),
});

export const taskApi = {
  getTasks: async (params?: Partial<GlobalFilterParams>): Promise<Task[]> => {
    const requestedProjectId = params?.projectId && params.projectId !== 'ALL'
      ? Number(params.projectId)
      : undefined;
    let projectIds = requestedProjectId ? [requestedProjectId] : [];

    if (!requestedProjectId) {
      const projectsResponse = await apiClient.get<ApiResponse<{ content?: Array<{ id: number }> }>>('/projects', {
        params: { page: 0, size: 1000, sort: 'id,desc' },
      });
      const projectsData = unwrapResponse(projectsResponse.data);
      projectIds = projectsData.content?.map((project) => project.id) || [];
    }

    const responses = await Promise.all(projectIds.map((projectId) =>
      apiClient.get<ApiResponse<{ content?: BackendTask[] } | BackendTask[]>>('/tasks', {
        params: {
          projectId,
          status: params?.status && params.status !== 'ALL' ? params.status : undefined,
          listOnly: true,
          page: 0,
          size: 1000,
          sort: 'id,desc',
        },
      })
    ));
    const tasks = responses.flatMap((response) => {
      const data = unwrapResponse(response.data);
      return Array.isArray(data) ? data : data.content || [];
    });
    const term = params?.searchTerm?.toLowerCase();

    return tasks
      .map(mapTask)
      .filter((task) => !term || `${task.title} ${task.assigneeName || ''} ${task.projectName || ''}`.toLowerCase().includes(term))
      .filter((task) => !params?.assigneeId || params.assigneeId === 'ALL' || String(task.assigneeId) === params.assigneeId)
      .filter((task) => !params?.priority || params.priority === 'ALL' || task.priority === params.priority)
      .filter((task) => !params?.status || params.status === 'ALL' || task.status === params.status)
      .filter((task) => !params?.projectId || params.projectId === 'ALL' || String(task.projectId) === String(params.projectId))
      .filter((task) => !params?.departmentId || params.departmentId === 'ALL' || String(task.departmentId ?? task.department_id) === String(params.departmentId))
      .filter((task) => !params?.taskType || params.taskType === 'ALL' || task.taskType === params.taskType)
      .filter((task) => !params?.fromDate || String(task.deadline || task.dueDate || '').slice(0, 10) >= params.fromDate)
      .filter((task) => !params?.toDate || String(task.deadline || task.dueDate || '').slice(0, 10) <= params.toDate)
      .filter((task) => !params?.onlyOverdue || task.overdueDays! > 0 || task.status === 'OVERDUE');
  },

  createTask: async (data: TaskFormData): Promise<Task> => {
    const response = await apiClient.post<ApiResponse<BackendTask>>('/tasks', toBackendTask(data));
    return unwrapTask(response.data);
  },

  updateTask: async (id: number | string, data: Partial<TaskFormData>): Promise<Task> => {
    const response = await apiClient.put<ApiResponse<BackendTask>>(`/tasks/${id}`, toBackendTask(data));
    return unwrapTask(response.data);
  },

  reassignTask: async (data: ReassignFormData): Promise<Task> => {
    const response = await apiClient.patch<ApiResponse<BackendTask>>(`/tasks/${data.taskId}/assign`, {
      assigneeId: Number(data.newAssigneeId),
      note: data.reason || undefined,
    });
    return unwrapTask(response.data);
  },

  updateTaskStatus: async (taskId: number | string, status: TaskStatus): Promise<Task> => {
    const response = await apiClient.patch<ApiResponse<BackendTask>>(`/tasks/${taskId}/status`, { status });
    return unwrapTask(response.data);
  },

  deleteTask: async (id: number | string): Promise<{ success: boolean }> => {
    await apiClient.delete(`/tasks/${id}`);
    return { success: true };
  },
};
