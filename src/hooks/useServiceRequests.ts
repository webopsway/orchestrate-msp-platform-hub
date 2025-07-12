import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ServiceRequest {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  impact: 'low' | 'medium' | 'high' | 'critical';
  service_category: string;
  resolution?: string;
  due_date?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  requested_by: string;
  assigned_to?: string;
  team_id: string;
  requested_by_profile?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  assigned_to_profile?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export const useServiceRequests = () => {
  const { user, sessionContext } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      
      // Vérifier l'authentification
      if (!user) {
        console.warn('Utilisateur non connecté');
        setRequests([]);
        return;
      }
      
      // MSP admin peut voir toutes les demandes, autres voient par team
      let query = supabase.from('itsm_service_requests').select(`
        *,
        requested_by_profile:requested_by(email, first_name, last_name),
        assigned_to_profile:assigned_to(email, first_name, last_name)
      `);
      
      const teamId = sessionContext?.current_team_id;
      if (teamId && !sessionContext?.is_msp) {
        query = query.eq('team_id', teamId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des demandes:', error);
        toast.error('Erreur lors du chargement des demandes');
        setRequests([]);
        return;
      }
      
      setRequests(data as ServiceRequest[] || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes:', error);
      toast.error('Erreur lors du chargement des demandes');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [user, sessionContext?.current_team_id, sessionContext?.is_msp]);

  const createRequest = useCallback(async (requestData: Partial<ServiceRequest>) => {
    try {
      // Vérifier l'authentification
      if (!user) {
        toast.error('Vous devez être connecté pour créer une demande');
        return false;
      }

      const teamId = sessionContext?.current_team_id;
      if ((!teamId && !sessionContext?.is_msp) || !user) {
        toast.error('Session non valide ou équipe non sélectionnée');
        return false;
      }

      // Validation des données
      if (!requestData.title?.trim()) {
        toast.error('Le titre est obligatoire');
        return false;
      }

      const { data, error } = await supabase
        .from('itsm_service_requests')
        .insert({
          title: requestData.title.trim(),
          description: requestData.description?.trim(),
          priority: requestData.priority || 'medium',
          urgency: requestData.urgency || 'medium',
          impact: requestData.impact || 'medium',
          service_category: requestData.service_category || 'general',
          due_date: requestData.due_date,
          requested_by: user.id,
          team_id: teamId || sessionContext?.current_organization_id || ''
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création de la demande:', error);
        toast.error('Erreur lors de la création de la demande');
        return false;
      }
      
      toast.success('Demande créée avec succès');
      await fetchRequests();
      return true;
    } catch (error) {
      console.error('Erreur lors de la création de la demande:', error);
      toast.error('Erreur lors de la création');
      return false;
    }
  }, [user, sessionContext, fetchRequests]);

  const updateRequest = useCallback(async (id: string, updates: Partial<ServiceRequest>) => {
    try {
      // Vérifier l'authentification
      if (!user) {
        toast.error('Vous devez être connecté pour modifier une demande');
        return false;
      }

      // Validation des données
      if (updates.title && !updates.title.trim()) {
        toast.error('Le titre ne peut pas être vide');
        return false;
      }

      const { error } = await supabase
        .from('itsm_service_requests')
        .update({
          ...updates,
          title: updates.title?.trim(),
          description: updates.description?.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la mise à jour de la demande:', error);
        toast.error('Erreur lors de la mise à jour');
        return false;
      }
      
      toast.success('Demande mise à jour');
      await fetchRequests();
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la demande:', error);
      toast.error('Erreur lors de la mise à jour');
      return false;
    }
  }, [user, fetchRequests]);

  const deleteRequest = useCallback(async (id: string) => {
    try {
      // Vérifier l'authentification
      if (!user) {
        toast.error('Vous devez être connecté pour supprimer une demande');
        return false;
      }

      const { error } = await supabase
        .from('itsm_service_requests')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la suppression de la demande:', error);
        toast.error('Erreur lors de la suppression');
        return false;
      }
      
      toast.success('Demande supprimée');
      await fetchRequests();
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la demande:', error);
      toast.error('Erreur lors de la suppression');
      return false;
    }
  }, [user, fetchRequests]);

  const assignRequest = useCallback(async (id: string, assigneeId: string | null) => {
    try {
      // Vérifier l'authentification
      if (!user) {
        toast.error('Vous devez être connecté pour assigner une demande');
        return false;
      }

      const { error } = await supabase
        .from('itsm_service_requests')
        .update({ 
          assigned_to: assigneeId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de l\'assignation de la demande:', error);
        toast.error('Erreur lors de l\'assignation');
        return false;
      }
      
      toast.success(assigneeId ? 'Demande assignée' : 'Assignation supprimée');
      await fetchRequests();
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'assignation de la demande:', error);
      toast.error('Erreur lors de l\'assignation');
      return false;
    }
  }, [user, fetchRequests]);

  const updateStatus = useCallback(async (id: string, status: ServiceRequest['status']) => {
    try {
      // Vérifier l'authentification
      if (!user) {
        toast.error('Vous devez être connecté pour modifier le statut');
        return false;
      }

      const updates: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      // Auto-set resolved_at when marking as resolved or closed
      if (status === 'resolved' || status === 'closed') {
        updates.resolved_at = new Date().toISOString();
      } else {
        updates.resolved_at = null;
      }

      const { error } = await supabase
        .from('itsm_service_requests')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        toast.error('Erreur lors de la mise à jour du statut');
        return false;
      }
      
      toast.success('Statut mis à jour');
      await fetchRequests();
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
      return false;
    }
  }, [user, fetchRequests]);

  useEffect(() => {
    if (user && (sessionContext?.current_team_id || sessionContext?.is_msp)) {
      fetchRequests();
    } else if (!user) {
      setRequests([]);
      setLoading(false);
    }
  }, [user, sessionContext?.current_team_id, sessionContext?.is_msp, fetchRequests]);

  return {
    requests,
    loading,
    fetchRequests,
    createRequest,
    updateRequest,
    deleteRequest,
    assignRequest,
    updateStatus
  };
};