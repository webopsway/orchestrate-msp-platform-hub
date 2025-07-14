import { supabase } from '@/integrations/supabase/client';
import type { TeamDocument } from '@/integrations/supabase/types';

export class TeamDocumentService {
  static async list(teamId: string): Promise<TeamDocument[]> {
    const { data, error } = await supabase
      .from('team_documents')
      .select('*')
      .eq('team_id', teamId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async get(id: string): Promise<TeamDocument | null> {
    const { data, error } = await supabase
      .from('team_documents')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  static async create(payload: Partial<TeamDocument>) {
    const { data, error } = await supabase
      .from('team_documents')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async update(id: string, payload: Partial<TeamDocument>) {
    const { data, error } = await supabase
      .from('team_documents')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async remove(id: string) {
    const { error } = await supabase
      .from('team_documents')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
} 