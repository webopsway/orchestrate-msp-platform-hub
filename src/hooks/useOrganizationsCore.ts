import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { OrganizationService } from "@/services/organizationService";
import type { Organization, OrganizationFormData, UseOrganizationsReturn } from "@/types/organization";
import { supabase } from "@/integrations/supabase/client";

export function useOrganizations(): UseOrganizationsReturn {
  const { user, sessionContext } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const loadOrganizations = useCallback(async () => {
    if (!user) {
      console.log('No user available, skipping organizations load');
      setOrganizations([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      
      // Check if user is MSP admin directly from auth context
      const { data: profile } = await supabase.from('profiles')
        .select('is_msp_admin, default_organization_id, default_team_id')
        .eq('id', user.id)
        .single();
      
      // For MSP admins, create a minimal session context if none exists
      let workingSessionContext = sessionContext;
      if (!workingSessionContext && profile?.is_msp_admin) {
        console.log('Creating temporary MSP session context for organizations loading');
        workingSessionContext = {
          current_organization_id: profile.default_organization_id,
          current_team_id: profile.default_team_id,
          is_msp: true
        };
      }
      
      const { organizations: orgs, count } = await OrganizationService.loadAll(workingSessionContext);
      
      setOrganizations(orgs);
      setTotalCount(count);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du chargement des organisations';
      setError(errorMessage);
      console.error('Error loading organizations:', err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, sessionContext?.current_team_id, sessionContext?.is_msp]);

  const createOrganization = useCallback(async (data: OrganizationFormData): Promise<boolean> => {
    try {
      await OrganizationService.create(data);
      await loadOrganizations();
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la création';
      toast.error(errorMessage);
      console.error('Error creating organization:', err);
      return false;
    }
  }, [loadOrganizations]);

  const updateOrganization = useCallback(async (id: string, data: OrganizationFormData): Promise<boolean> => {
    try {
      await OrganizationService.update(id, data);
      await loadOrganizations();
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
      await OrganizationService.delete(id);
      await loadOrganizations();
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
    if (user) {
      loadOrganizations();
    }
  }, [user, loadOrganizations]);

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