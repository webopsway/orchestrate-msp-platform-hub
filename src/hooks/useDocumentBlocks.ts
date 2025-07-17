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

      // Optimistic update - add to local state
      setBlocks(prevBlocks => [...prevBlocks, data as DocumentContentBlock].sort((a, b) => a.position - b.position));
      
      return data;
    } catch (error) {
      console.error('Error creating block:', error);
      toast.error('Erreur lors de la création du bloc');
    }
  };

  const updateBlock = async (blockId: string, updates: Partial<DocumentContentBlock>) => {
    try {
      // Optimistic update - update local state first
      setBlocks(prevBlocks => 
        prevBlocks.map(block => 
          block.id === blockId 
            ? { ...block, ...updates, updated_at: new Date().toISOString() }
            : block
        )
      );

      const { error } = await supabase
        .from('document_content_blocks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', blockId);

      if (error) {
        // Revert optimistic update on error
        await fetchBlocks();
        throw error;
      }

      // No need to fetch again, state is already updated optimistically
    } catch (error) {
      console.error('Error updating block:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const deleteBlock = async (blockId: string) => {
    try {
      // Optimistic update - remove from local state first
      setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== blockId));

      const { error } = await supabase
        .from('document_content_blocks')
        .delete()
        .eq('id', blockId);

      if (error) {
        // Revert optimistic update on error
        await fetchBlocks();
        throw error;
      }

      // No need to fetch again, state is already updated optimistically
    } catch (error) {
      console.error('Error deleting block:', error);
      toast.error('Erreur lors de la suppression');
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