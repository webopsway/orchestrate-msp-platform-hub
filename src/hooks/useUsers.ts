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
  const { user, sessionContext } = useAuth();
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
      
      // Check if user is MSP admin directly from auth context
      const { data: profile } = await supabase.from('profiles')
        .select('is_msp_admin, default_organization_id, default_team_id')
        .eq('id', user.id)
        .single();
      
      // For MSP admins, create a minimal session context if none exists
      let workingSessionContext = sessionContext;
      if (!workingSessionContext && profile?.is_msp_admin) {
        console.log('Creating temporary MSP session context for data loading');
        workingSessionContext = {
          current_organization_id: profile.default_organization_id,
          current_team_id: profile.default_team_id,
          is_msp: true
        };
      }
      
      // Wait for session context to be loaded (unless MSP admin)
      if (!workingSessionContext) {
        console.log('No session context available, waiting...');
        setUsers([]);
        setTotalCount(0);
        return;
      }
      
      const { users: loadedUsers, count } = await UserService.loadUsers(workingSessionContext);
      setUsers(loadedUsers);
      setTotalCount(count);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du chargement des utilisateurs';
      setError(errorMessage);
      console.error('Error loading users:', err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, sessionContext?.current_team_id, sessionContext?.is_msp]);

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
    console.log('useUsers useEffect - user:', user?.id, 'sessionContext:', sessionContext);
    
    // Load users if user is connected
    if (user) {
      // Try to load users (the loadUsers function will handle MSP admin case)
      loadUsers();
    } else {
      // No user connected
      setUsers([]);
      setTotalCount(0);
      setLoading(false);
    }
  }, [user, sessionContext, loadUsers]);

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