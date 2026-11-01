import { useState, useEffect, useCallback } from 'react';
import { EmailNotificationConfig } from '../types';
import { emailApi } from '../services/api/email.api';
import { EmailConfigFormData } from '../schema/email-config.schema';

export const useGetEmailConfig = () => {
  const [config, setConfig] = useState<EmailNotificationConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await emailApi.getConfig();
      setConfig(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi tải cấu hình email');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return { config, isLoading, error, refetch: fetchConfig };
};

export const useUpdateEmailConfig = () => {
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const updateConfig = async (data: EmailConfigFormData): Promise<EmailNotificationConfig> => {
    setIsUpdating(true);
    try {
      return await emailApi.updateConfig(data);
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateConfig, isUpdating };
};
