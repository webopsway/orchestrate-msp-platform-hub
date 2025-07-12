import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ServiceRequest } from '@/types/serviceRequest';
import type { UserProfile } from '@/contexts/AuthContext';

export class ServiceRequestService {
  static async fetchRequests(
    user: any, 
    userProfile: UserProfile | null
  ): Promise<ServiceRequest[]> {
    try {
      // Vérifier l'authentification
      if (!user) {
        console.warn('Utilisateur non connecté');
        return [];
      }
      
      // MSP admin peut voir toutes les demandes, autres voient par team
      let query = supabase.from('itsm_service_requests').select(`
        *,
        requested_by_profile:requested_by(email, first_name, last_name),
        assigned_to_profile:assigned_to(email, first_name, last_name)
      `);
      
      // Filter by team if not MSP admin
      if (!userProfile?.is_msp_admin && userProfile?.default_team_id) {
        query = query.eq('team_id', userProfile.default_team_id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des demandes:', error);
        toast.error('Erreur lors du chargement des demandes');
        return [];
      }
      
      return (data || []) as unknown as ServiceRequest[];
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes:', error);
      toast.error('Erreur lors du chargement des demandes');
      return [];
    }
  }

  static async createRequest(
    requestData: Partial<ServiceRequest>, 
    user: any, 
    userProfile: UserProfile | null
  ): Promise<boolean> {
    try {
      // Vérifier l'authentification
      if (!user) {
        toast.error('Vous devez être connecté pour créer une demande');
        return false;
      }

      if (!userProfile?.default_team_id && !userProfile?.is_msp_admin) {
        toast.error('Équipe non sélectionnée ou permissions insuffisantes');
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
          team_id: userProfile?.default_team_id || ''
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création de la demande:', error);
        toast.error('Erreur lors de la création de la demande');
        return false;
      }
      
      toast.success('Demande créée avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de la création de la demande:', error);
      toast.error('Erreur lors de la création');
      return false;
    }
  }

  static async updateRequest(
    id: string, 
    updates: Partial<ServiceRequest>, 
    user: any
  ): Promise<boolean> {
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
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la demande:', error);
      toast.error('Erreur lors de la mise à jour');
      return false;
    }
  }

  static async deleteRequest(id: string, user: any): Promise<boolean> {
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
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la demande:', error);
      toast.error('Erreur lors de la suppression');
      return false;
    }
  }

  static async assignRequest(
    id: string, 
    assigneeId: string | null, 
    user: any
  ): Promise<boolean> {
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
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'assignation de la demande:', error);
      toast.error('Erreur lors de l\'assignation');
      return false;
    }
  }

  static async updateStatus(
    id: string, 
    status: ServiceRequest['status'], 
    user: any
  ): Promise<boolean> {
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
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
      return false;
    }
  }
}