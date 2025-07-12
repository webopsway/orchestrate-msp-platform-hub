import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

export type Documentation = Tables<'documentation'>;

export const useDocumentation = () => {
  const { user, sessionContext } = useAuth();
  const [documents, setDocuments] = useState<Documentation[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all documents for the current team
  const fetchDocuments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // MSP admin peut voir tous les documents, autres voient par team
      let query = supabase.from('documentation').select('*');
      const teamId = sessionContext?.current_team_id;
      
      if (teamId && !sessionContext?.is_msp) {
        query = query.eq('team_id', teamId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a new document
  const createDocument = async (document: Partial<Documentation> & { team_id?: string }) => {
    if (!user) return;

    try {
      setLoading(true);

      let targetTeamId = document.team_id;
      
      if (!targetTeamId) {
        // Utiliser l'équipe courante ou l'organisation par défaut pour MSP admin
        targetTeamId = sessionContext?.current_team_id || sessionContext?.current_organization_id;
      }

      if (!targetTeamId) {
        throw new Error('No team context available');
      }

      const { data, error } = await supabase
        .from('documentation')
        .insert({
          team_id: targetTeamId,
          title: document.title!,
          content: document.content || '',
          version: document.version || '1.0',
          created_by: user.id,
          metadata: document.metadata || {}
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Document créé avec succès",
      });

      await fetchDocuments();
      return data;
    } catch (error) {
      console.error('Error creating document:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le document",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing document
  const updateDocument = async (id: string, updates: Partial<Documentation>) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('documentation')
        .update({
          ...updates,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Document mis à jour",
      });

      await fetchDocuments();
    } catch (error) {
      console.error('Error updating document:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete a document
  const deleteDocument = async (id: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('documentation')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Document supprimé",
      });

      await fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a new version of a document
  const createVersion = async (documentId: string, newTitle?: string, newContent?: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('create_document_version', {
        doc_id: documentId,
        new_title: newTitle,
        new_content: newContent
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Nouvelle version créée",
      });

      await fetchDocuments();
      return data;
    } catch (error) {
      console.error('Error creating version:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer une nouvelle version",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate document (PDF or Markdown)
  const generateDocument = async (documentId: string, format: 'pdf' | 'markdown') => {
    try {
      setLoading(true);

      const currentTeamId = sessionContext?.current_team_id;

      const { data, error } = await supabase.functions.invoke('generate-document', {
        body: {
          document_id: documentId,
          format,
          team_id: currentTeamId
        }
      });

      if (error) throw error;

      if (data?.download_url) {
        // Open download URL in new tab
        window.open(data.download_url, '_blank');
        
        toast({
          title: "Document généré",
          description: `${format.toUpperCase()} généré avec succès`,
        });

        return data;
      } else {
        throw new Error('No download URL received');
      }
    } catch (error) {
      console.error('Error generating document:', error);
      toast({
        title: "Erreur",
        description: `Impossible de générer le ${format.toUpperCase()}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('documentation_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documentation'
        },
        () => {
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    documents,
    loading,
    fetchDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    createVersion,
    generateDocument,
  };
};