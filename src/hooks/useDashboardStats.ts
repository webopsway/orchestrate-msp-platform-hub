import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { DashboardStats } from '@/types/dashboard';

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    organizations: 0,
    users: 0,
    incidents: 0,
    services: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Compter les organisations actives
      const { count: orgsCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      // Compter les utilisateurs
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Compter les incidents ouverts
      const { count: incidentsCount } = await supabase
        .from('itsm_incidents')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress']);

      // Compter les services surveillés (cloud assets actifs)
      const { count: servicesCount } = await supabase
        .from('cloud_asset')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'running');

      setStats({
        organizations: orgsCount || 0,
        users: usersCount || 0,
        incidents: incidentsCount || 0,
        services: servicesCount || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    refetch: fetchStats
  };
}