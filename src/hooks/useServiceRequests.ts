import { useState, useEffect } from 'react';
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
  const { sessionContext, user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('itsm_service_requests')
        .select(`
          *,
          requested_by_profile:requested_by(email, first_name, last_name),
          assigned_to_profile:assigned_to(email, first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data as any || []);
    } catch (error) {
      console.error('Error fetching service requests:', error);
      toast.error('Erreur lors du chargement des demandes');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async (requestData: Partial<ServiceRequest>) => {
    try {
      if (!sessionContext?.current_team_id || !user) {
        throw new Error('Session non valide');
      }

      const { data, error } = await supabase
        .from('itsm_service_requests')
        .insert({
          title: requestData.title || '',
          description: requestData.description,
          priority: requestData.priority || 'medium',
          urgency: requestData.urgency || 'medium',
          impact: requestData.impact || 'medium',
          service_category: requestData.service_category || 'general',
          due_date: requestData.due_date,
          requested_by: user.id,
          team_id: sessionContext.current_team_id
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Demande créée avec succès');
      fetchRequests();
      return true;
    } catch (error) {
      console.error('Error creating service request:', error);
      toast.error('Erreur lors de la création');
      return false;
    }
  };

  const updateRequest = async (id: string, updates: Partial<ServiceRequest>) => {
    try {
      const { error } = await supabase
        .from('itsm_service_requests')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Demande mise à jour');
      fetchRequests();
      return true;
    } catch (error) {
      console.error('Error updating service request:', error);
      toast.error('Erreur lors de la mise à jour');
      return false;
    }
  };

  const deleteRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('itsm_service_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Demande supprimée');
      fetchRequests();
      return true;
    } catch (error) {
      console.error('Error deleting service request:', error);
      toast.error('Erreur lors de la suppression');
      return false;
    }
  };

  const assignRequest = async (id: string, assigneeId: string | null) => {
    try {
      const { error } = await supabase
        .from('itsm_service_requests')
        .update({ assigned_to: assigneeId })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(assigneeId ? 'Demande assignée' : 'Assignation supprimée');
      fetchRequests();
      return true;
    } catch (error) {
      console.error('Error assigning service request:', error);
      toast.error('Erreur lors de l\'assignation');
      return false;
    }
  };

  const updateStatus = async (id: string, status: ServiceRequest['status']) => {
    try {
      const updates: any = { status };
      
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

      if (error) throw error;
      
      toast.success('Statut mis à jour');
      fetchRequests();
      return true;
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
      return false;
    }
  };

  useEffect(() => {
    if (sessionContext?.current_team_id) {
      fetchRequests();
    }
  }, [sessionContext?.current_team_id]);

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