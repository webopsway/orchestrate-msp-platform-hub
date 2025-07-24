import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/contexts/AuthContext';

export class CloudAssetService {
  static async getAssetConfigurations(assetId: string, user: User, userProfile: UserProfile | null) {
    try {
      let query = supabase
        .from('cloud_asset_configurations')
        .select('*')
        .eq('asset_id', assetId)
        .order('collected_at', { ascending: false });

      // Filtrage par équipe si pas admin MSP
      if (!userProfile?.is_msp_admin && userProfile?.default_team_id) {
        query = query.eq('team_id', userProfile.default_team_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching asset configurations:', error);
        toast.error('Erreur lors du chargement des configurations');
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching asset configurations:', error);
      toast.error('Erreur lors du chargement des configurations');
      return [];
    }
  }

  static async getAssetConfigurationHistory(
    assetId: string,
    user: User,
    userProfile: UserProfile | null,
    limit: number = 10
  ) {
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

      return data || [];
    } catch (error) {
      console.error('Error fetching configuration history:', error);
      return [];
    }
  }
}