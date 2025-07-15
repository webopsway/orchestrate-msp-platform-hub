import { supabase } from '@/integrations/supabase/client';
import type { UserRoleCatalog } from '@/integrations/supabase/types';

export class UserRoleCatalogService {
  static async list(): Promise<UserRoleCatalog[]> {
    const { data, error } = await supabase
      .from('user_roles_catalog')
      .select('*')
      .order('display_name', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async create(payload: Partial<UserRoleCatalog>) {
    const { data, error } = await supabase
      .from('user_roles_catalog')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async update(id: string, payload: Partial<UserRoleCatalog>) {
    const { data, error } = await supabase
      .from('user_roles_catalog')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async remove(id: string) {
    const { error } = await supabase
      .from('user_roles_catalog')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
} 