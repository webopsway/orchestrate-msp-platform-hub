import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ServiceRequestService } from '@/services/serviceRequestService';
import type { ServiceRequest } from '@/types/serviceRequest';
import { supabase } from '@/integrations/supabase/client';

// Re-export types for backward compatibility
export type { ServiceRequest } from '@/types/serviceRequest';

export const useServiceRequests = () => {
  const { user, sessionContext } = useAuth();
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
      // Check if user is MSP admin directly from auth context
      const { data: profile } = await supabase.from('profiles')
        .select('is_msp_admin, default_organization_id, default_team_id')
        .eq('id', user.id)
        .single();
      
      // For MSP admins, create a minimal session context if none exists
      let workingSessionContext = sessionContext;
      if (!workingSessionContext && profile?.is_msp_admin) {
        console.log('Creating temporary MSP session context for service requests loading');
        workingSessionContext = {
          current_organization_id: profile.default_organization_id,
          current_team_id: profile.default_team_id,
          is_msp: true
        };
      }

      const data = await ServiceRequestService.fetchRequests(user, workingSessionContext);
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
    if (user) {
      fetchRequests();
    } else {
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