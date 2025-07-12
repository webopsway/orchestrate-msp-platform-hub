import { supabase } from "@/integrations/supabase/client";
import { User, UserCreateData, UserUpdateData } from "@/types/user";
import { UserProfile } from "@/contexts/AuthContext";

export class UserService {
  private static transformUser(userData: any): User {
    return {
      id: userData.id,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      avatar_url: userData.avatar_url,
      is_msp_admin: userData.is_msp_admin,
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

    const userData = {
      id: data.id || crypto.randomUUID(),
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      metadata: {
        phone: data.phone || '',
        role: data.role || 'user',
        department: data.department || '',
        position: data.position || '',
        status: data.status || 'active'
      }
    };
    
    const { error } = await supabase
      .from('profiles')
      .insert([userData]);

    if (error) {
      console.error('Error creating user:', error);
      throw new Error(`Erreur lors de la création de l'utilisateur: ${error.message}`);
    }
  }

  static async updateUser(id: string, data: UserUpdateData): Promise<void> {
    console.log('UserService.updateUser called with:', { id, data });
    
    if (!id) {
      throw new Error('ID utilisateur requis pour la mise à jour');
    }
    
    // Récupérer l'utilisateur existant pour préserver les métadonnées
    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('metadata')
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
    
    const updateData = {
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      updated_at: new Date().toISOString(),
      metadata: newMetadata
    };
    
    console.log('Final updateData:', updateData);

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating user:', error);
      throw new Error(`Erreur lors de la mise à jour de l'utilisateur: ${error.message}`);
    }
  }

  static async deleteUser(id: string): Promise<void> {
    if (!id) {
      throw new Error('ID utilisateur requis pour la suppression');
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      throw new Error(`Erreur lors de la suppression de l'utilisateur: ${error.message}`);
    }
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