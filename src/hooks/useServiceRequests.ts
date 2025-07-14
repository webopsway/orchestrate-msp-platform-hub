import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ServiceRequestService } from '@/services/serviceRequestService';
import type { ServiceRequest } from '@/types/serviceRequest';
import { supabase } from '@/integrations/supabase/client';
import type { CloudAssetConfiguration } from '@/integrations/supabase/types';
import { useRBAC } from '@/hooks/useRBAC';
import { RoleService } from '@/services/roleService';

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

export class CloudAssetConfigurationService {
  static async list(teamId: string): Promise<CloudAssetConfiguration[]> {
    const { data, error } = await supabase
      .from('cloud_asset_configurations')
      .select('*')
      .eq('team_id', teamId)
      .order('collected_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async create(payload: Partial<CloudAssetConfiguration>) {
    const { data, error } = await supabase
      .from('cloud_asset_configurations')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async update(id: string, payload: Partial<CloudAssetConfiguration>) {
    const { data, error } = await supabase
      .from('cloud_asset_configurations')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async remove(id: string) {
    const { error } = await supabase
      .from('cloud_asset_configurations')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
}

import { supabase } from '@/integrations/supabase/client';
import type { Role } from '@/integrations/supabase/types';

export class RoleService {
  static async list(): Promise<Role[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('display_name', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async get(id: string): Promise<Role | null> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  static async create(payload: Partial<Role>) {
    const { data, error } = await supabase
      .from('roles')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async update(id: string, payload: Partial<Role>) {
    const { data, error } = await supabase
      .from('roles')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async remove(id: string) {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
}

const { checkPermission } = useRBAC();

if (checkPermission('roles', 'create')) {
  // Afficher bouton "Créer un rôle"
}

// Pour créer un rôle
const handleCreateRole = async (payload) => {
  try {
    await RoleService.create(payload);
    // Rafraîchir la liste, afficher un toast, etc.
  } catch (e) {
    // Gérer l’erreur
  }
};