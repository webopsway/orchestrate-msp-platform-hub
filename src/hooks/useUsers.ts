import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { User, UserCreateData, UserUpdateData } from "@/types/user";
import { UserService } from "@/services/userService";
import { supabase } from "@/integrations/supabase/client";

// Re-export types for backward compatibility
export type { User, UserCreateData, UserUpdateData };

export interface UseUsersReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refresh: () => Promise<void>;
  createUser: (data: UserCreateData) => Promise<boolean>;
  updateUser: (id: string, data: UserUpdateData) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export function useUsers(): UseUsersReturn {
  const { user, userProfile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const loadUsers = useCallback(async () => {
    if (!user) {
      console.log('No user available, skipping load');
      setUsers([]);
      setTotalCount(0);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          organization_memberships(
            organization_id,
            role,
            organizations(name, type)
          ),
          team_memberships(
            team_id,
            role,
            teams(name, organization_id)
          )
        `);

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      // Filter users based on MSP admin status
      let filteredUsers = data || [];
      
      if (!userProfile?.is_msp_admin) {
        const currentTeamId = userProfile?.default_team_id;
        if (currentTeamId) {
          filteredUsers = data?.filter(user => 
            user.team_memberships?.some(membership => 
              membership.team_id === currentTeamId
            )
          ) || [];
        }
      }

      setUsers(filteredUsers as User[]);
      setTotalCount(filteredUsers.length);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du chargement des utilisateurs';
      setError(errorMessage);
      console.error('Error loading users:', err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile]);

  const createUser = useCallback(async (data: UserCreateData): Promise<boolean> => {
    if (!user) {
      toast.error('Vous devez être connecté pour créer un utilisateur');
      return false;
    }

    try {
      await UserService.createUser(data);
      toast.success('Utilisateur créé avec succès');
      await loadUsers();
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la création';
      toast.error(errorMessage);
      console.error('Error creating user:', err);
      return false;
    }
  }, [user, loadUsers]);

  const updateUser = useCallback(async (id: string, data: UserUpdateData): Promise<boolean> => {
    if (!user) {
      toast.error('Vous devez être connecté pour modifier un utilisateur');
      return false;
    }

    try {
      await UserService.updateUser(id, data);
      toast.success('Utilisateur mis à jour avec succès');
      await loadUsers();
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la mise à jour';
      toast.error(errorMessage);
      console.error('Error updating user:', err);
      return false;
    }
  }, [user, loadUsers]);

  const deleteUser = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('Vous devez être connecté pour supprimer un utilisateur');
      return false;
    }

    try {
      await UserService.deleteUser(id);
      toast.success('Utilisateur supprimé');
      await loadUsers();
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la suppression';
      toast.error(errorMessage);
      console.error('Error deleting user:', err);
      return false;
    }
  }, [user, loadUsers]);

  const refresh = useCallback(async () => {
    await loadUsers();
  }, [loadUsers]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (user) {
      loadUsers();
    } else {
      setUsers([]);
      setTotalCount(0);
      setLoading(false);
    }
  }, [user, userProfile, loadUsers]);

  return {
    users,
    loading,
    error,
    totalCount,
    refresh,
    createUser,
    updateUser,
    deleteUser,
    clearError
  };
}