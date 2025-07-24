import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type AppSetting = Database['public']['Tables']['app_settings']['Row'];

export interface NamespaceInfo {
  namespace: string;
  is_global: boolean;
  setting_count: number;
}

export interface KeyInfo {
  key: string;
  has_global: boolean;
  has_team: boolean;
  team_count: number;
}

export interface SettingWithDetails extends AppSetting {
  is_global: boolean;
  is_inherited: boolean;
}

export const useAppSettings = () => {
  const [namespaces, setNamespaces] = useState<NamespaceInfo[]>([]);
  const [keys, setKeys] = useState<KeyInfo[]>([]);
  const [settings, setSettings] = useState<SettingWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch all namespaces
  const fetchNamespaces = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_namespaces');
      
      if (error) throw error;
      setNamespaces(data || []);
    } catch (error) {
      console.error('Error fetching namespaces:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les namespaces",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch keys for a specific namespace
  const fetchKeys = async (namespace: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_keys_by_namespace', {
        p_namespace: namespace
      });
      
      if (error) throw error;
      setKeys(data || []);
    } catch (error) {
      console.error('Error fetching keys:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les clés",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch all settings with details
  const fetchSettings = async (namespace?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('app_settings')
        .select('*');
      
      if (namespace) {
        query = query.eq('namespace', namespace);
      }
      
      const { data, error } = await query.order('namespace').order('key');
      
      if (error) throw error;
      
      // Add metadata to settings
      const settingsWithDetails: SettingWithDetails[] = (data || []).map(setting => ({
        ...setting,
        is_global: setting.team_id === null,
        is_inherited: false // This would need more complex logic to determine
      }));
      
      setSettings(settingsWithDetails);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get a specific setting value with inheritance
  const getSetting = async (teamId: string | null, namespace: string, key: string): Promise<any> => {
    try {
      const { data, error } = await supabase.rpc('get_setting', {
        p_team_id: teamId,
        p_namespace: namespace,
        p_key: key
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting setting:', error);
      throw error;
    }
  };

  // Set a setting (global or team-specific)
  const setSetting = async (
    teamId: string | null,
    namespace: string,
    key: string,
    value: any
  ) => {
    try {
      setLoading(true);
      
      // Convert value to JSONB format - avoid double stringifying
      const jsonValue = value;
      
      const { data, error } = await supabase.rpc('set_setting', {
        p_team_id: teamId,
        p_namespace: namespace,
        p_key: key,
        p_value: jsonValue
      });
      
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: `Paramètre ${teamId ? 'équipe' : 'global'} sauvegardé`,
      });
      
      // Refresh settings
      await fetchSettings();
      await fetchNamespaces();
      
      return data;
    } catch (error) {
      console.error('Error setting value:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder le paramètre",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete a setting
  const deleteSetting = async (teamId: string | null, namespace: string, key: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('delete_setting', {
        p_team_id: teamId,
        p_namespace: namespace,
        p_key: key
      });
      
      if (error) throw error;
      
      if (data) {
        toast({
          title: "Succès",
          description: "Paramètre supprimé avec succès",
        });
        
        // Refresh settings
        await fetchSettings();
        await fetchNamespaces();
      } else {
        toast({
          title: "Information",
          description: "Aucun paramètre trouvé à supprimer",
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error deleting setting:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le paramètre",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Bulk operations for common settings
  const setGlobalTheme = async (theme: string) => {
    return setSetting(null, 'ui', 'theme', theme);
  };

  const setGlobalLogo = async (logoUrl: string) => {
    return setSetting(null, 'ui', 'logo_url', logoUrl);
  };

  const setSessionTimeout = async (timeoutSeconds: number) => {
    return setSetting(null, 'security', 'session_timeout', timeoutSeconds);
  };

  const setNotificationSettings = async (emailEnabled: boolean, slackWebhook?: string) => {
    await setSetting(null, 'notifications', 'email_enabled', emailEnabled);
    if (slackWebhook !== undefined) {
      await setSetting(null, 'notifications', 'slack_webhook_url', slackWebhook);
    }
  };

  const setBackupSettings = async (retentionDays: number, autoBackup: boolean) => {
    await setSetting(null, 'backup', 'retention_days', retentionDays);
    await setSetting(null, 'backup', 'auto_backup', autoBackup);
  };

  // Subscribe to real-time changes
  useEffect(() => {
    const channel = supabase
      .channel('app_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_settings'
        },
        () => {
          fetchSettings();
          fetchNamespaces();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    namespaces,
    keys,
    settings,
    loading,
    fetchNamespaces,
    fetchKeys,
    fetchSettings,
    getSetting,
    setSetting,
    deleteSetting,
    // Convenience methods
    setGlobalTheme,
    setGlobalLogo,
    setSessionTimeout,
    setNotificationSettings,
    setBackupSettings
  };
};