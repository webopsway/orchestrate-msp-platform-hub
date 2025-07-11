import { supabase } from '@/integrations/supabase/client';
import { sessionService } from './sessionService';
import type { Database } from '@/integrations/supabase/types';

type CloudAsset = Database['public']['Tables']['cloud_asset']['Row'];
type CloudProvider = Database['public']['Tables']['cloud_providers']['Row'];
type CloudCredentials = Database['public']['Tables']['cloud_credentials']['Row'];

export interface CloudAssetWithProvider extends CloudAsset {
  cloud_providers?: CloudProvider;
}

class CloudService {
  private static instance: CloudService;

  static getInstance(): CloudService {
    if (!CloudService.instance) {
      CloudService.instance = new CloudService();
    }
    return CloudService.instance;
  }

  // Get cloud assets for current team
  async getAssets(): Promise<CloudAssetWithProvider[]> {
    const teamId = sessionService.getCurrentTeamId();
    if (!teamId) return [];

    try {
      const { data, error } = await supabase
        .from('cloud_asset')
        .select(`
          *,
          cloud_providers(*)
        `)
        .eq('team_id', teamId)
        .order('discovered_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch cloud assets:', error);
      throw error;
    }
  }

  // Get cloud providers
  async getProviders(): Promise<CloudProvider[]> {
    try {
      const { data, error } = await supabase
        .from('cloud_providers')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch cloud providers:', error);
      throw error;
    }
  }

  // Get credentials for current team
  async getCredentials(): Promise<CloudCredentials[]> {
    const teamId = sessionService.getCurrentTeamId();
    if (!teamId) return [];

    try {
      const { data, error } = await supabase
        .from('cloud_credentials')
        .select('*')
        .eq('team_id', teamId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch cloud credentials:', error);
      throw error;
    }
  }

  // Trigger inventory refresh
  async refreshInventory(providerId?: string): Promise<string[]> {
    const teamId = sessionService.getCurrentTeamId();
    if (!teamId) throw new Error('No team selected');

    try {
      const credentials = await this.getCredentials();
      const providersToRefresh = providerId 
        ? credentials.filter(c => c.provider_id === providerId)
        : credentials;

      const executionIds: string[] = [];

      for (const credential of providersToRefresh) {
        const { data, error } = await supabase.rpc('trigger_team_inventory', {
          p_team_id: teamId,
          p_provider_id: credential.provider_id
        });

        if (error) {
          console.error(`Failed to trigger inventory for provider ${credential.provider_id}:`, error);
          continue;
        }

        if (data) {
          executionIds.push(data);
        }
      }

      return executionIds;
    } catch (error) {
      console.error('Failed to refresh inventory:', error);
      throw error;
    }
  }

  // Save or update credentials
  async saveCredentials(providerId: string, config: Record<string, any>): Promise<CloudCredentials> {
    const teamId = sessionService.getCurrentTeamId();
    const userProfile = sessionService.getUserProfile();
    
    if (!teamId || !userProfile) {
      throw new Error('Session not properly initialized');
    }

    try {
      const { data, error } = await supabase
        .from('cloud_credentials')
        .upsert({
          team_id: teamId,
          provider_id: providerId,
          config,
          configured_by: userProfile.id
        }, {
          onConflict: 'team_id,provider_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to save credentials:', error);
      throw error;
    }
  }
}

export const cloudService = CloudService.getInstance();