import { supabase } from '@/integrations/supabase/client';
import type { CloudAssetConfiguration } from '@/integrations/supabase/types';

export class CloudAssetConfigurationService {
  static async list(teamId: string): Promise<CloudAssetConfiguration[]> {
    const { data, error } = await supabase
      .from('cloud_asset_configurations')
      .select('*')
      .eq('team_id', teamId)
      .order('collected_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async get(id: string): Promise<CloudAssetConfiguration | null> {
    const { data, error } = await supabase
      .from('cloud_asset_configurations')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  static async create(payload: Partial<CloudAssetConfiguration>) {
    const { data, error } = await supabase
      .from('cloud_asset_configurations')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async update(id: string, payload: Partial<CloudAssetConfiguration>) {
    const { data, error } = await supabase
      .from('cloud_asset_configurations')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async remove(id: string) {
    const { error } = await supabase
      .from('cloud_asset_configurations')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
} 