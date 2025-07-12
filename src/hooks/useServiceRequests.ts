import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ServiceRequestService } from '@/services/serviceRequestService';
import type { ServiceRequest } from '@/types/serviceRequest';

// Re-export types for backward compatibility
export type { ServiceRequest } from '@/types/serviceRequest';

export const useServiceRequests = () => {
  const { user, sessionContext } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ServiceRequestService.fetchRequests(user, sessionContext);
      setRequests(data);
    } finally {
      setLoading(false);
    }
  }, [user, sessionContext?.current_team_id, sessionContext?.is_msp]);

  const createRequest = useCallback(async (requestData: Partial<ServiceRequest>) => {
    const success = await ServiceRequestService.createRequest(requestData, user, sessionContext);
    if (success) {
      await fetchRequests();
    }
    return success;
  }, [user, sessionContext, fetchRequests]);

  const updateRequest = useCallback(async (id: string, updates: Partial<ServiceRequest>) => {
    const success = await ServiceRequestService.updateRequest(id, updates, user);
    if (success) {
      await fetchRequests();
    }
    return success;
  }, [user, fetchRequests]);

  const deleteRequest = useCallback(async (id: string) => {
    const success = await ServiceRequestService.deleteRequest(id, user);
    if (success) {
      await fetchRequests();
    }
    return success;
  }, [user, fetchRequests]);

  const assignRequest = useCallback(async (id: string, assigneeId: string | null) => {
    const success = await ServiceRequestService.assignRequest(id, assigneeId, user);
    if (success) {
      await fetchRequests();
    }
    return success;
  }, [user, fetchRequests]);

  const updateStatus = useCallback(async (id: string, status: ServiceRequest['status']) => {
    const success = await ServiceRequestService.updateStatus(id, status, user);
    if (success) {
      await fetchRequests();
    }
    return success;
  }, [user, fetchRequests]);

  useEffect(() => {
    if (user && (sessionContext?.current_team_id || sessionContext?.is_msp)) {
      fetchRequests();
    } else if (!user) {
      setRequests([]);
      setLoading(false);
    }
  }, [user, sessionContext?.current_team_id, sessionContext?.is_msp, fetchRequests]);

  return {
    requests,
    loading,
    fetchRequests,
    createRequest,
    updateRequest,
    deleteRequest,
    assignRequest,
    updateStatus
  };
};