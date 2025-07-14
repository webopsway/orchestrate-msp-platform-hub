import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/contexts/AuthContext';
import type {
  CloudAssetConfiguration,
  CreateCloudAssetConfigurationData,
  UpdateCloudAssetConfigurationData,
  CloudAssetConfigurationFilters
} from '@/types/cloudAsset';

export class CloudAssetConfigurationService {
  static async fetchConfigurations(
    user: User, 
    userProfile: UserProfile | null,
    filters?: CloudAssetConfigurationFilters
  ): Promise<CloudAssetConfiguration[]> {
    try {
      let query = supabase
        .from('cloud_asset_configurations')
        .select('*')
        .order('collected_at', { ascending: false });

      // Filtrage par équipe si pas admin MSP
      if (!userProfile?.is_msp_admin && userProfile?.default_team_id) {
        query = query.eq('team_id', userProfile.default_team_id);
      }

      // Application des filtres
      if (filters) {
        if (filters.asset_id) {
          query = query.eq('asset_id', filters.asset_id);
        }
        if (filters.team_id) {
          query = query.eq('team_id', filters.team_id);
        }
        if (filters.os) {
          query = query.eq('os', filters.os);
        }
        if (filters.collected_after) {
          query = query.gte('collected_at', filters.collected_after);
        }
        if (filters.collected_before) {
          query = query.lte('collected_at', filters.collected_before);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching cloud asset configurations:', error);
        toast.error('Erreur lors du chargement des configurations');
        return [];
      }

      return (data || []) as CloudAssetConfiguration[];
    } catch (error) {
      console.error('Error fetching cloud asset configurations:', error);
      toast.error('Erreur lors du chargement des configurations');
      return [];
    }
  }

  static async fetchConfigurationById(
    id: string,
    user: User,
    userProfile: UserProfile | null
  ): Promise<CloudAssetConfiguration | null> {
    try {
      let query = supabase
        .from('cloud_asset_configurations')
        .select('*')
        .eq('id', id)
        .single();

      // Filtrage par équipe si pas admin MSP
      if (!userProfile?.is_msp_admin && userProfile?.default_team_id) {
        query = query.eq('team_id', userProfile.default_team_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching cloud asset configuration:', error);
        toast.error('Erreur lors du chargement de la configuration');
        return null;
      }

      return data as CloudAssetConfiguration;
    } catch (error) {
      console.error('Error fetching cloud asset configuration:', error);
      toast.error('Erreur lors du chargement de la configuration');
      return null;
    }
  }

  static async createConfiguration(
    configData: CreateCloudAssetConfigurationData,
    user: User,
    userProfile: UserProfile | null
  ): Promise<boolean> {
    try {
      // Vérifier que l'utilisateur a accès à l'équipe
      if (!userProfile?.is_msp_admin && userProfile?.default_team_id) {
        if (configData.team_id !== userProfile.default_team_id) {
          toast.error('Vous n\'avez pas les permissions pour créer cette configuration');
          return false;
        }
      }

      const { error } = await supabase
        .from('cloud_asset_configurations')
        .insert([{
          ...configData,
          collected_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error creating cloud asset configuration:', error);
        toast.error('Erreur lors de la création de la configuration');
        return false;
      }

      toast.success('Configuration créée avec succès');
      return true;
    } catch (error) {
      console.error('Error creating cloud asset configuration:', error);
      toast.error('Erreur lors de la création de la configuration');
      return false;
    }
  }

  static async updateConfiguration(
    id: string,
    updates: UpdateCloudAssetConfigurationData,
    user: User,
    userProfile: UserProfile | null
  ): Promise<boolean> {
    try {
      let query = supabase
        .from('cloud_asset_configurations')
        .update(updates)
        .eq('id', id);

      // Filtrage par équipe si pas admin MSP
      if (!userProfile?.is_msp_admin && userProfile?.default_team_id) {
        query = query.eq('team_id', userProfile.default_team_id);
      }

      const { error } = await query;

      if (error) {
        console.error('Error updating cloud asset configuration:', error);
        toast.error('Erreur lors de la mise à jour de la configuration');
        return false;
      }

      toast.success('Configuration mise à jour avec succès');
      return true;
    } catch (error) {
      console.error('Error updating cloud asset configuration:', error);
      toast.error('Erreur lors de la mise à jour de la configuration');
      return false;
    }
  }

  static async deleteConfiguration(
    id: string,
    user: User,
    userProfile: UserProfile | null
  ): Promise<boolean> {
    try {
      let query = supabase
        .from('cloud_asset_configurations')
        .delete()
        .eq('id', id);

      // Filtrage par équipe si pas admin MSP
      if (!userProfile?.is_msp_admin && userProfile?.default_team_id) {
        query = query.eq('team_id', userProfile.default_team_id);
      }

      const { error } = await query;

      if (error) {
        console.error('Error deleting cloud asset configuration:', error);
        toast.error('Erreur lors de la suppression de la configuration');
        return false;
      }

      toast.success('Configuration supprimée avec succès');
      return true;
    } catch (error) {
      console.error('Error deleting cloud asset configuration:', error);
      toast.error('Erreur lors de la suppression de la configuration');
      return false;
    }
  }

  static async getLatestConfiguration(
    assetId: string,
    user: User,
    userProfile: UserProfile | null
  ): Promise<CloudAssetConfiguration | null> {
    try {
      let query = supabase
        .from('cloud_asset_configurations')
        .select('*')
        .eq('asset_id', assetId)
        .order('collected_at', { ascending: false })
        .limit(1)
        .single();

      // Filtrage par équipe si pas admin MSP
      if (!userProfile?.is_msp_admin && userProfile?.default_team_id) {
        query = query.eq('team_id', userProfile.default_team_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching latest configuration:', error);
        return null;
      }

      return data as CloudAssetConfiguration;
    } catch (error) {
      console.error('Error fetching latest configuration:', error);
      return null;
    }
  }

  static async getConfigurationHistory(
    assetId: string,
    user: User,
    userProfile: UserProfile | null,
    limit: number = 10
  ): Promise<CloudAssetConfiguration[]> {
    try {
      let query = supabase
        .from('cloud_asset_configurations')
        .select('*')
        .eq('asset_id', assetId)
        .order('collected_at', { ascending: false })
        .limit(limit);

      // Filtrage par équipe si pas admin MSP
      if (!userProfile?.is_msp_admin && userProfile?.default_team_id) {
        query = query.eq('team_id', userProfile.default_team_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching configuration history:', error);
        return [];
      }

      return (data || []) as CloudAssetConfiguration[];
    } catch (error) {
      console.error('Error fetching configuration history:', error);
      return [];
    }
  }

  static async getConfigurationStats(
    user: User,
    userProfile: UserProfile | null
  ): Promise<{
    total_configurations: number;
    configurations_by_os: Record<string, number>;
    recent_configurations: number;
    outdated_configurations: number;
  }> {
    try {
      let query = supabase
        .from('cloud_asset_configurations')
        .select('os, collected_at');

      // Filtrage par équipe si pas admin MSP
      if (!userProfile?.is_msp_admin && userProfile?.default_team_id) {
        query = query.eq('team_id', userProfile.default_team_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching configuration stats:', error);
        return {
          total_configurations: 0,
          configurations_by_os: {},
          recent_configurations: 0,
          outdated_configurations: 0
        };
      }

      const configurations = data || [];
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const configurations_by_os = configurations.reduce((acc: Record<string, number>, config: any) => {
        const os = config.os || 'Unknown';
        acc[os] = (acc[os] || 0) + 1;
        return acc;
      }, {});

      const recent_configurations = configurations.filter((config: any) => 
        new Date(config.collected_at) >= oneWeekAgo
      ).length;

      const outdated_configurations = configurations.filter((config: any) => 
        new Date(config.collected_at) < oneMonthAgo
      ).length;

      return {
        total_configurations: configurations.length,
        configurations_by_os,
        recent_configurations,
        outdated_configurations
      };
    } catch (error) {
      console.error('Error fetching configuration stats:', error);
      return {
        total_configurations: 0,
        configurations_by_os: {},
        recent_configurations: 0,
        outdated_configurations: 0
      };
    }
  }
} 