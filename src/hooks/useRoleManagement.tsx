import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string;
  is_system_role: boolean;
}

interface Permission {
  id: string;
  name: string;
  display_name: string;
  description: string;
  resource: string;
  action: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  team_id?: string;
  organization_id?: string;
  granted_at: string;
  expires_at?: string;
  is_active: boolean;
  role: Role;
  user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  team?: {
    id: string;
    name: string;
  };
  organization?: {
    id: string;
    name: string;
  };
}

export const useRoleManagement = () => {
  const { sessionContext } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-roles', {
        method: 'GET',
        body: null,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // L'Edge Function retourne tout en une fois, on extrait les rôles
      if (error) throw error;
      if (data?.roles) {
        setRoles(data.roles);
      }
    } catch (err: any) {
      console.error('Failed to fetch roles:', err);
      setError(err.message);
    }
  };

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-roles', {
        method: 'GET',
        body: null,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (error) throw error;
      if (data?.permissions) {
        setPermissions(data.permissions);
      }
    } catch (err: any) {
      console.error('Failed to fetch permissions:', err);
      setError(err.message);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-roles', {
        method: 'GET',
        body: null,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (error) throw error;
      if (data?.userRoles) {
        setUserRoles(data.userRoles);
      }
    } catch (err: any) {
      console.error('Failed to fetch user roles:', err);
      setError(err.message);
    }
  };

  const fetchRolePermissions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-roles', {
        method: 'GET',
        body: null,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (error) throw error;
      if (data?.rolePermissions) {
        setRolePermissions(data.rolePermissions);
      }
    } catch (err: any) {
      console.error('Failed to fetch role permissions:', err);
      setError(err.message);
    }
  };

  const assignRole = async (
    targetUserId: string,
    roleId: string,
    teamId?: string,
    organizationId?: string,
    expiresAt?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('manage-roles', {
        body: {
          action: 'assign-role',
          targetUserId,
          roleId,
          teamId,
          organizationId,
          expiresAt
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Rôle assigné avec succès');
        await fetchUserRoles(); // Refresh the list
        return true;
      } else {
        throw new Error(data?.error || 'Failed to assign role');
      }
    } catch (err: any) {
      console.error('Failed to assign role:', err);
      setError(err.message);
      toast.error('Erreur lors de l\'assignation du rôle: ' + err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const revokeRole = async (userRoleId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('manage-roles', {
        method: 'DELETE',
        body: { userRoleId }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Rôle révoqué avec succès');
        await fetchUserRoles(); // Refresh the list
        return true;
      } else {
        throw new Error(data?.error || 'Failed to revoke role');
      }
    } catch (err: any) {
      console.error('Failed to revoke role:', err);
      setError(err.message);
      toast.error('Erreur lors de la révocation du rôle: ' + err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const initializeData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-roles');
      
      if (error) throw error;
      
      if (data) {
        setRoles(data.roles || []);
        setPermissions(data.permissions || {});
        setUserRoles(data.userRoles || []);
        setRolePermissions(data.rolePermissions || {});
      }
    } catch (err: any) {
      console.error('Failed to initialize data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeData();
  }, []);

  return {
    roles,
    permissions,
    userRoles,
    rolePermissions,
    loading,
    error,
    assignRole,
    revokeRole,
    refreshData: initializeData
  };
};