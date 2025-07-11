import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_system_role?: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  resource: string;
  action: string;
  metadata?: any;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  granted_at: string;
  granted_by?: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  team_id?: string;
  organization_id?: string;
  granted_at: string;
  granted_by?: string;
  expires_at?: string;
  is_active: boolean;
  metadata?: any;
}

export interface UseRolesOptions {
  autoLoad?: boolean;
}

export interface UseRolesReturn {
  // Data
  roles: Role[];
  permissions: Permission[];
  rolePermissions: RolePermission[];
  userRoles: UserRole[];
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Role management
  createRole: (data: Partial<Role>) => Promise<Role | null>;
  updateRole: (id: string, data: Partial<Role>) => Promise<boolean>;
  deleteRole: (id: string) => Promise<boolean>;
  duplicateRole: (role: Role) => Promise<Role | null>;
  
  // Permission management
  updateRolePermissions: (roleId: string, permissionIds: string[]) => Promise<boolean>;
  getRolePermissions: (roleId: string) => Permission[];
  getPermissionsByCategory: (category: string) => Permission[];
  getPermissionCategories: () => string[];
  
  // User role management
  assignRole: (userId: string, roleId: string, options?: { teamId?: string; organizationId?: string; expiresAt?: string }) => Promise<boolean>;
  revokeRole: (userRoleId: string) => Promise<boolean>;
  getUserRoles: (userId: string) => UserRole[];
  getRoleUsers: (roleId: string) => UserRole[];
  
  // Utility functions
  refresh: () => Promise<void>;
  clearError: () => void;
  
  // Computed data
  totalRoles: number;
  systemRoles: Role[];
  customRoles: Role[];
  totalPermissions: number;
}

export const useRoles = (options: UseRolesOptions = {}): UseRolesReturn => {
  const { autoLoad = true } = options;
  const { sessionContext } = useAuth();

  // State
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all data
  const loadData = useCallback(async () => {
    if (!sessionContext?.current_team_id) return;

    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [rolesResult, permissionsResult, rolePermissionsResult, userRolesResult] = await Promise.all([
        supabase.from('roles').select('*').order('display_name'),
        supabase.from('permissions').select('*').order('resource', { ascending: true }).order('display_name', { ascending: true }),
        supabase.from('role_permissions').select('*'),
        supabase.from('user_roles').select('*').eq('is_active', true)
      ]);

      if (rolesResult.error) throw rolesResult.error;
      if (permissionsResult.error) throw permissionsResult.error;
      if (rolePermissionsResult.error) throw rolePermissionsResult.error;
      if (userRolesResult.error) throw userRolesResult.error;

      setRoles(rolesResult.data || []);
      setPermissions(permissionsResult.data || []);
      setRolePermissions(rolePermissionsResult.data || []);
      setUserRoles(userRolesResult.data || []);
    } catch (err) {
      console.error('Error loading roles data:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [sessionContext?.current_team_id]);

  // Role management
  const createRole = useCallback(async (data: Partial<Role>): Promise<Role | null> => {
    try {
      setLoading(true);
      
      const roleData = {
        name: data.name?.toLowerCase().replace(/\s+/g, '_'),
        display_name: data.display_name,
        description: data.description,
        is_system_role: false,
        metadata: data.metadata || {}
      };

      const { data: newRole, error } = await supabase
        .from('roles')
        .insert([roleData])
        .select()
        .single();

      if (error) throw error;

      await loadData();
      toast.success('Rôle créé avec succès');
      return newRole;
    } catch (err) {
      console.error('Error creating role:', err);
      toast.error('Erreur lors de la création du rôle');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  const updateRole = useCallback(async (id: string, data: Partial<Role>): Promise<boolean> => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('roles')
        .update({
          display_name: data.display_name,
          description: data.description,
          metadata: data.metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await loadData();
      toast.success('Rôle mis à jour avec succès');
      return true;
    } catch (err) {
      console.error('Error updating role:', err);
      toast.error('Erreur lors de la mise à jour du rôle');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  const deleteRole = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);

      const role = roles.find(r => r.id === id);
      if (role?.is_system_role) {
        toast.error('Impossible de supprimer un rôle système');
        return false;
      }

      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadData();
      toast.success('Rôle supprimé avec succès');
      return true;
    } catch (err) {
      console.error('Error deleting role:', err);
      toast.error('Erreur lors de la suppression du rôle');
      return false;
    } finally {
      setLoading(false);
    }
  }, [roles, loadData]);

  const duplicateRole = useCallback(async (role: Role): Promise<Role | null> => {
    try {
      setLoading(true);

      const newRoleData = {
        name: `${role.name}_copy`,
        display_name: `${role.display_name} (Copie)`,
        description: role.description,
        is_system_role: false,
        metadata: role.metadata || {}
      };

      const { data: newRole, error } = await supabase
        .from('roles')
        .insert([newRoleData])
        .select()
        .single();

      if (error) throw error;

      // Copy permissions
      const permissions = getRolePermissions(role.id);
      if (permissions.length > 0) {
        await updateRolePermissions(newRole.id, permissions.map(p => p.id));
      }

      await loadData();
      toast.success('Rôle dupliqué avec succès');
      return newRole;
    } catch (err) {
      console.error('Error duplicating role:', err);
      toast.error('Erreur lors de la duplication du rôle');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  // Permission management
  const updateRolePermissions = useCallback(async (roleId: string, permissionIds: string[]): Promise<boolean> => {
    try {
      setLoading(true);

      // Remove existing permissions
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);

      // Add new permissions
      if (permissionIds.length > 0) {
        const rolePermissionData = permissionIds.map(permissionId => ({
          role_id: roleId,
          permission_id: permissionId,
          granted_at: new Date().toISOString()
        }));

        const { error } = await supabase
          .from('role_permissions')
          .insert(rolePermissionData);

        if (error) throw error;
      }

      await loadData();
      toast.success('Permissions mises à jour avec succès');
      return true;
    } catch (err) {
      console.error('Error updating role permissions:', err);
      toast.error('Erreur lors de la mise à jour des permissions');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  const getRolePermissions = useCallback((roleId: string): Permission[] => {
    const rolePermissionIds = rolePermissions
      .filter(rp => rp.role_id === roleId)
      .map(rp => rp.permission_id);
    
    return permissions.filter(p => rolePermissionIds.includes(p.id));
  }, [rolePermissions, permissions]);

  const getPermissionsByCategory = useCallback((category: string): Permission[] => {
    return permissions.filter(p => p.resource === category);
  }, [permissions]);

  const getPermissionCategories = useCallback((): string[] => {
    const categories = [...new Set(permissions.map(p => p.resource))];
    return categories.sort();
  }, [permissions]);

  // User role management
  const assignRole = useCallback(async (
    userId: string, 
    roleId: string, 
    options?: { teamId?: string; organizationId?: string; expiresAt?: string }
  ): Promise<boolean> => {
    try {
      setLoading(true);

      const userRoleData = {
        user_id: userId,
        role_id: roleId,
        team_id: options?.teamId || sessionContext?.current_team_id,
        organization_id: options?.organizationId || sessionContext?.current_organization_id,
        expires_at: options?.expiresAt,
        is_active: true,
        granted_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_roles')
        .insert([userRoleData]);

      if (error) throw error;

      await loadData();
      toast.success('Rôle assigné avec succès');
      return true;
    } catch (err) {
      console.error('Error assigning role:', err);
      toast.error('Erreur lors de l\'assignation du rôle');
      return false;
    } finally {
      setLoading(false);
    }
  }, [sessionContext, loadData]);

  const revokeRole = useCallback(async (userRoleId: string): Promise<boolean> => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('id', userRoleId);

      if (error) throw error;

      await loadData();
      toast.success('Rôle révoqué avec succès');
      return true;
    } catch (err) {
      console.error('Error revoking role:', err);
      toast.error('Erreur lors de la révocation du rôle');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  const getUserRoles = useCallback((userId: string): UserRole[] => {
    return userRoles.filter(ur => ur.user_id === userId && ur.is_active);
  }, [userRoles]);

  const getRoleUsers = useCallback((roleId: string): UserRole[] => {
    return userRoles.filter(ur => ur.role_id === roleId && ur.is_active);
  }, [userRoles]);

  // Utility functions
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load data on mount
  useEffect(() => {
    if (autoLoad && sessionContext?.current_team_id) {
      loadData();
    }
  }, [autoLoad, loadData, sessionContext?.current_team_id]);

  // Computed values
  const totalRoles = roles.length;
  const systemRoles = roles.filter(r => r.is_system_role);
  const customRoles = roles.filter(r => !r.is_system_role);
  const totalPermissions = permissions.length;

  return {
    // Data
    roles,
    permissions,
    rolePermissions,
    userRoles,
    
    // Loading states
    loading,
    error,
    
    // Role management
    createRole,
    updateRole,
    deleteRole,
    duplicateRole,
    
    // Permission management
    updateRolePermissions,
    getRolePermissions,
    getPermissionsByCategory,
    getPermissionCategories,
    
    // User role management
    assignRole,
    revokeRole,
    getUserRoles,
    getRoleUsers,
    
    // Utility functions
    refresh,
    clearError,
    
    // Computed data
    totalRoles,
    systemRoles,
    customRoles,
    totalPermissions
  };
};