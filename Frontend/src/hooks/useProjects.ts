import { useState, useEffect, useCallback } from 'react';
import { Project, GlobalFilterParams } from '../types';
import { projectApi } from '../services/api/project.api';
import { ProjectFormData } from '../schema/project.schema';

export const useGetProjects = (params?: Partial<GlobalFilterParams>) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await projectApi.getProjects(params);
      setProjects(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải danh sách dự án');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { projects, isLoading, error, refetch: fetchProjects, setProjects };
};

export const useCreateProject = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProject = async (data: ProjectFormData): Promise<Project> => {
    setIsCreating(true);
    setError(null);
    try {
      const result = await projectApi.createProject(data);
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi tạo dự án';
      setError(msg);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  return { createProject, isCreating, error };
};

export const useUpdateProject = () => {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateProject = async (id: number | string, data: Partial<ProjectFormData>): Promise<Project> => {
    setIsUpdating(true);
    try {
      return await projectApi.updateProject(id, data);
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateProject, isUpdating };
};

export const useDeleteProject = () => {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteProject = async (id: number | string): Promise<boolean> => {
    setIsDeleting(true);
    try {
      await projectApi.deleteProject(id);
      return true;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteProject, isDeleting };
};
