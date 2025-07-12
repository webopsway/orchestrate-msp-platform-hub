import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ChangeService } from '@/services/changeService';
import type { Change } from '@/types/change';

// Re-export types for backward compatibility
export type { Change } from '@/types/change';

export const useChanges = () => {
  const { user, userProfile } = useAuth();
  const [changes, setChanges] = useState<Change[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChanges = useCallback(async () => {
    if (!user) {
      console.log('No user available, skipping changes load');
      setChanges([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await ChangeService.fetchChanges(user, userProfile);
      setChanges(data);
    } catch (error) {
      console.error('Error fetching changes:', error);
      setChanges([]);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile]);

  const createChange = useCallback(async (changeData: Partial<Change>) => {
    const success = await ChangeService.createChange(changeData, user, userProfile);
    if (success) {
      await fetchChanges();
    }
    return success;
  }, [user, userProfile, fetchChanges]);

  const updateChange = useCallback(async (id: string, updates: Partial<Change>) => {
    const success = await ChangeService.updateChange(id, updates, user);
    if (success) {
      await fetchChanges();
    }
    return success;
  }, [user, fetchChanges]);

  const deleteChange = useCallback(async (id: string) => {
    const success = await ChangeService.deleteChange(id, user);
    if (success) {
      await fetchChanges();
    }
    return success;
  }, [user, fetchChanges]);

  const assignChange = useCallback(async (id: string, assigneeId: string | null) => {
    const success = await ChangeService.assignChange(id, assigneeId, user);
    if (success) {
      await fetchChanges();
    }
    return success;
  }, [user, fetchChanges]);

  const updateStatus = useCallback(async (id: string, status: Change['status']) => {
    const success = await ChangeService.updateStatus(id, status, user);
    if (success) {
      await fetchChanges();
    }
    return success;
  }, [user, fetchChanges]);

  const approveChange = useCallback(async (id: string, approvedBy: string) => {
    const success = await ChangeService.approveChange(id, approvedBy, user);
    if (success) {
      await fetchChanges();
    }
    return success;
  }, [user, fetchChanges]);

  useEffect(() => {
    if (user) {
      fetchChanges();
    } else {
      setChanges([]);
      setLoading(false);
    }
  }, [user, userProfile, fetchChanges]);

  return {
    changes,
    loading,
    fetchChanges,
    createChange,
    updateChange,
    deleteChange,
    assignChange,
    updateStatus,
    approveChange
  };
}; 