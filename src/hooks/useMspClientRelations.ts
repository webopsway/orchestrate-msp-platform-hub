import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MspClientRelation {
  id: string;
  msp_organization_id: string;
  client_organization_id: string;
  esn_organization_id?: string | null;
  relation_type: string;
  start_date: string;
  end_date?: string | null;
  is_active: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
  created_by: string;
  // Relations jointes
  msp_organization?: {
    id: string;
    name: string;
    is_msp: boolean;
  };
  client_organization?: {
    id: string;
    name: string;
    is_msp: boolean;
  };
  esn_organization?: {
    id: string;
    name: string;
    is_msp: boolean;
  } | null;
  creator?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
  };
}

export interface CreateMspClientRelationData {
  msp_organization_id: string;
  client_organization_id: string;
  esn_organization_id?: string;
  relation_type: 'direct' | 'via_esn';
  start_date: string;
  end_date?: string;
  metadata?: any;
}

export const useMspClientRelations = () => {
  const { userProfile, user } = useAuth();
  const [relations, setRelations] = useState<MspClientRelation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRelations = async () => {
    if (!user) {
      setRelations([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // MSP admin peut voir toutes les relations, sinon on n'affiche rien
      if (!userProfile?.is_msp_admin) {
        setRelations([]);
        return;
      }

        const { data, error: fetchError } = await supabase
          .from('msp_client_relations')
          .select(`
            *,
            msp_organization:organizations!msp_organization_id(id, name, is_msp),
            client_organization:organizations!client_organization_id(id, name, is_msp),
            esn_organization:organizations!esn_organization_id(id, name, is_msp),
            creator:profiles!created_by(id, first_name, last_name, email)
          `)
          .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setRelations(data || []);
    } catch (err: any) {
      console.error('Error fetching MSP client relations:', err);
      setError(err.message);
      toast.error('Erreur lors du chargement des relations MSP-Client');
    } finally {
      setLoading(false);
    }
  };

  const createRelation = async (data: CreateMspClientRelationData): Promise<boolean> => {
    if (!userProfile?.is_msp_admin) {
      toast.error('Seuls les admins MSP peuvent créer des relations');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: createError } = await supabase
        .from('msp_client_relations')
        .insert({
          ...data,
          created_by: user?.id || ''
        });

      if (createError) throw createError;

      toast.success('Relation MSP-Client créée avec succès');
      await fetchRelations();
      return true;
    } catch (err: any) {
      console.error('Error creating MSP client relation:', err);
      setError(err.message);
      toast.error('Erreur lors de la création de la relation');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateRelation = async (id: string, data: Partial<CreateMspClientRelationData>): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('msp_client_relations')
        .update(data)
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Relation MSP-Client mise à jour avec succès');
      await fetchRelations();
      return true;
    } catch (err: any) {
      console.error('Error updating MSP client relation:', err);
      setError(err.message);
      toast.error('Erreur lors de la mise à jour de la relation');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteRelation = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('msp_client_relations')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast.success('Relation MSP-Client supprimée avec succès');
      await fetchRelations();
      return true;
    } catch (err: any) {
      console.error('Error deleting MSP client relation:', err);
      setError(err.message);
      toast.error('Erreur lors de la suppression de la relation');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const activateRelation = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('msp_client_relations')
        .update({ is_active: true })
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Relation activée avec succès');
      await fetchRelations();
      return true;
    } catch (err: any) {
      console.error('Error activating relation:', err);
      setError(err.message);
      toast.error('Erreur lors de l\'activation');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deactivateRelation = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('msp_client_relations')
        .update({ is_active: false })
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Relation désactivée avec succès');
      await fetchRelations();
      return true;
    } catch (err: any) {
      console.error('Error deactivating relation:', err);
      setError(err.message);
      toast.error('Erreur lors de la désactivation');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRelations();
    }
  }, [user, userProfile?.is_msp_admin]);

  return {
    relations,
    loading,
    error,
    fetchRelations,
    createRelation,
    updateRelation,
    deleteRelation,
    activateRelation,
    deactivateRelation,
    clearError: () => setError(null)
  };
};