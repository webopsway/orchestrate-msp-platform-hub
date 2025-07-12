import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { User, UserCreateData, UserUpdateData } from "@/types/user";
import { UserService } from "@/services/userService";

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
  const { sessionContext } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const loadUsers = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Wait for session context to be loaded
      if (!sessionContext) {
        console.log('No session context available, waiting...');
        setUsers([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }
      
      const { users: loadedUsers, count } = await UserService.loadUsers(sessionContext);
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
  }, [sessionContext?.current_team_id, sessionContext?.is_msp]);

  const createUser = useCallback(async (data: UserCreateData): Promise<boolean> => {
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
  }, [loadUsers]);

  const updateUser = useCallback(async (id: string, data: UserUpdateData): Promise<boolean> => {
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
  }, [loadUsers]);

  const deleteUser = useCallback(async (id: string): Promise<boolean> => {
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
  }, [loadUsers]);

  const refresh = useCallback(async () => {
    await loadUsers();
  }, [loadUsers]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    console.log('useUsers useEffect - sessionContext:', sessionContext);
    // Charger les utilisateurs si l'utilisateur est MSP admin ou a une session valide
    if (sessionContext?.is_msp || sessionContext?.current_team_id) {
      loadUsers();
    }
  }, [loadUsers, sessionContext?.is_msp, sessionContext?.current_team_id]);

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