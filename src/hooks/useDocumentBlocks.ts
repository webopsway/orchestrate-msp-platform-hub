import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { DocumentContentBlock } from "@/types/documentBlocks";

export const useDocumentBlocks = (documentId?: string) => {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState<DocumentContentBlock[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBlocks = async () => {
    if (!documentId) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('document_content_blocks')
        .select('*')
        .eq('document_id', documentId)
        .order('position', { ascending: true });

      if (error) throw error;
      setBlocks((data || []) as DocumentContentBlock[]);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      toast.error('Erreur lors du chargement des blocs');
    } finally {
      setLoading(false);
    }
  };

  const createBlock = async (blockData: Omit<DocumentContentBlock, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    if (!user || !documentId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('document_content_blocks')
        .insert({
          ...blockData,
          document_id: documentId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Bloc créé avec succès');
      await fetchBlocks();
      return data;
    } catch (error) {
      console.error('Error creating block:', error);
      toast.error('Erreur lors de la création du bloc');
    } finally {
      setLoading(false);
    }
  };

  const updateBlock = async (blockId: string, updates: Partial<DocumentContentBlock>) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('document_content_blocks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', blockId);

      if (error) throw error;

      toast.success('Bloc mis à jour');
      await fetchBlocks();
    } catch (error) {
      console.error('Error updating block:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const deleteBlock = async (blockId: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('document_content_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      toast.success('Bloc supprimé');
      await fetchBlocks();
    } catch (error) {
      console.error('Error deleting block:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const reorderBlocks = async (newBlocks: DocumentContentBlock[]) => {
    try {
      setLoading(true);

      const updates = newBlocks.map((block, index) => ({
        id: block.id,
        position: index
      }));

      for (const update of updates) {
        await supabase
          .from('document_content_blocks')
          .update({ position: update.position })
          .eq('id', update.id);
      }

      toast.success('Ordre des blocs mis à jour');
      await fetchBlocks();
    } catch (error) {
      console.error('Error reordering blocks:', error);
      toast.error('Erreur lors de la réorganisation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchBlocks();
    }
  }, [documentId]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user || !documentId) return;

    const channel = supabase
      .channel('document_blocks_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_content_blocks',
          filter: `document_id=eq.${documentId}`
        },
        () => {
          fetchBlocks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, documentId]);

  return {
    blocks,
    loading,
    fetchBlocks,
    createBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
  };
};