import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { DashboardConfiguration, DashboardWidget, CreateDashboardConfigurationData } from '@/types/dashboard';

export function useDashboardConfigurations() {
  const [configurations, setConfigurations] = useState<DashboardConfiguration[]>([]);
  const [availableWidgets, setAvailableWidgets] = useState<DashboardWidget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, userProfile } = useAuth();

  const fetchConfigurations = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('dashboard_configurations' as any)
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setConfigurations((data as unknown as DashboardConfiguration[]) || []);
    } catch (err: any) {
      console.error('Error fetching dashboard configurations:', err);
      setError(err.message);
      toast.error('Erreur lors du chargement des configurations');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableWidgets = async () => {
    try {
      const { data, error } = await supabase
        .from('dashboard_widgets' as any)
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;

      setAvailableWidgets((data as unknown as DashboardWidget[]) || []);
    } catch (err: any) {
      console.error('Error fetching widgets:', err);
      toast.error('Erreur lors du chargement des widgets');
    }
  };

  const createConfiguration = async (data: CreateDashboardConfigurationData): Promise<boolean> => {
    if (!user) {
      toast.error('Utilisateur non authentifié');
      return false;
    }

    try {
      const { error } = await supabase
        .from('dashboard_configurations' as any)
        .insert({
          ...data,
          created_by: user.id
        });

      if (error) throw error;

      toast.success('Configuration créée avec succès');
      await fetchConfigurations();
      return true;
    } catch (err: any) {
      console.error('Error creating configuration:', err);
      toast.error('Erreur lors de la création');
      return false;
    }
  };

  const updateConfiguration = async (id: string, data: Partial<CreateDashboardConfigurationData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dashboard_configurations' as any)
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast.success('Configuration mise à jour');
      await fetchConfigurations();
      return true;
    } catch (err: any) {
      console.error('Error updating configuration:', err);
      toast.error('Erreur lors de la mise à jour');
      return false;
    }
  };

  const deleteConfiguration = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dashboard_configurations' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Configuration supprimée');
      await fetchConfigurations();
      return true;
    } catch (err: any) {
      console.error('Error deleting configuration:', err);
      toast.error('Erreur lors de la suppression');
      return false;
    }
  };

  const getCurrentDashboard = (): DashboardConfiguration | null => {
    if (!userProfile) return null;

    // Priorité : dashboard spécifique à l'équipe de l'utilisateur
    const teamDashboard = configurations.find(config => 
      config.team_id === userProfile.default_team_id && config.is_active
    );
    if (teamDashboard) return teamDashboard;

    // Priorité 2 : dashboard par organisation
    const orgDashboard = configurations.find(config => 
      config.organization_id === userProfile.default_organization_id && config.is_active
    );
    if (orgDashboard) return orgDashboard;

    // Priorité 3 : dashboard par défaut
    const defaultDashboard = configurations.find(config => 
      config.is_default && config.is_active && !config.team_id && !config.organization_id
    );
    if (defaultDashboard) return defaultDashboard;

    return null;
  };

  useEffect(() => {
    if (user) {
      fetchConfigurations();
      fetchAvailableWidgets();
    }
  }, [user]);

  return {
    configurations,
    availableWidgets,
    isLoading,
    error,
    fetchConfigurations,
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,
    getCurrentDashboard
  };
}