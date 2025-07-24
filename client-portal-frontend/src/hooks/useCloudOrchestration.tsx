import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type CloudProvider = Database['public']['Tables']['cloud_providers']['Row'];
type CloudCredentials = Database['public']['Tables']['cloud_credentials']['Row'];
type BackupExecution = Database['public']['Tables']['backup_executions']['Row'];

export interface CloudCredentialsWithProvider extends CloudCredentials {
  cloud_providers: CloudProvider;
}

export interface BackupExecutionWithProvider extends BackupExecution {
  cloud_providers: CloudProvider;
}

export const useCloudOrchestration = () => {
  const { user } = useAuth();
  const [providers, setProviders] = useState<CloudProvider[]>([]);
  const [credentials, setCredentials] = useState<CloudCredentialsWithProvider[]>([]);
  const [executions, setExecutions] = useState<BackupExecutionWithProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch cloud providers
  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('cloud_providers')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les fournisseurs cloud",
        variant: "destructive",
      });
    }
  };

  // Fetch cloud credentials
  const fetchCredentials = async () => {
    try {
      const { data, error } = await supabase
        .from('cloud_credentials')
        .select(`
          *,
          cloud_providers!inner(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCredentials(data as CloudCredentialsWithProvider[]);
    } catch (error) {
      console.error('Error fetching credentials:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les credentials",
        variant: "destructive",
      });
    }
  };

  // Fetch backup executions
  const fetchExecutions = async () => {
    try {
      const { data, error } = await supabase
        .from('backup_executions')
        .select(`
          *,
          cloud_providers!inner(*)
        `)
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setExecutions(data as BackupExecutionWithProvider[]);
    } catch (error) {
      console.error('Error fetching executions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les exécutions",
        variant: "destructive",
      });
    }
  };

  // Create or update cloud credentials
  const saveCredentials = async (
    teamId: string,
    providerId: string,
    config: Record<string, any>
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('cloud_credentials')
        .upsert({
          team_id: teamId,
          provider_id: providerId,
          config: config,
          configured_by: user.id
        }, {
          onConflict: 'team_id,provider_id'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Credentials sauvegardés avec succès",
      });

      await fetchCredentials();
      return data;
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder les credentials",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete cloud credentials
  const deleteCredentials = async (credentialsId: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('cloud_credentials')
        .delete()
        .eq('id', credentialsId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Credentials supprimés avec succès",
      });

      await fetchCredentials();
    } catch (error) {
      console.error('Error deleting credentials:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer les credentials",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Trigger inventory task
  const triggerInventory = async (teamId: string, providerId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('trigger_team_inventory', {
        p_team_id: teamId,
        p_provider_id: providerId
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Inventaire démarré avec succès",
      });

      await fetchExecutions();
      return data;
    } catch (error) {
      console.error('Error triggering inventory:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de démarrer l'inventaire",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Trigger backup task
  const triggerBackup = async (teamId: string, providerId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('trigger_team_backup', {
        p_team_id: teamId,
        p_provider_id: providerId
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Sauvegarde démarrée avec succès",
      });

      await fetchExecutions();
      return data;
    } catch (error) {
      console.error('Error triggering backup:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de démarrer la sauvegarde",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Direct API call to edge function (alternative method)
  const triggerOrchestrationDirect = async (
    taskType: 'inventory' | 'backup',
    teamId: string,
    providerId: string
  ) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('cloud-orchestration', {
        body: {
          task_type: taskType,
          team_id: teamId,
          provider_id: providerId
        }
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: `${taskType === 'inventory' ? 'Inventaire' : 'Sauvegarde'} démarré(e) avec succès`,
      });

      await fetchExecutions();
      return data;
    } catch (error) {
      console.error('Error triggering orchestration:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de démarrer la tâche",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time updates for executions
  useEffect(() => {
    if (user) {
      const channel = supabase
        .channel('backup_executions_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'backup_executions'
          },
          () => {
            fetchExecutions();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // Initial data loading
  useEffect(() => {
    if (user) {
      fetchProviders();
      fetchCredentials();
      fetchExecutions();
    }
  }, [user]);

  return {
    providers,
    credentials,
    executions,
    loading,
    saveCredentials,
    deleteCredentials,
    triggerInventory,
    triggerBackup,
    triggerOrchestrationDirect
  };
};