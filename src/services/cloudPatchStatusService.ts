import { supabase } from '@/integrations/supabase/client';
import type { CloudPatchStatus } from '@/integrations/supabase/types';

export class CloudPatchStatusService {
  static async list(teamId: string): Promise<CloudPatchStatus[]> {
    const { data, error } = await supabase
      .from('cloud_patch_status')
      .select('*')
      .eq('team_id', teamId)
      .order('collected_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async get(id: string): Promise<CloudPatchStatus | null> {
    const { data, error } = await supabase
      .from('cloud_patch_status')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  static async create(payload: Partial<CloudPatchStatus>) {
    const { data, error } = await supabase
      .from('cloud_patch_status')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async update(id: string, payload: Partial<CloudPatchStatus>) {
    const { data, error } = await supabase
      .from('cloud_patch_status')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async remove(id: string) {
    const { error } = await supabase
      .from('cloud_patch_status')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
} 