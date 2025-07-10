import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type MonitoringAlert = Tables<'monitoring_alerts'>;
type UptimeCheck = Tables<'uptime_checks'>;

interface MonitoringStats {
  totalAlerts: number;
  activeAlerts: number;
  uptimeChecks: number;
  avgResponseTime: number;
}

export const useMonitoring = () => {
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [uptimeChecks, setUptimeChecks] = useState<UptimeCheck[]>([]);
  const [stats, setStats] = useState<MonitoringStats>({
    totalAlerts: 0,
    activeAlerts: 0,
    uptimeChecks: 0,
    avgResponseTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('monitoring_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (alertsError) throw alertsError;

      // Fetch uptime checks
      const { data: uptimeData, error: uptimeError } = await supabase
        .from('uptime_checks')
        .select('*')
        .order('checked_at', { ascending: false });

      if (uptimeError) throw uptimeError;

      setAlerts(alertsData || []);
      setUptimeChecks(uptimeData || []);

      // Calculate stats
      const activeAlerts = alertsData?.filter(a => a.status === 'active').length || 0;
      const avgResponseTime = uptimeData?.length 
        ? Math.round(uptimeData.reduce((sum, check) => sum + (check.response_time || 0), 0) / uptimeData.length)
        : 0;

      setStats({
        totalAlerts: alertsData?.length || 0,
        activeAlerts,
        uptimeChecks: uptimeData?.length || 0,
        avgResponseTime
      });

    } catch (err) {
      console.error('Error fetching monitoring data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch monitoring data');
    } finally {
      setLoading(false);
    }
  };

  const createUptimeCheck = async (data: {
    name: string;
    url: string;
    method?: string;
    check_interval?: number;
    timeout_seconds?: number;
    expected_status_codes?: number[];
  }) => {
    try {
      // Get current user's session to get team_id
      const { data: sessionData } = await supabase.rpc('get_current_user_session');
      const teamId = sessionData?.[0]?.current_team_id;
      
      if (!teamId) {
        throw new Error('No team context available');
      }

      const { data: result, error } = await supabase
        .from('uptime_checks')
        .insert([{
          ...data,
          team_id: teamId,
          method: data.method || 'GET',
          check_interval: data.check_interval || 300,
          timeout_seconds: data.timeout_seconds || 30,
          expected_status_codes: data.expected_status_codes || [200]
        }])
        .select()
        .single();

      if (error) throw error;

      setUptimeChecks(prev => [result, ...prev]);
      return { data: result, error: null };
    } catch (err) {
      console.error('Error creating uptime check:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Failed to create uptime check' };
    }
  };

  const updateUptimeCheck = async (id: string, updates: Partial<UptimeCheck>) => {
    try {
      const { data: result, error } = await supabase
        .from('uptime_checks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setUptimeChecks(prev => prev.map(check => check.id === id ? result : check));
      return { data: result, error: null };
    } catch (err) {
      console.error('Error updating uptime check:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Failed to update uptime check' };
    }
  };

  const deleteUptimeCheck = async (id: string) => {
    try {
      const { error } = await supabase
        .from('uptime_checks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setUptimeChecks(prev => prev.filter(check => check.id !== id));
      return { error: null };
    } catch (err) {
      console.error('Error deleting uptime check:', err);
      return { error: err instanceof Error ? err.message : 'Failed to delete uptime check' };
    }
  };

  const acknowledgeAlert = async (id: string) => {
    try {
      const { data: result, error } = await supabase
        .from('monitoring_alerts')
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setAlerts(prev => prev.map(alert => alert.id === id ? result : alert));
      return { data: result, error: null };
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Failed to acknowledge alert' };
    }
  };

  const runUptimeCheck = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('monitoring-integrations', {
        body: { uptime_check_id: id },
        method: 'POST'
      });

      if (error) throw error;

      // Refresh uptime checks
      await fetchMonitoringData();
      return { data, error: null };
    } catch (err) {
      console.error('Error running uptime check:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Failed to run uptime check' };
    }
  };

  useEffect(() => {
    fetchMonitoringData();

    // Set up real-time subscriptions
    const alertsSubscription = supabase
      .channel('monitoring_alerts_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'monitoring_alerts' },
        () => fetchMonitoringData()
      )
      .subscribe();

    const uptimeSubscription = supabase
      .channel('uptime_checks_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'uptime_checks' },
        () => fetchMonitoringData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(alertsSubscription);
      supabase.removeChannel(uptimeSubscription);
    };
  }, []);

  return {
    alerts,
    uptimeChecks,
    stats,
    loading,
    error,
    createUptimeCheck,
    updateUptimeCheck,
    deleteUptimeCheck,
    acknowledgeAlert,
    runUptimeCheck,
    refreshData: fetchMonitoringData
  };
};