import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentContext } from '@/hooks/useCurrentContext';
import { toast } from 'sonner';
import type {
  Application,
  ApplicationWithDetails,
  CreateApplicationData,
  UpdateApplicationData,
  ApplicationFilters,
  ApplicationStats,
  BusinessServiceSummary,
  ApplicationDeployment
} from '@/types/application';

export const useApplications = () => {
  const { user } = useAuth();
  const { currentTeamId, currentOrganizationId } = useCurrentContext();
  
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ApplicationStats | null>(null);

  // Récupérer toutes les applications avec détails
  const fetchApplications = useCallback(async (filters: ApplicationFilters = {}) => {
    if (!currentTeamId) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('applications')
        .select('*')
        .eq('team_id', currentTeamId)
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      if (filters.application_type) {
        query = query.eq('application_type', filters.application_type);
      }

      if (filters.technology_stack && filters.technology_stack.length > 0) {
        query = query.overlaps('technology_stack', filters.technology_stack);
      }

      if (filters.business_services && filters.business_services.length > 0) {
        query = query.overlaps('business_services', filters.business_services);
      }

      if (filters.version) {
        query = query.eq('version', filters.version);
      }

      const { data: applicationsData, error: applicationsError } = await query;

      if (applicationsError) throw applicationsError;

      // Récupérer les détails supplémentaires pour chaque application
      const applicationsWithDetails = await Promise.all(
        (applicationsData || []).map(async (app) => {
          // Récupérer les informations de l'équipe
          const { data: teamData, error: teamError } = await supabase
            .from('teams')
            .select('id, name, organization_id')
            .eq('id', app.team_id)
            .single();

          // Récupérer les informations de l'organisation
          let organizationData = null;
          if (teamData && !teamError && teamData.organization_id) {
            const { data: orgData, error: orgError } = await supabase
              .from('organizations')
              .select('id, name')
              .eq('id', teamData.organization_id)
              .single();
            if (!orgError) {
              organizationData = orgData;
            }
          }

          // Récupérer le profil du créateur
          const { data: creatorProfile } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .eq('id', app.created_by)
            .single();

          // Récupérer les services métiers liés
          let businessServicesDetails: BusinessServiceSummary[] = [];
          if (app.business_services && app.business_services.length > 0) {
            const { data: servicesData } = await supabase
              .from('business_services')
              .select('id, name, criticality, service_level')
              .in('id', app.business_services);
            
            businessServicesDetails = (servicesData || []).map(service => ({
              id: service.id,
              name: service.name,
              criticality: service.criticality as 'low' | 'medium' | 'high' | 'critical',
              service_level: service.service_level
            }));
          }

          // Récupérer les déploiements
          const { data: deploymentsData } = await supabase
            .from('application_deployments')
            .select('*')
            .eq('application_id', app.id)
            .order('deployment_date', { ascending: false })
            .limit(5);

          const teamInfo = teamData && !teamError ? {
            id: teamData.id,
            name: teamData.name,
            organization: organizationData ? {
              id: organizationData.id,
              name: organizationData.name
            } : undefined
          } : undefined;

          return {
            ...app,
            team: teamInfo,
            created_by_profile: creatorProfile || undefined,
            business_services_details: businessServicesDetails,
            deployments: deploymentsData || [],
            // Métrics placeholder
            metrics: {
              uptime: 99.5,
              response_time: 245,
              error_rate: 0.1,
              deployment_frequency: 12,
              last_deployment: deploymentsData?.[0]?.deployment_date || null,
              health_score: 95
            }
          } as ApplicationWithDetails;
        })
      );

      setApplications(applicationsWithDetails);
    } catch (err: any) {
      console.error('Error fetching applications:', err);
      setError(err.message);
      toast.error('Erreur lors du chargement des applications');
    } finally {
      setLoading(false);
    }
  }, [currentTeamId]);

  // Récupérer les statistiques
  const fetchStats = useCallback(async () => {
    if (!currentTeamId) return;

    try {
      const { data: applicationsData } = await supabase
        .from('applications')
        .select('id, application_type, technology_stack, business_services, team_id')
        .eq('team_id', currentTeamId);

      const { data: deploymentsData } = await supabase
        .from('application_deployments')
        .select('id, application_id, status, deployment_date')
        .eq('team_id', currentTeamId);

      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, name')
        .eq('id', currentTeamId);

      if (applicationsData) {
        // Calculs des statistiques
        const stats: ApplicationStats = {
          total: applicationsData.length,
          by_type: applicationsData.reduce((acc: Record<string, number>, app) => {
            acc[app.application_type] = (acc[app.application_type] || 0) + 1;
            return acc;
          }, {}),
          by_team: [{
            team_id: currentTeamId,
            team_name: teamsData?.[0]?.name || 'Unknown',
            count: applicationsData.length
          }],
          by_technology: [],
          deployment_stats: {
            total_deployments: deploymentsData?.length || 0,
            active_environments: new Set(deploymentsData?.filter(d => d.status === 'active').map(d => d.application_id)).size,
            recent_deployments: deploymentsData?.filter(d => 
              new Date(d.deployment_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            ).length || 0
          },
          business_services_coverage: {
            with_services: applicationsData.filter(app => app.business_services && app.business_services.length > 0).length,
            without_services: applicationsData.filter(app => !app.business_services || app.business_services.length === 0).length
          },
          health_metrics: {
            healthy: Math.floor(applicationsData.length * 0.8),
            warning: Math.floor(applicationsData.length * 0.15),
            critical: Math.floor(applicationsData.length * 0.05),
            unknown: 0
          }
        };

        // Calculer les technologies populaires
        const techCount: Record<string, number> = {};
        applicationsData.forEach(app => {
          app.technology_stack?.forEach(tech => {
            techCount[tech] = (techCount[tech] || 0) + 1;
          });
        });

        stats.by_technology = Object.entries(techCount)
          .map(([technology, count]) => ({ technology, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        setStats(stats);
      }
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    }
  }, [currentTeamId]);

  // Créer une application
  const createApplication = useCallback(async (data: CreateApplicationData) => {
    if (!user?.id || !currentTeamId) return false;

    try {
      const applicationData = {
        ...data,
        team_id: currentTeamId,
        created_by: user.id
      };

      const { data: newApplication, error } = await supabase
        .from('applications')
        .insert(applicationData)
        .select()
        .single();

      if (error) throw error;

      toast.success('Application créée avec succès');
      await fetchApplications();
      await fetchStats();
      return true;
    } catch (err: any) {
      console.error('Error creating application:', err);
      toast.error('Erreur lors de la création de l\'application');
      return false;
    }
  }, [user?.id, currentTeamId, fetchApplications, fetchStats]);

  // Mettre à jour une application
  const updateApplication = useCallback(async (data: UpdateApplicationData) => {
    try {
      const { id, ...updateData } = data;

      const { error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Application mise à jour');
      await fetchApplications();
      await fetchStats();
      return true;
    } catch (err: any) {
      console.error('Error updating application:', err);
      toast.error('Erreur lors de la mise à jour');
      return false;
    }
  }, [fetchApplications, fetchStats]);

  // Supprimer une application
  const deleteApplication = useCallback(async (applicationId: string) => {
    try {
      // Supprimer d'abord les déploiements liés
      await supabase
        .from('application_deployments')
        .delete()
        .eq('application_id', applicationId);

      // Supprimer les dépendances
      await supabase
        .from('application_dependencies')
        .delete()
        .eq('application_id', applicationId);

      // Supprimer l'application
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', applicationId);

      if (error) throw error;

      toast.success('Application supprimée');
      await fetchApplications();
      await fetchStats();
      return true;
    } catch (err: any) {
      console.error('Error deleting application:', err);
      toast.error('Erreur lors de la suppression');
      return false;
    }
  }, [fetchApplications, fetchStats]);

  // Lier une application à un service métier
  const linkToBusinessService = useCallback(async (applicationId: string, businessServiceId: string) => {
    try {
      // Récupérer l'application actuelle
      const { data: app, error: fetchError } = await supabase
        .from('applications')
        .select('business_services')
        .eq('id', applicationId)
        .single();

      if (fetchError) throw fetchError;

      // Ajouter le service métier
      const currentServices = app.business_services || [];
      if (!currentServices.includes(businessServiceId)) {
        const updatedServices = [...currentServices, businessServiceId];

        const { error: updateError } = await supabase
          .from('applications')
          .update({ business_services: updatedServices })
          .eq('id', applicationId);

        if (updateError) throw updateError;

        toast.success('Application liée au service métier');
        await fetchApplications();
        return true;
      } else {
        toast.info('Application déjà liée à ce service');
        return false;
      }
    } catch (err: any) {
      console.error('Error linking to business service:', err);
      toast.error('Erreur lors de la liaison');
      return false;
    }
  }, [fetchApplications]);

  // Délier une application d'un service métier
  const unlinkFromBusinessService = useCallback(async (applicationId: string, businessServiceId: string) => {
    try {
      const { data: app, error: fetchError } = await supabase
        .from('applications')
        .select('business_services')
        .eq('id', applicationId)
        .single();

      if (fetchError) throw fetchError;

      const currentServices = app.business_services || [];
      const updatedServices = currentServices.filter(id => id !== businessServiceId);

      const { error: updateError } = await supabase
        .from('applications')
        .update({ business_services: updatedServices })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      toast.success('Application déliée du service métier');
      await fetchApplications();
      return true;
    } catch (err: any) {
      console.error('Error unlinking from business service:', err);
      toast.error('Erreur lors de la déliaison');
      return false;
    }
  }, [fetchApplications]);

  // Récupérer les services métiers disponibles
  const fetchAvailableBusinessServices = useCallback(async () => {
    if (!currentTeamId) return [];

    try {
      const { data, error } = await supabase
        .from('business_services')
        .select('id, name, criticality, service_level')
        .eq('team_id', currentTeamId)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching business services:', err);
      return [];
    }
  }, [currentTeamId]);

  // Créer un déploiement (maintenant fonctionnel)
  const createDeployment = useCallback(async (applicationId: string, deploymentData: {
    cloud_asset_id: string;
    environment_name: string;
    deployment_type: string;
    status: string;
    version?: string;
    health_check_url?: string;
    configuration?: Record<string, any>;
    metadata?: Record<string, any>;
  }) => {
    if (!user?.id || !currentTeamId) return false;

    try {
      const fullDeploymentData = {
        application_id: applicationId,
        team_id: currentTeamId,
        deployed_by: user.id,
        deployment_date: new Date().toISOString(),
        ...deploymentData
      };

      const { data: newDeployment, error } = await supabase
        .from('application_deployments')
        .insert(fullDeploymentData)
        .select()
        .single();

      if (error) throw error;

      toast.success('Déploiement créé avec succès');
      await fetchApplications();
      await fetchStats();
      return true;
    } catch (err: any) {
      console.error('Error creating deployment:', err);
      toast.error('Erreur lors de la création du déploiement');
      return false;
    }
  }, [user?.id, currentTeamId, fetchApplications, fetchStats]);

  // Initialiser le hook
  useEffect(() => {
    if (currentTeamId) {
      fetchApplications();
      fetchStats();
    }
  }, [currentTeamId, fetchApplications, fetchStats]);

  return {
    applications,
    loading,
    error,
    stats,
    fetchApplications,
    createApplication,
    updateApplication,
    deleteApplication,
    linkToBusinessService,
    unlinkFromBusinessService,
    fetchAvailableBusinessServices,
    createDeployment,
    refreshData: () => {
      fetchApplications();
      fetchStats();
    }
  };
};

export default useApplications; 