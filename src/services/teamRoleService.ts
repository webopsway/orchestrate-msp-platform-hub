import { supabase } from '@/integrations/supabase/client';
import type { TeamRole } from '@/integrations/supabase/types';

export class TeamRoleService {
  static async list(): Promise<TeamRole[]> {
    const { data, error } = await supabase
      .from('team_roles')
      .select('*')
      .order('display_name', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async create(payload: Partial<TeamRole>) {
    const { data, error } = await supabase
      .from('team_roles')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async update(id: string, payload: Partial<TeamRole>) {
    const { data, error } = await supabase
      .from('team_roles')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async remove(id: string) {
    const { error } = await supabase
      .from('team_roles')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
} 