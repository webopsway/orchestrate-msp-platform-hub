import { supabase } from '@/integrations/supabase/client';
import type { OrganizationType } from '@/integrations/supabase/types';

export class OrganizationTypeService {
  static async list(): Promise<OrganizationType[]> {
    const { data, error } = await supabase
      .from('organization_types')
      .select('*')
      .order('display_name', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async create(payload: Partial<OrganizationType>) {
    const { data, error } = await supabase
      .from('organization_types')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async update(id: string, payload: Partial<OrganizationType>) {
    const { data, error } = await supabase
      .from('organization_types')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async remove(id: string) {
    const { error } = await supabase
      .from('organization_types')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
} 