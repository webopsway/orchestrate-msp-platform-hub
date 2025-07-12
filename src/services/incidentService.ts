import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/contexts/AuthContext';
import type { Incident, CreateIncidentData, UpdateIncidentData } from '@/types/incident';
import { toast } from 'sonner';

export class IncidentService {
  static async fetchIncidents(user: User, userProfile: UserProfile | null): Promise<Incident[]> {
    console.log('🔍 Debug IncidentService.fetchIncidents:');
    console.log('User:', user.id);
    console.log('UserProfile:', userProfile);
    console.log('Is MSP Admin:', userProfile?.is_msp_admin);
    console.log('Default Team ID:', userProfile?.default_team_id);

    try {
      let query = supabase
        .from('itsm_incidents')
        .select(`
          *,
          created_by_profile:created_by(email, first_name, last_name),
          assigned_to_profile:assigned_to(email, first_name, last_name)
        `);

      // Filter by team if not MSP admin
      if (!userProfile?.is_msp_admin && userProfile?.default_team_id) {
        console.log('🔍 Filtrage par équipe:', userProfile.default_team_id);
        query = query.eq('team_id', userProfile.default_team_id);
      } else if (userProfile?.is_msp_admin) {
        console.log('🔍 Admin MSP - pas de filtrage par équipe');
      } else {
        console.log('🔍 Pas d\'équipe par défaut et pas admin MSP');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      console.log('🔍 Résultat de la requête:');
      console.log('Data count:', data?.length || 0);
      console.log('Error:', error);
      console.log('Sample data:', data?.[0]);

      if (error) {
        console.error('Error fetching incidents:', error);
        toast.error('Erreur lors du chargement des incidents');
        return [];
      }

      return (data || []) as unknown as Incident[];
    } catch (error) {
      console.error('Error fetching incidents:', error);
      toast.error('Erreur lors du chargement des incidents');
      return [];
    }
  }

  static async createIncident(incidentData: CreateIncidentData, user: User, userProfile: UserProfile | null): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('itsm_incidents')
        .insert([{
          ...incidentData,
          created_by: user.id,
          team_id: userProfile?.default_team_id,
          status: incidentData.status || 'open'
        }]);

      if (error) {
        console.error('Error creating incident:', error);
        toast.error('Erreur lors de la création de l\'incident');
        return false;
      }

      toast.success('Incident créé avec succès');
      return true;
    } catch (error) {
      console.error('Error creating incident:', error);
      toast.error('Erreur lors de la création de l\'incident');
      return false;
    }
  }

  static async updateIncident(id: string, updates: UpdateIncidentData, user: User): Promise<boolean> {
    try {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Set resolved_at when status is resolved
      if (updates.status === 'resolved' && !updates.resolved_at) {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('itsm_incidents')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating incident:', error);
        toast.error('Erreur lors de la mise à jour de l\'incident');
        return false;
      }

      toast.success('Incident mis à jour avec succès');
      return true;
    } catch (error) {
      console.error('Error updating incident:', error);
      toast.error('Erreur lors de la mise à jour de l\'incident');
      return false;
    }
  }

  static async deleteIncident(id: string, user: User): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('itsm_incidents')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting incident:', error);
        toast.error('Erreur lors de la suppression de l\'incident');
        return false;
      }

      toast.success('Incident supprimé avec succès');
      return true;
    } catch (error) {
      console.error('Error deleting incident:', error);
      toast.error('Erreur lors de la suppression de l\'incident');
      return false;
    }
  }

  static async assignIncident(id: string, assigneeId: string | null, user: User): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('itsm_incidents')
        .update({ 
          assigned_to: assigneeId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error assigning incident:', error);
        toast.error('Erreur lors de l\'assignation de l\'incident');
        return false;
      }

      toast.success('Incident assigné avec succès');
      return true;
    } catch (error) {
      console.error('Error assigning incident:', error);
      toast.error('Erreur lors de l\'assignation de l\'incident');
      return false;
    }
  }

  static async updateStatus(id: string, status: Incident['status'], user: User): Promise<boolean> {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };

      // Set resolved_at when status is resolved
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('itsm_incidents')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating incident status:', error);
        toast.error('Erreur lors de la mise à jour du statut');
        return false;
      }

      toast.success('Statut mis à jour avec succès');
      return true;
    } catch (error) {
      console.error('Error updating incident status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
      return false;
    }
  }
} 