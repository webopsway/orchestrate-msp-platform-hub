import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentContext } from '@/hooks/useCurrentContext';
import { toast } from 'sonner';
import type {
  BusinessService,
  BusinessServiceWithDetails,
  CreateBusinessServiceData,
  UpdateBusinessServiceData,
  BusinessServiceFilters,
  BusinessServiceStats,
  Application
} from '@/types/businessService';

export const useBusinessServices = () => {
  const { user } = useAuth();
  const { currentTeamId, currentOrganizationId } = useCurrentContext();
  
  const [services, setServices] = useState<BusinessServiceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<BusinessServiceStats | null>(null);

  // Récupérer tous les services métiers avec détails
  const fetchServices = useCallback(async (filters: BusinessServiceFilters = {}) => {
    if (!currentTeamId) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('business_services')
        .select('*')
        .eq('team_id', currentTeamId)
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      if (filters.criticality && filters.criticality !== 'all') {
        query = query.eq('criticality', filters.criticality);
      }

      if (filters.business_owner) {
        query = query.eq('business_owner', filters.business_owner);
      }

      if (filters.technical_owner) {
        query = query.eq('technical_owner', filters.technical_owner);
      }

      if (filters.service_level) {
        query = query.eq('service_level', filters.service_level);
      }

      const { data: servicesData, error: servicesError } = await query;

      if (servicesError) throw servicesError;

      // Pour simplifier, on va créer une version basique
      const servicesWithDetails = (servicesData || []).map(service => ({
        ...service,
        team: undefined, // Sera rempli plus tard
        applications: [], // Sera rempli plus tard
        business_owner_profile: undefined,
        technical_owner_profile: undefined
      })) as BusinessServiceWithDetails[];

      setServices(servicesWithDetails);
    } catch (err: any) {
      console.error('Error fetching business services:', err);
      setError(err.message);
      toast.error('Erreur lors du chargement des services métiers');
    } finally {
      setLoading(false);
    }
  }, [currentTeamId]);

  // Récupérer les statistiques
  const fetchStats = useCallback(async () => {
    if (!currentTeamId) return;

    try {
      const { data: servicesData } = await supabase
        .from('business_services')
        .select(`
          id, criticality, team_id,
          team:teams(id, name)
        `)
        .eq('team_id', currentTeamId);

      const { data: appsData } = await supabase
        .from('applications')
        .select('business_services')
        .eq('team_id', currentTeamId);

      if (servicesData) {
        const stats: BusinessServiceStats = {
          total: servicesData.length,
          by_criticality: {
            low: servicesData.filter(s => s.criticality === 'low').length,
            medium: servicesData.filter(s => s.criticality === 'medium').length,
            high: servicesData.filter(s => s.criticality === 'high').length,
            critical: servicesData.filter(s => s.criticality === 'critical').length,
          },
          by_team: Object.values(
            servicesData.reduce((acc: any, service) => {
              const teamId = service.team_id;
              if (!acc[teamId]) {
                acc[teamId] = {
                  team_id: teamId,
                  team_name: 'Unknown', // Simplifié pour éviter les erreurs de type
                  count: 0
                };
              }
              acc[teamId].count++;
              return acc;
            }, {})
          ),
          applications_coverage: {
            with_apps: 0,
            without_apps: 0
          },
          sla_compliance: {
            compliant: 0,
            non_compliant: 0,
            average: 95 // Placeholder
          }
        };

        // Calculer la couverture des applications
        servicesData.forEach(service => {
          const hasApps = appsData?.some(app => 
            app.business_services?.includes(service.id)
          );
          if (hasApps) {
            stats.applications_coverage.with_apps++;
          } else {
            stats.applications_coverage.without_apps++;
          }
        });

        setStats(stats);
      }
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    }
  }, [currentTeamId]);

  // Créer un service métier
  const createService = useCallback(async (data: CreateBusinessServiceData) => {
    if (!user?.id || !currentTeamId) return false;

    try {
      const serviceData = {
        ...data,
        team_id: currentTeamId,
        organization_id: currentOrganizationId,
        created_by: user.id
      };

      const { data: newService, error } = await supabase
        .from('business_services')
        .insert(serviceData)
        .select()
        .single();

      if (error) throw error;

      toast.success('Service métier créé avec succès');
      await fetchServices();
      await fetchStats();
      return true;
    } catch (err: any) {
      console.error('Error creating service:', err);
      toast.error('Erreur lors de la création du service');
      return false;
    }
  }, [user?.id, currentTeamId, currentOrganizationId, fetchServices, fetchStats]);

  // Mettre à jour un service métier
  const updateService = useCallback(async (data: UpdateBusinessServiceData) => {
    try {
      const { id, ...updateData } = data;

      const { error } = await supabase
        .from('business_services')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Service métier mis à jour');
      await fetchServices();
      await fetchStats();
      return true;
    } catch (err: any) {
      console.error('Error updating service:', err);
      toast.error('Erreur lors de la mise à jour');
      return false;
    }
  }, [fetchServices, fetchStats]);

  // Supprimer un service métier
  const deleteService = useCallback(async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('business_services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      toast.success('Service métier supprimé');
      await fetchServices();
      await fetchStats();
      return true;
    } catch (err: any) {
      console.error('Error deleting service:', err);
      toast.error('Erreur lors de la suppression');
      return false;
    }
  }, [fetchServices, fetchStats]);

  // Récupérer les applications disponibles
  const fetchAvailableApplications = useCallback(async () => {
    if (!currentTeamId) return [];

    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('team_id', currentTeamId)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching applications:', err);
      return [];
    }
  }, [currentTeamId]);

  // Lier une application à un service
  const linkApplication = useCallback(async (serviceId: string, applicationId: string) => {
    try {
      // Récupérer l'application actuelle
      const { data: app, error: fetchError } = await supabase
        .from('applications')
        .select('business_services')
        .eq('id', applicationId)
        .single();

      if (fetchError) throw fetchError;

      // Ajouter le service aux business_services de l'application
      const currentServices = app.business_services || [];
      if (!currentServices.includes(serviceId)) {
        const updatedServices = [...currentServices, serviceId];

        const { error: updateError } = await supabase
          .from('applications')
          .update({ business_services: updatedServices })
          .eq('id', applicationId);

        if (updateError) throw updateError;

        toast.success('Application liée au service');
        await fetchServices();
        return true;
      } else {
        toast.info('Application déjà liée à ce service');
        return false;
      }
    } catch (err: any) {
      console.error('Error linking application:', err);
      toast.error('Erreur lors de la liaison');
      return false;
    }
  }, [fetchServices]);

  // Délier une application d'un service
  const unlinkApplication = useCallback(async (serviceId: string, applicationId: string) => {
    try {
      const { data: app, error: fetchError } = await supabase
        .from('applications')
        .select('business_services')
        .eq('id', applicationId)
        .single();

      if (fetchError) throw fetchError;

      const currentServices = app.business_services || [];
      const updatedServices = currentServices.filter(id => id !== serviceId);

      const { error: updateError } = await supabase
        .from('applications')
        .update({ business_services: updatedServices })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      toast.success('Application déliée du service');
      await fetchServices();
      return true;
    } catch (err: any) {
      console.error('Error unlinking application:', err);
      toast.error('Erreur lors de la déliaison');
      return false;
    }
  }, [fetchServices]);

  // Initialiser le hook
  useEffect(() => {
    if (currentTeamId) {
      fetchServices();
      fetchStats();
    }
  }, [currentTeamId, fetchServices, fetchStats]);

  return {
    services,
    loading,
    error,
    stats,
    fetchServices,
    createService,
    updateService,
    deleteService,
    fetchAvailableApplications,
    linkApplication,
    unlinkApplication,
    refreshData: () => {
      fetchServices();
      fetchStats();
    }
  };
};

export default useBusinessServices; 