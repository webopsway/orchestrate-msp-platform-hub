import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { OrganizationService } from "@/services/organizationService";
import type { Organization, OrganizationFormData, UseOrganizationsReturn } from "@/types/organization";

export function useOrganizations(): UseOrganizationsReturn {
  const { sessionContext } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const loadOrganizations = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      
      const { organizations: orgs, count } = await OrganizationService.loadAll(sessionContext);
      
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
  }, [sessionContext?.current_team_id]);

  const createOrganization = useCallback(async (data: OrganizationFormData): Promise<boolean> => {
    if (!sessionContext?.current_team_id) return false;

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
  }, [sessionContext?.current_team_id, loadOrganizations]);

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