import { UserProfile } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { User, UserCreateData, UserUpdateData } from "@/types/user";

export class UserService {
  private static transformUser(userData: any): User {
    return {
      id: userData.id,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      avatar_url: userData.avatar_url,
      is_msp_admin: userData.is_msp_admin,
      default_organization_id: userData.default_organization_id,
      default_team_id: userData.default_team_id,
      created_at: userData.created_at,
      updated_at: userData.updated_at,
      metadata: (userData.metadata as any) || {}
    };
  }

  static async loadUsers(userProfile: UserProfile | null): Promise<{ users: User[], count: number }> {
    console.log('UserService.loadUsers called with userProfile:', userProfile);

    if (!userProfile) {
      throw new Error('User profile is required to load users');
    }

    // MSP admins can see all users
    let query = supabase.from('profiles').select('*', { count: 'exact' });

    // If user is not MSP admin, filter by team membership
    if (!userProfile.is_msp_admin) {
      const currentTeamId = userProfile.default_team_id;

      if (!currentTeamId) {
        console.log('No team context for non-MSP user');
        return { users: [], count: 0 };
      }

      // Get users who are members of the current team
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_memberships')
        .select('user_id')
        .eq('team_id', currentTeamId);

      if (teamError) {
        console.error('Error fetching team members:', teamError);
        throw new Error(`Erreur lors de la récupération des membres de l'équipe: ${teamError.message}`);
      }

      if (teamMembers && teamMembers.length > 0) {
        const userIds = teamMembers.map(tm => tm.user_id);
        query = query.in('id', userIds);
      } else {
        // No team members found, return empty result
        return { users: [], count: 0 };
      }
    }

    const { data: usersData, error: usersError, count } = await query
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw new Error(`Erreur lors de la récupération des utilisateurs: ${usersError.message}`);
    }

    // Transform data to match interface
    const transformedUsers: User[] = (usersData || []).map(this.transformUser);

    return { users: transformedUsers, count: count || 0 };
  }

  static async createUser(data: UserCreateData): Promise<void> {
    if (!data.email || !data.first_name || !data.last_name) {
      throw new Error('Email, prénom et nom sont requis pour créer un utilisateur');
    }

    if (!data.organization_id || !data.team_id) {
      throw new Error('Organisation et équipe sont obligatoires pour créer un utilisateur');
    }

    // Vérifier que l'équipe appartient bien à l'organisation
    const { data: teamValidation, error: teamValidationError } = await supabase
      .from('teams')
      .select('organization_id')
      .eq('id', data.team_id)
      .single();

    if (teamValidationError) {
      console.error('Error validating team:', teamValidationError);
      throw new Error('Équipe non trouvée');
    }

    if (teamValidation.organization_id !== data.organization_id) {
      throw new Error('L\'équipe sélectionnée n\'appartient pas à l\'organisation choisie');
    }

    const userId = data.id || crypto.randomUUID();

    // 1. Créer le profil utilisateur
    const userData = {
      id: userId,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      default_organization_id: data.organization_id,
      default_team_id: data.team_id,
      is_msp_admin: false, // Les nouveaux utilisateurs ne sont pas admin MSP par défaut
      metadata: {
        phone: data.phone || '',
        role: data.role || 'user',
        department: data.department || '',
        position: data.position || '',
        status: data.status || 'active'
      }
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([userData]);

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      throw new Error(`Erreur lors de la création du profil utilisateur: ${profileError.message}`);
    }

    // 2. Créer l'adhésion à l'organisation
    const organizationMembership = {
      user_id: userId,
      organization_id: data.organization_id,
      role: 'user' // Rôle par défaut dans l'organisation
    };

    const { error: orgMembershipError } = await supabase
      .from('organization_memberships')
      .insert([organizationMembership]);

    if (orgMembershipError) {
      console.error('Error creating organization membership:', orgMembershipError);
      // Tenter de supprimer le profil créé en cas d'erreur
      await supabase.from('profiles').delete().eq('id', userId);
      throw new Error(`Erreur lors de l'association à l'organisation: ${orgMembershipError.message}`);
    }

    // 3. Créer l'adhésion à l'équipe
    const teamMembership = {
      user_id: userId,
      team_id: data.team_id,
      role: 'member' // Rôle par défaut dans l'équipe
    };

    const { error: teamMembershipError } = await supabase
      .from('team_memberships')
      .insert([teamMembership]);

    if (teamMembershipError) {
      console.error('Error creating team membership:', teamMembershipError);
      // Tenter de supprimer les données créées en cas d'erreur
      await supabase.from('organization_memberships').delete().eq('user_id', userId);
      await supabase.from('profiles').delete().eq('id', userId);
      throw new Error(`Erreur lors de l'association à l'équipe: ${teamMembershipError.message}`);
    }

    console.log('User created successfully with memberships:', {
      userId,
      organizationId: data.organization_id,
      teamId: data.team_id
    });
  }

  static async updateUser(id: string, data: UserUpdateData): Promise<void> {
    console.log('UserService.updateUser called with:', { id, data });

    if (!id) {
      throw new Error('ID utilisateur requis pour la mise à jour');
    }

    // Récupérer l'utilisateur existant pour préserver les métadonnées
    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('metadata, default_organization_id, default_team_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching existing user:', fetchError);
      throw new Error(`Erreur lors de la récupération de l'utilisateur: ${fetchError.message}`);
    }

    // Fusionner les métadonnées existantes avec les nouvelles
    const existingMetadata = (existingUser?.metadata as any) || {};

    // Construire les nouvelles métadonnées en gérant les deux formats possibles
    const newMetadata = {
      ...existingMetadata,
      // Si les données viennent directement (depuis UserForm)
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.role !== undefined && { role: data.role }),
      ...(data.department !== undefined && { department: data.department }),
      ...(data.position !== undefined && { position: data.position }),
      ...(data.status !== undefined && { status: data.status }),
      // Si les données viennent via metadata (format alternatif)
      ...(data.metadata?.phone !== undefined && { phone: data.metadata.phone }),
      ...(data.metadata?.role !== undefined && { role: data.metadata.role }),
      ...(data.metadata?.department !== undefined && { department: data.metadata.department }),
      ...(data.metadata?.position !== undefined && { position: data.metadata.position }),
      ...(data.metadata?.status !== undefined && { status: data.metadata.status }),
    };

    console.log('Metadata merge result:', { existingMetadata, newMetadata });

    // Préparer les données de mise à jour du profil
    const updateData: any = {
      metadata: newMetadata
    };

    // Ajouter les champs directs s'ils sont fournis
    if (data.first_name !== undefined) updateData.first_name = data.first_name;
    if (data.last_name !== undefined) updateData.last_name = data.last_name;
    if (data.email !== undefined) updateData.email = data.email;

    // Gérer les changements d'organisation et d'équipe
    if (data.organization_id && data.organization_id !== existingUser.default_organization_id) {
      updateData.default_organization_id = data.organization_id;

      // Mettre à jour l'adhésion à l'organisation
      await supabase
        .from('organization_memberships')
        .delete()
        .eq('user_id', id);

      await supabase
        .from('organization_memberships')
        .insert([{
          user_id: id,
          organization_id: data.organization_id,
          role: 'user'
        }]);
    }

    if (data.team_id && data.team_id !== existingUser.default_team_id) {
      // Vérifier que l'équipe appartient à l'organisation
      if (data.organization_id || existingUser.default_organization_id) {
        const targetOrgId = data.organization_id || existingUser.default_organization_id;

        const { data: teamValidation, error: teamValidationError } = await supabase
          .from('teams')
          .select('organization_id')
          .eq('id', data.team_id)
          .single();

        if (teamValidationError || teamValidation.organization_id !== targetOrgId) {
          throw new Error('L\'équipe sélectionnée n\'appartient pas à l\'organisation');
        }
      }

      updateData.default_team_id = data.team_id;

      // Mettre à jour l'adhésion à l'équipe
      await supabase
        .from('team_memberships')
        .delete()
        .eq('user_id', id);

      await supabase
        .from('team_memberships')
        .insert([{
          user_id: id,
          team_id: data.team_id,
          role: 'member'
        }]);
    }

    // Mettre à jour le profil
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating user:', updateError);
      throw new Error(`Erreur lors de la mise à jour de l'utilisateur: ${updateError.message}`);
    }

    console.log('User updated successfully');
  }

  static async deleteUser(id: string): Promise<void> {
    console.log('UserService.deleteUser called with id:', id);

    if (!id) {
      throw new Error('ID utilisateur requis pour la suppression');
    }

    // Supprimer d'abord les adhésions (les contraintes de clés étrangères se chargeront du reste)
    const { error: teamMembershipError } = await supabase
      .from('team_memberships')
      .delete()
      .eq('user_id', id);

    if (teamMembershipError) {
      console.error('Error deleting team memberships:', teamMembershipError);
      // Ne pas bloquer la suppression pour les adhésions
    }

    const { error: orgMembershipError } = await supabase
      .from('organization_memberships')
      .delete()
      .eq('user_id', id);

    if (orgMembershipError) {
      console.error('Error deleting organization memberships:', orgMembershipError);
      // Ne pas bloquer la suppression pour les adhésions
    }

    // Supprimer le profil (cela déclenchera CASCADE pour auth.users)
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting user profile:', deleteError);
      throw new Error(`Erreur lors de la suppression de l'utilisateur: ${deleteError.message}`);
    }

    console.log('User deleted successfully');
  }

  // Méthode utilitaire pour vérifier les permissions
  static async checkUserPermissions(userId: string, userProfile: UserProfile | null): Promise<boolean> {
    if (!userProfile) {
      return false;
    }

    // MSP admins can manage all users
    if (userProfile.is_msp_admin) {
      return true;
    }

    // Check if user is in the same team
    if (userProfile.default_team_id) {
      const { data: membership } = await supabase
        .from('team_memberships')
        .select('id')
        .eq('team_id', userProfile.default_team_id)
        .eq('user_id', userId)
        .single();

      return !!membership;
    }

    return false;
  }
}
