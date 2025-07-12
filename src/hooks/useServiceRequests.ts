import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ServiceRequestService } from '@/services/serviceRequestService';
import type { ServiceRequest } from '@/types/serviceRequest';
import { supabase } from '@/integrations/supabase/client';

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
      let query = supabase
        .from('itsm_service_requests')
        .select(`
          *,
          profiles!itsm_service_requests_requested_by_fkey(first_name, last_name, email),
          assigned_profiles:profiles!itsm_service_requests_assigned_to_fkey(first_name, last_name, email)
        `);

      // Filter by team if not MSP admin
      if (!userProfile?.is_msp_admin && userProfile?.default_team_id) {
        query = query.eq('team_id', userProfile.default_team_id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching service requests:', error);
        return;
      }

      setRequests((data || []) as ServiceRequest[]);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile]);

  const createRequest = useCallback(async (requestData: Partial<ServiceRequest>) => {
    if (!user || !userProfile?.default_team_id) return false;
    
    const { data, error } = await supabase
      .from('itsm_service_requests')
      .insert({
        ...requestData,
        requested_by: user.id,
        team_id: userProfile.default_team_id
      } as any);

    if (error) {
      console.error('Error creating service request:', error);
      return false;
    }
    
    await fetchRequests();
    return true;
  }, [user, userProfile, fetchRequests]);

  const updateRequest = useCallback(async (id: string, updates: Partial<ServiceRequest>) => {
    if (!user) return false;
    
    const { error } = await supabase
      .from('itsm_service_requests')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating service request:', error);
      return false;
    }
    
    await fetchRequests();
    return true;
  }, [user, fetchRequests]);

  const deleteRequest = useCallback(async (id: string) => {
    if (!user) return false;
    
    const { error } = await supabase
      .from('itsm_service_requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting service request:', error);
      return false;
    }
    
    await fetchRequests();
    return true;
  }, [user, fetchRequests]);

  const assignRequest = useCallback(async (id: string, assigneeId: string | null) => {
    if (!user) return false;
    
    const { error } = await supabase
      .from('itsm_service_requests')
      .update({ assigned_to: assigneeId })
      .eq('id', id);

    if (error) {
      console.error('Error assigning service request:', error);
      return false;
    }
    
    await fetchRequests();
    return true;
  }, [user, fetchRequests]);

  const updateStatus = useCallback(async (id: string, status: ServiceRequest['status']) => {
    if (!user) return false;
    
    const { error } = await supabase
      .from('itsm_service_requests')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating service request status:', error);
      return false;
    }
    
    await fetchRequests();
    return true;
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