import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { ApplicationDeployment, CreateApplicationDeploymentData } from '@/types/application';

export function useApplicationDeployments() {
  const [deployments, setDeployments] = useState<ApplicationDeployment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, userProfile } = useAuth();

  const fetchDeployments = async () => {
    if (!user || !userProfile) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('application_deployments')
        .select(`
          *,
          applications!inner(name, application_type),
          cloud_asset!inner(asset_name, asset_type, region)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching deployments:', error);
        toast.error('Erreur lors du chargement des déploiements');
        return;
      }

      setDeployments(data as ApplicationDeployment[] || []);
    } catch (error) {
      console.error('Error fetching deployments:', error);
      toast.error('Erreur lors du chargement des déploiements');
    } finally {
      setIsLoading(false);
    }
  };

  const createDeployment = async (data: CreateApplicationDeploymentData): Promise<boolean> => {
    if (!user || !userProfile?.default_team_id) {
      toast.error('Utilisateur non authentifié ou équipe non définie');
      return false;
    }

    try {
      const { error } = await supabase
        .from('application_deployments')
        .insert({
          ...data,
          team_id: userProfile.default_team_id,
          deployed_by: user.id
        });

      if (error) {
        console.error('Error creating deployment:', error);
        toast.error('Erreur lors de la création du déploiement');
        return false;
      }

      toast.success('Déploiement créé avec succès');
      await fetchDeployments();
      return true;
    } catch (error) {
      console.error('Error creating deployment:', error);
      toast.error('Erreur lors de la création du déploiement');
      return false;
    }
  };

  const updateDeployment = async (id: string, data: Partial<CreateApplicationDeploymentData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('application_deployments')
        .update(data)
        .eq('id', id);

      if (error) {
        console.error('Error updating deployment:', error);
        toast.error('Erreur lors de la mise à jour du déploiement');
        return false;
      }

      toast.success('Déploiement mis à jour avec succès');
      await fetchDeployments();
      return true;
    } catch (error) {
      console.error('Error updating deployment:', error);
      toast.error('Erreur lors de la mise à jour du déploiement');
      return false;
    }
  };

  const deleteDeployment = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('application_deployments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting deployment:', error);
        toast.error('Erreur lors de la suppression du déploiement');
        return false;
      }

      toast.success('Déploiement supprimé avec succès');
      await fetchDeployments();
      return true;
    } catch (error) {
      console.error('Error deleting deployment:', error);
      toast.error('Erreur lors de la suppression du déploiement');
      return false;
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, [user, userProfile]);

  return {
    deployments,
    isLoading,
    fetchDeployments,
    createDeployment,
    updateDeployment,
    deleteDeployment
  };
}