import supabaseConfig, { supabaseAdmin } from '../config/supabase.js';

export class UserService {

  /**
   * Récupérer tous les utilisateurs (pour MSP admin)
   */
  static async getAllUsers() {
    try {
      // Mode test - retourner des données mockées
      if (supabaseConfig.isTestMode) {
        console.log('🧪 Mode TEST: Retour de données utilisateurs mockées');
        return {
          success: true,
          data: [
            {
              id: 'test-user-1',
              email: 'admin@msp.com',
              first_name: 'Admin',
              last_name: 'MSP',
              is_msp_admin: true,
              default_organization_id: 'test-org-1',
              default_team_id: 'test-team-1',
              organization: { id: 'test-org-1', name: 'MSP Organization' },
              team: { id: 'test-team-1', name: 'MSP Team' },
              created_at: new Date().toISOString()
            },
            {
              id: 'test-user-2',
              email: 'client@demo.com',
              first_name: 'Client',
              last_name: 'Demo',
              is_msp_admin: false,
              default_organization_id: 'test-org-2',
              default_team_id: 'test-team-2',
              organization: { id: 'test-org-2', name: 'Demo Client Org' },
              team: { id: 'test-team-2', name: 'Demo Client Team' },
              created_at: new Date().toISOString()
            }
          ]
        };
      }

      // Mode normal avec vraie base de données
      const { data: users, error } = await supabaseAdmin
        .from('profiles')
        .select(`
          *,
          organization:organizations(id, name),
          team:teams(id, name),
          organization_memberships(organization_id, role),
          team_memberships(team_id, role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: users };
    } catch (error) {
      console.error('Error fetching users:', error);
      return {
        success: false,
        error: error.message,
        code: 'FETCH_USERS_ERROR'
      };
    }
  }

  /**
   * Récupérer les utilisateurs par équipe (pour utilisateurs non-MSP)
   */
  static async getUsersByTeam(teamId) {
    try {
      // Mode test
      if (supabaseConfig.isTestMode) {
        console.log(`🧪 Mode TEST: Retour utilisateurs équipe ${teamId}`);
        return {
          success: true,
          data: [
            {
              id: 'test-user-team',
              email: 'team-member@demo.com',
              first_name: 'Team',
              last_name: 'Member',
              organization: { id: teamId, name: 'Test Team Org' },
              team: { id: teamId, name: 'Test Team' },
              created_at: new Date().toISOString()
            }
          ]
        };
      }

      const { data: teamMembers, error } = await supabaseAdmin
        .from('team_memberships')
        .select(`
          user_id,
          profiles(
            *,
            organization:organizations(id, name),
            team:teams(id, name)
          )
        `)
        .eq('team_id', teamId);

      if (error) throw error;

      const users = teamMembers.map(member => member.profiles);
      return { success: true, data: users };
    } catch (error) {
      console.error('Error fetching team users:', error);
      return {
        success: false,
        error: error.message,
        code: 'FETCH_TEAM_USERS_ERROR'
      };
    }
  }

  /**
   * Créer un nouvel utilisateur avec association organisation/équipe obligatoire
   */
  static async createUser(userData) {
    const {
      email,
      first_name,
      last_name,
      phone,
      role,
      organization_id,
      team_id,
      department,
      position,
      status = 'active'
    } = userData;

    // Validation des données obligatoires
    if (!email || !first_name || !last_name || !organization_id || !team_id) {
      return {
        success: false,
        error: 'Email, prénom, nom, organisation et équipe sont obligatoires',
        code: 'VALIDATION_ERROR'
      };
    }

    try {
      // Mode test
      if (supabaseConfig.isTestMode) {
        console.log('🧪 Mode TEST: Simulation création utilisateur');
        const mockUser = {
          id: `test-user-${Date.now()}`,
          email,
          first_name,
          last_name,
          default_organization_id: organization_id,
          default_team_id: team_id,
          is_msp_admin: false,
          organization: { id: organization_id, name: 'Test Organization' },
          team: { id: team_id, name: 'Test Team' },
          metadata: { phone, role, department, position, status },
          created_at: new Date().toISOString()
        };

        return {
          success: true,
          data: mockUser,
          message: 'Utilisateur créé avec succès (mode test)'
        };
      }

      // Mode normal - code original
      // 1. Vérifier que l'équipe appartient bien à l'organisation
      const { data: teamValidation, error: teamError } = await supabaseAdmin
        .from('teams')
        .select('organization_id')
        .eq('id', team_id)
        .single();

      if (teamError) {
        return {
          success: false,
          error: 'Équipe non trouvée',
          code: 'TEAM_NOT_FOUND'
        };
      }

      if (teamValidation.organization_id !== organization_id) {
        return {
          success: false,
          error: 'L\'équipe sélectionnée n\'appartient pas à l\'organisation choisie',
          code: 'TEAM_ORGANIZATION_MISMATCH'
        };
      }

      const userId = crypto.randomUUID();

      // 2. Créer le profil utilisateur
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert([{
          id: userId,
          email,
          first_name,
          last_name,
          default_organization_id: organization_id,
          default_team_id: team_id,
          is_msp_admin: false,
          metadata: {
            phone: phone || '',
            role: role || 'user',
            department: department || '',
            position: position || '',
            status: status
          }
        }]);

      if (profileError) {
        console.error('Error creating profile:', profileError);
        return {
          success: false,
          error: 'Erreur lors de la création du profil utilisateur',
          code: 'PROFILE_CREATION_ERROR'
        };
      }

      // 3. Créer l'adhésion à l'organisation
      const { error: orgMembershipError } = await supabaseAdmin
        .from('organization_memberships')
        .insert([{
          user_id: userId,
          organization_id: organization_id,
          role: 'user'
        }]);

      if (orgMembershipError) {
        // Rollback : supprimer le profil créé
        await supabaseAdmin.from('profiles').delete().eq('id', userId);
        return {
          success: false,
          error: 'Erreur lors de l\'association à l\'organisation',
          code: 'ORG_MEMBERSHIP_ERROR'
        };
      }

      // 4. Créer l'adhésion à l'équipe
      const { error: teamMembershipError } = await supabaseAdmin
        .from('team_memberships')
        .insert([{
          user_id: userId,
          team_id: team_id,
          role: 'member'
        }]);

      if (teamMembershipError) {
        // Rollback : supprimer le profil et l'adhésion organisation
        await supabaseAdmin.from('organization_memberships').delete().eq('user_id', userId);
        await supabaseAdmin.from('profiles').delete().eq('id', userId);
        return {
          success: false,
          error: 'Erreur lors de l\'association à l\'équipe',
          code: 'TEAM_MEMBERSHIP_ERROR'
        };
      }

      // 5. Récupérer l'utilisateur créé avec toutes ses relations
      const { data: createdUser, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select(`
          *,
          organization:organizations(id, name),
          team:teams(id, name)
        `)
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching created user:', fetchError);
      }

      return {
        success: true,
        data: createdUser || { id: userId, email, first_name, last_name },
        message: 'Utilisateur créé avec succès'
      };

    } catch (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        error: error.message,
        code: 'UNEXPECTED_ERROR'
      };
    }
  }

  /**
   * Mettre à jour un utilisateur
   */
  static async updateUser(userId, updateData) {
    try {
      // Mode test
      if (supabaseConfig.isTestMode) {
        console.log(`🧪 Mode TEST: Simulation mise à jour utilisateur ${userId}`);
        return {
          success: true,
          data: { id: userId, ...updateData, updated_at: new Date().toISOString() },
          message: 'Utilisateur mis à jour avec succès (mode test)'
        };
      }

      const { data: updatedUser, error } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select(`
          *,
          organization:organizations(id, name),
          team:teams(id, name)
        `)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: updatedUser,
        message: 'Utilisateur mis à jour avec succès'
      };
    } catch (error) {
      console.error('Error updating user:', error);
      return {
        success: false,
        error: error.message,
        code: 'UPDATE_USER_ERROR'
      };
    }
  }

  /**
   * Supprimer un utilisateur
   */
  static async deleteUser(userId) {
    try {
      // Mode test
      if (supabaseConfig.isTestMode) {
        console.log(`🧪 Mode TEST: Simulation suppression utilisateur ${userId}`);
        return {
          success: true,
          message: 'Utilisateur supprimé avec succès (mode test)'
        };
      }

      // Supprimer d'abord les adhésions
      await supabaseAdmin.from('team_memberships').delete().eq('user_id', userId);
      await supabaseAdmin.from('organization_memberships').delete().eq('user_id', userId);

      // Supprimer le profil
      const { error } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      return {
        success: true,
        message: 'Utilisateur supprimé avec succès'
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        error: error.message,
        code: 'DELETE_USER_ERROR'
      };
    }
  }

  /**
   * Récupérer un utilisateur par ID
   */
  static async getUserById(userId) {
    try {
      // Mode test
      if (supabaseConfig.isTestMode) {
        console.log(`🧪 Mode TEST: Récupération utilisateur ${userId}`);
        return {
          success: true,
          data: {
            id: userId,
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            organization: { id: 'test-org', name: 'Test Org' },
            team: { id: 'test-team', name: 'Test Team' },
            created_at: new Date().toISOString()
          }
        };
      }

      const { data: user, error } = await supabaseAdmin
        .from('profiles')
        .select(`
          *,
          organization:organizations(id, name),
          team:teams(id, name),
          organization_memberships(organization_id, role),
          team_memberships(team_id, role)
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;

      return { success: true, data: user };
    } catch (error) {
      console.error('Error fetching user:', error);
      return {
        success: false,
        error: error.message,
        code: 'FETCH_USER_ERROR'
      };
    }
  }
}
