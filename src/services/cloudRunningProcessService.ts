import { supabase } from '@/integrations/supabase/client';
import type { CloudRunningProcess } from '@/integrations/supabase/types';

export class CloudRunningProcessService {
  static async list(teamId: string): Promise<CloudRunningProcess[]> {
    const { data, error } = await supabase
      .from('cloud_running_processes')
      .select('*')
      .eq('team_id', teamId)
      .order('collected_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async get(id: string): Promise<CloudRunningProcess | null> {
    const { data, error } = await supabase
      .from('cloud_running_processes')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  static async create(payload: Partial<CloudRunningProcess>) {
    const { data, error } = await supabase
      .from('cloud_running_processes')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async update(id: string, payload: Partial<CloudRunningProcess>) {
    const { data, error } = await supabase
      .from('cloud_running_processes')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async remove(id: string) {
    const { error } = await supabase
      .from('cloud_running_processes')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
} 