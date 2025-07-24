import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Role = Database['public']['Tables']['roles']['Row'];
type RoleInsert = Database['public']['Tables']['roles']['Insert'];
type RoleUpdate = Database['public']['Tables']['roles']['Update'];

export class RoleService {
  static async create(data: RoleInsert): Promise<Role> {
    const { data: role, error } = await supabase
      .from('roles')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return role;
  }

  static async update(id: string, data: RoleUpdate): Promise<Role> {
    const { data: role, error } = await supabase
      .from('roles')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return role;
  }

  static async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getAll(): Promise<Role[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('display_name');

    if (error) throw error;
    return data || [];
  }

  static async getById(id: string): Promise<Role | null> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}