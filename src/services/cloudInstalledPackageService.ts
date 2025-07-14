import { supabase } from '@/integrations/supabase/client';
import type { CloudInstalledPackage } from '@/integrations/supabase/types';

export class CloudInstalledPackageService {
  static async list(teamId: string): Promise<CloudInstalledPackage[]> {
    const { data, error } = await supabase
      .from('cloud_installed_packages')
      .select('*')
      .eq('team_id', teamId)
      .order('collected_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async get(id: string): Promise<CloudInstalledPackage | null> {
    const { data, error } = await supabase
      .from('cloud_installed_packages')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  static async create(payload: Partial<CloudInstalledPackage>) {
    const { data, error } = await supabase
      .from('cloud_installed_packages')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async update(id: string, payload: Partial<CloudInstalledPackage>) {
    const { data, error } = await supabase
      .from('cloud_installed_packages')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async remove(id: string) {
    const { error } = await supabase
      .from('cloud_installed_packages')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
} 