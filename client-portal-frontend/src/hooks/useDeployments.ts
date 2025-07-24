import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentContext } from '@/hooks/useCurrentContext';
import { toast } from 'sonner';
import type {
  ApplicationDeployment,
  ApplicationDeploymentWithDetails,
  CreateDeploymentData,
  UpdateDeploymentData,
  DeploymentFilters,
  DeploymentStats,
  CloudAsset,
  CloudAssetSummary
} from '@/types/application';

export const useDeployments = (applicationId?: string) => {
  const { user } = useAuth();
  const { currentTeamId } = useCurrentContext();
  
  const [deployments, setDeployments] = useState<ApplicationDeploymentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DeploymentStats | null>(null);

  // Récupérer tous les déploiements avec détails
  const fetchDeployments = useCallback(async (filters: DeploymentFilters = {}) => {
    if (!currentTeamId) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('application_deployments')
        .select('*')
        .eq('team_id', currentTeamId)
        .order('deployment_date', { ascending: false });

      // Filtrer par application si spécifié
      if (applicationId) {
        query = query.eq('application_id', applicationId);
      }

      // Appliquer les filtres
      if (filters.application_id && !applicationId) {
        query = query.eq('application_id', filters.application_id);
      }

      if (filters.environment_name) {
        query = query.eq('environment_name', filters.environment_name);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.deployment_type) {
        query = query.eq('deployment_type', filters.deployment_type);
      }

      if (filters.cloud_asset_id) {
        query = query.eq('cloud_asset_id', filters.cloud_asset_id);
      }

      if (filters.date_from) {
        query = query.gte('deployment_date', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('deployment_date', filters.date_to);
      }

      const { data: deploymentsData, error: deploymentsError } = await query;

      if (deploymentsError) throw deploymentsError;

      // Récupérer les détails supplémentaires pour chaque déploiement
      const deploymentsWithDetails = await Promise.all(
        (deploymentsData || []).map(async (deployment) => {
          // Récupérer les informations de l'application
          const { data: applicationData } = await supabase
            .from('applications')
            .select('id, name, application_type')
            .eq('id', deployment.application_id)
            .single();

          // Récupérer les informations du cloud asset
          const { data: cloudAssetData } = await supabase
            .from('cloud_asset')
            .select('id, asset_name, asset_type, region')
            .eq('id', deployment.cloud_asset_id)
            .single();

          // Récupérer le profil du déployeur
          const { data: deployerProfile } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .eq('id', deployment.deployed_by)
            .single();

          return {
            ...deployment,
            application: applicationData || undefined,
            cloud_asset: cloudAssetData || undefined,
            deployed_by_profile: deployerProfile || undefined
          } as ApplicationDeploymentWithDetails;
        })
      );

      setDeployments(deploymentsWithDetails);
    } catch (err: any) {
      console.error('Error fetching deployments:', err);
      setError(err.message);
      toast.error('Erreur lors du chargement des déploiements');
    } finally {
      setLoading(false);
    }
  }, [currentTeamId, applicationId]);

  // Récupérer les statistiques
  const fetchStats = useCallback(async () => {
    if (!currentTeamId) return;

    try {
      let query = supabase
        .from('application_deployments')
        .select('id, application_id, environment_name, status, deployment_type, deployment_date')
        .eq('team_id', currentTeamId);

      if (applicationId) {
        query = query.eq('application_id', applicationId);
      }

      const { data: deploymentsData } = await query;

      if (deploymentsData) {
        // Récupérer les noms d'applications pour les stats
        const applicationIds = [...new Set(deploymentsData.map(d => d.application_id))];
        const { data: applicationsData } = await supabase
          .from('applications')
          .select('id, name')
          .in('id', applicationIds);

        const stats: DeploymentStats = {
          total: deploymentsData.length,
          by_environment: deploymentsData.reduce((acc: Record<string, number>, dep) => {
            acc[dep.environment_name] = (acc[dep.environment_name] || 0) + 1;
            return acc;
          }, {}),
          by_status: deploymentsData.reduce((acc: Record<string, number>, dep) => {
            acc[dep.status] = (acc[dep.status] || 0) + 1;
            return acc;
          }, {}),
          by_application: applicationIds.map(appId => {
            const app = applicationsData?.find(a => a.id === appId);
            return {
              application_id: appId,
              application_name: app?.name || 'Unknown',
              count: deploymentsData.filter(d => d.application_id === appId).length
            };
          }),
          recent_deployments: deploymentsData.filter(d => 
            new Date(d.deployment_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length,
          success_rate: deploymentsData.length > 0 ? 
            Math.round((deploymentsData.filter(d => d.status === 'active').length / deploymentsData.length) * 100) : 0,
          avg_deployment_time: 8, // Placeholder - would be calculated from real data
          active_environments: new Set(deploymentsData.filter(d => d.status === 'active').map(d => `${d.application_id}-${d.environment_name}`)).size
        };

        setStats(stats);
      }
    } catch (err: any) {
      console.error('Error fetching deployment stats:', err);
    }
  }, [currentTeamId, applicationId]);

  // Créer un déploiement
  const createDeployment = useCallback(async (data: CreateDeploymentData) => {
    if (!user?.id || !currentTeamId) return false;

    try {
      const deploymentData = {
        ...data,
        team_id: currentTeamId,
        deployed_by: user.id,
        deployment_date: new Date().toISOString()
      };

      const { data: newDeployment, error } = await supabase
        .from('application_deployments')
        .insert(deploymentData)
        .select()
        .single();

      if (error) throw error;

      toast.success('Déploiement créé avec succès');
      await fetchDeployments();
      await fetchStats();
      return true;
    } catch (err: any) {
      console.error('Error creating deployment:', err);
      toast.error('Erreur lors de la création du déploiement');
      return false;
    }
  }, [user?.id, currentTeamId]); // Retiré fetchDeployments et fetchStats des dépendances

  // Mettre à jour un déploiement
  const updateDeployment = useCallback(async (data: UpdateDeploymentData) => {
    try {
      const { id, ...updateData } = data;

      const { error } = await supabase
        .from('application_deployments')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Déploiement mis à jour');
      await fetchDeployments();
      await fetchStats();
      return true;
    } catch (err: any) {
      console.error('Error updating deployment:', err);
      toast.error('Erreur lors de la mise à jour');
      return false;
    }
  }, []); // Retiré fetchDeployments et fetchStats des dépendances

  // Supprimer un déploiement
  const deleteDeployment = useCallback(async (deploymentId: string) => {
    try {
      const { error } = await supabase
        .from('application_deployments')
        .delete()
        .eq('id', deploymentId);

      if (error) throw error;

      toast.success('Déploiement supprimé');
      await fetchDeployments();
      await fetchStats();
      return true;
    } catch (err: any) {
      console.error('Error deleting deployment:', err);
      toast.error('Erreur lors de la suppression');
      return false;
    }
  }, []); // Retiré fetchDeployments et fetchStats des dépendances

  // Récupérer les cloud assets disponibles
  const fetchAvailableCloudAssets = useCallback(async (): Promise<CloudAssetSummary[]> => {
    if (!currentTeamId) return [];

    try {
      const { data, error } = await supabase
        .from('cloud_asset')
        .select('id, asset_name, asset_type, region, status')
        .eq('team_id', currentTeamId)
        .eq('status', 'running')
        .order('asset_name');

      if (error) throw error;
      return (data || []).map(asset => ({
        id: asset.id,
        asset_name: asset.asset_name,
        asset_type: asset.asset_type,
        region: asset.region,
        status: asset.status
      }));
    } catch (err: any) {
      console.error('Error fetching cloud assets:', err);
      return [];
    }
  }, [currentTeamId]);

  // Récupérer les applications disponibles
  const fetchAvailableApplications = useCallback(async () => {
    if (!currentTeamId) return [];

    try {
      const { data, error } = await supabase
        .from('applications')
        .select('id, name, application_type, version')
        .eq('team_id', currentTeamId)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching applications:', err);
      return [];
    }
  }, [currentTeamId]);

  // Changer le statut d'un déploiement (utilitaire commun)
  const changeDeploymentStatus = useCallback(async (deploymentId: string, newStatus: string) => {
    return updateDeployment({ id: deploymentId, status: newStatus });
  }, [updateDeployment]);

  // Effectuer un health check
  const performHealthCheck = useCallback(async (deploymentId: string) => {
    try {
      const deployment = deployments.find(d => d.id === deploymentId);
      if (!deployment || !deployment.health_check_url) {
        toast.error('URL de vérification non disponible');
        return false;
      }

      // Simuler un health check (en production, ceci ferait un vrai appel HTTP)
      const isHealthy = Math.random() > 0.2; // 80% de chance d'être healthy

      const newStatus = isHealthy ? 'active' : 'failed';
      const success = await changeDeploymentStatus(deploymentId, newStatus);

      if (success) {
        toast.success(`Health check effectué - Status: ${newStatus}`);
      }

      return success;
    } catch (err: any) {
      console.error('Error performing health check:', err);
      toast.error('Erreur lors du health check');
      return false;
    }
  }, [deployments, changeDeploymentStatus]);

  // Récupérer les déploiements par environnement
  const getDeploymentsByEnvironment = useCallback((environment: string) => {
    return deployments.filter(d => d.environment_name === environment);
  }, [deployments]);

  // Récupérer le dernier déploiement pour un environnement
  const getLatestDeploymentForEnvironment = useCallback((environment: string) => {
    const envDeployments = getDeploymentsByEnvironment(environment);
    return envDeployments.length > 0 ? envDeployments[0] : null;
  }, [getDeploymentsByEnvironment]);

  // Initialiser le hook
  useEffect(() => {
    if (currentTeamId) {
      fetchDeployments();
      fetchStats();
    }
  }, [currentTeamId]); // Retiré fetchDeployments et fetchStats des dépendances

  return {
    deployments,
    loading,
    error,
    stats,
    fetchDeployments,
    createDeployment,
    updateDeployment,
    deleteDeployment,
    changeDeploymentStatus,
    performHealthCheck,
    fetchAvailableCloudAssets,
    fetchAvailableApplications,
    getDeploymentsByEnvironment,
    getLatestDeploymentForEnvironment,
    refreshData: () => {
      fetchDeployments();
      fetchStats();
    }
  };
};

export default useDeployments; 