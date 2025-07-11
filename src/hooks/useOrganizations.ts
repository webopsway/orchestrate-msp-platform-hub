import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Organization {
  id: string;
  msp_id: string;
  name: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  subscription_plan?: string;
  subscription_status?: 'active' | 'expired' | 'cancelled';
  user_count: number;
  team_count: number;
  created_at: string;
  updated_at: string;
  metadata?: {
    industry?: string;
    size?: string;
    contact_person?: string;
    [key: string]: any;
  };
}

export interface UseOrganizationsReturn {
  organizations: Organization[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refresh: () => Promise<void>;
  createOrganization: (data: any) => Promise<boolean>;
  updateOrganization: (id: string, data: any) => Promise<boolean>;
  deleteOrganization: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export function useOrganizations(): UseOrganizationsReturn {
  const { sessionContext } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const loadOrganizations = useCallback(async () => {
    if (!sessionContext?.current_team_id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Récupérer toutes les organisations sans pagination pour éviter le scintillement
      const { data: orgsData, error: orgsError, count } = await supabase
        .from('organizations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;
      
      // Transform data to match interface in one go
      const transformedOrgs: Organization[] = (orgsData || []).map(org => ({
        id: org.id,
        msp_id: org.parent_organization_id || sessionContext.current_team_id,
        name: org.name,
        status: 'active' as const,
        user_count: 0,
        team_count: 0,
        created_at: org.created_at,
        updated_at: org.updated_at || org.created_at,
        description: (org.metadata as any)?.description || '',
        website: (org.metadata as any)?.website || '',
        email: (org.metadata as any)?.email || '',
        phone: (org.metadata as any)?.phone || '',
        address: (org.metadata as any)?.address || {},
        subscription_plan: (org.metadata as any)?.subscription_plan || 'basic',
        subscription_status: (org.metadata as any)?.subscription_status || 'active',
        metadata: (org.metadata as any) || {}
      }));
      
      setOrganizations(transformedOrgs);
      setTotalCount(count || 0);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du chargement des organisations';
      setError(errorMessage);
      console.error('Error loading organizations:', err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [sessionContext?.current_team_id]);

  const createOrganization = useCallback(async (data: any): Promise<boolean> => {
    if (!sessionContext?.current_team_id) return false;

    try {
      const orgData = {
        name: data.name,
        type: 'client' as const,
        metadata: {
          description: data.description,
          website: data.website,
          email: data.email,
          phone: data.phone,
          address: {
            street: data.street,
            city: data.city,
            state: data.state,
            postal_code: data.postal_code,
            country: data.country
          },
          subscription_plan: data.subscription_plan || 'basic',
          subscription_status: 'active',
          industry: data.industry,
          size: data.size,
          contact_person: data.contact_person
        }
      };
      
      const { error } = await supabase
        .from('organizations')
        .insert([orgData]);

      if (error) throw error;

      toast.success('Organisation créée avec succès');
      await loadOrganizations(); // Reload all data
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la création';
      toast.error(errorMessage);
      console.error('Error creating organization:', err);
      return false;
    }
  }, [sessionContext?.current_team_id, loadOrganizations]);

  const updateOrganization = useCallback(async (id: string, data: any): Promise<boolean> => {
    try {
      const updateData = {
        name: data.name,
        updated_at: new Date().toISOString(),
        metadata: {
          description: data.description,
          website: data.website,
          email: data.email,
          phone: data.phone,
          address: {
            street: data.street,
            city: data.city,
            state: data.state,
            postal_code: data.postal_code,
            country: data.country
          },
          subscription_plan: data.subscription_plan,
          industry: data.industry,
          size: data.size,
          contact_person: data.contact_person
        }
      };

      const { error } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Organisation mise à jour avec succès');
      await loadOrganizations(); // Reload all data
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la mise à jour';
      toast.error(errorMessage);
      console.error('Error updating organization:', err);
      return false;
    }
  }, [loadOrganizations]);

  const deleteOrganization = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Organisation supprimée');
      await loadOrganizations(); // Reload all data
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la suppression';
      toast.error(errorMessage);
      console.error('Error deleting organization:', err);
      return false;
    }
  }, [loadOrganizations]);

  const refresh = useCallback(async () => {
    await loadOrganizations();
  }, [loadOrganizations]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  return {
    organizations,
    loading,
    error,
    totalCount,
    refresh,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    clearError
  };
}