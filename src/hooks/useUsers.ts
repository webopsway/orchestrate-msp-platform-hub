import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  is_msp_admin?: boolean;
  metadata?: {
    phone?: string;
    role?: string;
    department?: string;
    position?: string;
    status?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at?: string;
}

export interface UseUsersReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refresh: () => Promise<void>;
  createUser: (data: any) => Promise<boolean>;
  updateUser: (id: string, data: any) => Promise<boolean>;
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
      
      const { data: usersData, error: usersError, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      
      // Transform data to match interface
      const transformedUsers: User[] = (usersData || []).map(user => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
        is_msp_admin: user.is_msp_admin,
        created_at: user.created_at,
        updated_at: user.updated_at,
        metadata: (user.metadata as any) || {}
      }));
      
      setUsers(transformedUsers);
      setTotalCount(count || 0);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du chargement des utilisateurs';
      setError(errorMessage);
      console.error('Error loading users:', err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [sessionContext?.current_team_id]);

  const createUser = useCallback(async (data: any): Promise<boolean> => {
    try {
      const userData = {
        id: data.id || crypto.randomUUID(),
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        metadata: {
          phone: data.phone,
          role: data.role,
          department: data.department,
          position: data.position,
          status: data.status || 'active'
        }
      };
      
      const { error } = await supabase
        .from('profiles')
        .insert([userData]);

      if (error) throw error;

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

  const updateUser = useCallback(async (id: string, data: any): Promise<boolean> => {
    try {
      const updateData = {
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        updated_at: new Date().toISOString(),
        metadata: {
          phone: data.phone,
          role: data.role,
          department: data.department,
          position: data.position,
          status: data.status
        }
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

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
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

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
    loadUsers();
  }, [loadUsers]);

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