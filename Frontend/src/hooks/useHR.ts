import { useState, useEffect, useCallback } from 'react';
import { HRScorecardRecord, Task } from '../types';
import { hrApi } from '../services/api/hr.api';

export const useGetHRScorecards = () => {
  const [scorecards, setScorecards] = useState<HRScorecardRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScorecards = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await hrApi.getScorecards();
      setScorecards(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi tải bảng điểm nhân sự');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScorecards();
  }, [fetchScorecards]);

  return { scorecards, isLoading, error, refetch: fetchScorecards };
};

export const useGetHRViolations = () => {
  const [violations, setViolations] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchViolations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await hrApi.getViolations();
      setViolations(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi tải danh sách vi phạm');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchViolations();
  }, [fetchViolations]);

  return { violations, isLoading, error, refetch: fetchViolations };
};
