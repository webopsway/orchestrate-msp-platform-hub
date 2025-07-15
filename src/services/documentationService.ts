import { supabase } from '@/integrations/supabase/client';
import type { Documentation } from '@/integrations/supabase/types';

export class DocumentationService {
  static async list(teamId: string): Promise<Documentation[]> {
    const { data, error } = await supabase
      .from('documentation')
      .select('*')
      .eq('team_id', teamId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async get(id: string): Promise<Documentation | null> {
    const { data, error } = await supabase
      .from('documentation')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  static async create(payload: Partial<Documentation>) {
    const { data, error } = await supabase
      .from('documentation')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async update(id: string, payload: Partial<Documentation>) {
    const { data, error } = await supabase
      .from('documentation')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async remove(id: string) {
    const { error } = await supabase
      .from('documentation')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
} 