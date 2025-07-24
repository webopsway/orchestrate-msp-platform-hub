import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentContext } from './useCurrentContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

export type Team = Database['public']['Tables']['teams']['Row'];
export type TeamMembership = Database['public']['Tables']['team_memberships']['Row'];

export interface TeamWithDetails extends Team {
  organizations?: Database['public']['Tables']['organizations']['Row'];
  team_memberships?: TeamMembership[];
  member_count?: number;
}

export interface TeamFormData {
  name: string;
  description?: string;
  organization_id: string;
}

export const useTeams = () => {
  const { userProfile } = useAuth();
  const { currentOrganizationId, isMspAdmin } = useCurrentContext();
  const [teams, setTeams] = useState<TeamWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  // Récupérer les équipes
  const fetchTeams = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);

      let query = supabase
        .from('teams')
        .select(`
          *,
          organizations(*),
          team_memberships(*)
        `)
        .order('name');

      // Filtrer par organisation courante si sélectionnée
      if (currentOrganizationId) {
        query = query.eq('organization_id', currentOrganizationId);
      }

      // Si l'utilisateur n'est pas admin MSP, filtrer par ses équipes
      if (!isMspAdmin) {
        const { data: membershipData } = await supabase
          .from('team_memberships')
          .select('team_id')
          .eq('user_id', userProfile.id);

        const teamIds = membershipData?.map(m => m.team_id) || [];
        if (teamIds.length > 0) {
          query = query.in('id', teamIds);
        } else {
          setTeams([]);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Ajouter le nombre de membres à chaque équipe
      const teamsWithMemberCount = (data || []).map(team => ({
        ...team,
        member_count: team.team_memberships?.length || 0
      }));

      setTeams(teamsWithMemberCount);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Erreur lors du chargement des équipes');
    } finally {
      setLoading(false);
    }
  };

  // Créer une équipe
  const createTeam = async (data: TeamFormData) => {
    if (!userProfile?.is_msp_admin) {
      toast.error('Seuls les admins MSP peuvent créer des équipes');
      return;
    }

    try {
      setLoading(true);

      const { data: teamData, error } = await supabase
        .from('teams')
        .insert({
          ...data,
          created_by: userProfile.id,
          metadata: {}
        })
        .select()
        .single();

      if (error) throw error;

      // Ajouter l'admin MSP comme propriétaire de l'équipe
      const { error: membershipError } = await supabase
        .from('team_memberships')
        .insert({
          user_id: userProfile.id,
          team_id: teamData.id,
          role: 'owner',
          granted_by: userProfile.id
        });

      if (membershipError) {
        console.warn('Warning: Could not add admin to team membership:', membershipError);
      }

      toast.success('Équipe créée avec succès');
      await fetchTeams();
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Erreur lors de la création de l\'équipe');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour une équipe
  const updateTeam = async (id: string, data: Partial<TeamFormData>) => {
    if (!userProfile?.is_msp_admin) {
      toast.error('Seuls les admins MSP peuvent modifier les équipes');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('teams')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast.success('Équipe mise à jour');
      await fetchTeams();
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une équipe
  const deleteTeam = async (id: string) => {
    if (!userProfile?.is_msp_admin) {
      toast.error('Seuls les admins MSP peuvent supprimer les équipes');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Équipe supprimée');
      await fetchTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un membre à une équipe
  const addTeamMember = async (
    teamId: string, 
    userId: string, 
    role: 'member' | 'manager' | 'owner' = 'member'
  ) => {
    if (!userProfile?.is_msp_admin) {
      toast.error('Seuls les admins MSP peuvent ajouter des membres');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('team_memberships')
        .upsert({
          team_id: teamId,
          user_id: userId,
          role,
          granted_by: userProfile.id
        }, {
          onConflict: 'user_id,team_id'
        });

      if (error) throw error;

      toast.success('Membre ajouté à l\'équipe');
      await fetchTeams();
    } catch (error) {
      console.error('Error adding team member:', error);
      toast.error('Erreur lors de l\'ajout du membre');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Retirer un membre d'une équipe
  const removeTeamMember = async (teamId: string, userId: string) => {
    if (!userProfile?.is_msp_admin) {
      toast.error('Seuls les admins MSP peuvent retirer des membres');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('team_memberships')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Membre retiré de l\'équipe');
      await fetchTeams();
    } catch (error) {
      console.error('Error removing team member:', error);
      toast.error('Erreur lors du retrait du membre');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage et quand le contexte change
  useEffect(() => {
    fetchTeams();
  }, [userProfile, currentOrganizationId]);

  return {
    teams,
    loading,
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember,
    refetch: fetchTeams
  };
};