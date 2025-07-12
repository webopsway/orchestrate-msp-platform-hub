import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/contexts/AuthContext';
import type { Change, CreateChangeData, UpdateChangeData } from '@/types/change';
import { toast } from 'sonner';

export class ChangeService {
  static async fetchChanges(user: User, userProfile: UserProfile | null): Promise<Change[]> {
    console.log('🔍 Debug ChangeService.fetchChanges:');
    console.log('User:', user.id);
    console.log('UserProfile:', userProfile);
    console.log('Is MSP Admin:', userProfile?.is_msp_admin);
    console.log('Default Team ID:', userProfile?.default_team_id);

    try {
      let query = supabase
        .from('itsm_change_requests')
        .select(`
          *,
          requested_by_profile:requested_by(email, first_name, last_name),
          approved_by_profile:approved_by(email, first_name, last_name)
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
        console.error('Error fetching changes:', error);
        toast.error('Erreur lors du chargement des changements');
        return [];
      }

      return (data || []) as unknown as Change[];
    } catch (error) {
      console.error('Error fetching changes:', error);
      toast.error('Erreur lors du chargement des changements');
      return [];
    }
  }

  static async createChange(changeData: CreateChangeData, user: User, userProfile: UserProfile | null): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('itsm_change_requests')
        .insert([{
          ...changeData,
          requested_by: user.id,
          team_id: userProfile?.default_team_id,
          status: changeData.status || 'draft'
        }]);

      if (error) {
        console.error('Error creating change:', error);
        toast.error('Erreur lors de la création du changement');
        return false;
      }

      toast.success('Changement créé avec succès');
      return true;
    } catch (error) {
      console.error('Error creating change:', error);
      toast.error('Erreur lors de la création du changement');
      return false;
    }
  }

  static async updateChange(id: string, updates: UpdateChangeData, user: User): Promise<boolean> {
    try {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('itsm_change_requests')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating change:', error);
        toast.error('Erreur lors de la mise à jour du changement');
        return false;
      }

      toast.success('Changement mis à jour avec succès');
      return true;
    } catch (error) {
      console.error('Error updating change:', error);
      toast.error('Erreur lors de la mise à jour du changement');
      return false;
    }
  }

  static async deleteChange(id: string, user: User): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('itsm_change_requests')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting change:', error);
        toast.error('Erreur lors de la suppression du changement');
        return false;
      }

      toast.success('Changement supprimé avec succès');
      return true;
    } catch (error) {
      console.error('Error deleting change:', error);
      toast.error('Erreur lors de la suppression du changement');
      return false;
    }
  }

  static async assignChange(id: string, assigneeId: string | null, user: User): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('itsm_change_requests')
        .update({ 
          assigned_to: assigneeId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error assigning change:', error);
        toast.error('Erreur lors de l\'assignation du changement');
        return false;
      }

      toast.success('Changement assigné avec succès');
      return true;
    } catch (error) {
      console.error('Error assigning change:', error);
      toast.error('Erreur lors de l\'assignation du changement');
      return false;
    }
  }

  static async updateStatus(id: string, status: Change['status'], user: User): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('itsm_change_requests')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating change status:', error);
        toast.error('Erreur lors de la mise à jour du statut');
        return false;
      }

      toast.success('Statut mis à jour avec succès');
      return true;
    } catch (error) {
      console.error('Error updating change status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
      return false;
    }
  }

  static async approveChange(id: string, approvedBy: string, user: User): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('itsm_change_requests')
        .update({ 
          approved_by: approvedBy,
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error approving change:', error);
        toast.error('Erreur lors de l\'approbation du changement');
        return false;
      }

      toast.success('Changement approuvé avec succès');
      return true;
    } catch (error) {
      console.error('Error approving change:', error);
      toast.error('Erreur lors de l\'approbation du changement');
      return false;
    }
  }
} 