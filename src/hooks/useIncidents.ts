import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { IncidentService } from '@/services/incidentService';
import type { Incident } from '@/types/incident';

// Re-export types for backward compatibility
export type { Incident } from '@/types/incident';

export const useIncidents = () => {
  const { user, userProfile } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = useCallback(async () => {
    if (!user) {
      console.log('No user available, skipping incidents load');
      setIncidents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await IncidentService.fetchIncidents(user, userProfile);
      setIncidents(data);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile]);

  const createIncident = useCallback(async (incidentData: Partial<Incident>) => {
    const success = await IncidentService.createIncident(incidentData, user, userProfile);
    if (success) {
      await fetchIncidents();
    }
    return success;
  }, [user, userProfile, fetchIncidents]);

  const updateIncident = useCallback(async (id: string, updates: Partial<Incident>) => {
    const success = await IncidentService.updateIncident(id, updates, user);
    if (success) {
      await fetchIncidents();
    }
    return success;
  }, [user, fetchIncidents]);

  const deleteIncident = useCallback(async (id: string) => {
    const success = await IncidentService.deleteIncident(id, user);
    if (success) {
      await fetchIncidents();
    }
    return success;
  }, [user, fetchIncidents]);

  const assignIncident = useCallback(async (id: string, assigneeId: string | null) => {
    const success = await IncidentService.assignIncident(id, assigneeId, user);
    if (success) {
      await fetchIncidents();
    }
    return success;
  }, [user, fetchIncidents]);

  const updateStatus = useCallback(async (id: string, status: Incident['status']) => {
    const success = await IncidentService.updateStatus(id, status, user);
    if (success) {
      await fetchIncidents();
    }
    return success;
  }, [user, fetchIncidents]);

  useEffect(() => {
    if (user) {
      fetchIncidents();
    } else {
      setIncidents([]);
      setLoading(false);
    }
  }, [user, userProfile, fetchIncidents]);

  return {
    incidents,
    loading,
    fetchIncidents,
    createIncident,
    updateIncident,
    deleteIncident,
    assignIncident,
    updateStatus
  };
}; 