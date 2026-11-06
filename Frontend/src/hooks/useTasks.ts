import { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus, GlobalFilterParams } from '../types';
import { taskApi } from '../services/api/task.api';
import { TaskFormData } from '../schema/task.schema';
import { ReassignFormData } from '../schema/reassign.schema';

export const useGetTasks = (params?: Partial<GlobalFilterParams>) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await taskApi.getTasks(params);
      setTasks(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải công việc');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return { tasks, isLoading, error, refetch: fetchTasks, setTasks };
};

export const useCreateTask = () => {
  const [isCreating, setIsCreating] = useState(false);

  const createTask = async (data: TaskFormData): Promise<Task> => {
    setIsCreating(true);
    try {
      return await taskApi.createTask(data);
    } finally {
      setIsCreating(false);
    }
  };

  return { createTask, isCreating };
};

export const useUpdateTask = () => {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateTask = async (id: number | string, data: Partial<TaskFormData> & { progressPercent?: number }): Promise<Task> => {
    setIsUpdating(true);
    try {
      return await taskApi.updateTask(id, data);
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateTask, isUpdating };
};

export const useDeleteTask = () => {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteTask = async (id: number | string): Promise<boolean> => {
    setIsDeleting(true);
    try {
      await taskApi.deleteTask(id);
      return true;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteTask, isDeleting };
};

export const useReassignTask = () => {
  const [isReassigning, setIsReassigning] = useState(false);

  const reassignTask = async (data: ReassignFormData): Promise<Task> => {
    setIsReassigning(true);
    try {
      return await taskApi.reassignTask(data);
    } finally {
      setIsReassigning(false);
    }
  };

  return { reassignTask, isReassigning };
};

export const useUpdateTaskStatus = () => {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatus = async (taskId: number | string, status: TaskStatus): Promise<Task> => {
    setIsUpdating(true);
    try {
      return await taskApi.updateTaskStatus(taskId, status);
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateStatus, isUpdating };
};
