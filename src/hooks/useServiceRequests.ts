import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ServiceRequestService } from '@/services/serviceRequestService';
import type { ServiceRequest } from '@/types/serviceRequest';

// Re-export types for backward compatibility
export type { ServiceRequest } from '@/types/serviceRequest';

export const useServiceRequests = () => {
  const { user, userProfile } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!user) {
      console.log('No user available, skipping service requests load');
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await ServiceRequestService.fetchRequests(user, userProfile);
      setRequests(data);
    } catch (error) {
      console.error('Error fetching service requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile]);

  const createRequest = useCallback(async (requestData: Partial<ServiceRequest>) => {
    const success = await ServiceRequestService.createRequest(requestData, user, userProfile);
    if (success) {
      await fetchRequests();
    }
    return success;
  }, [user, userProfile, fetchRequests]);

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
    if (user) {
      fetchRequests();
    } else {
      setRequests([]);
      setLoading(false);
    }
  }, [user, userProfile, fetchRequests]);

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