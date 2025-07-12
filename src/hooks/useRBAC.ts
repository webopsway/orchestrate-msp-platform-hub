import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SimplePermission, SimpleRole, SimpleRolePermission, SimpleUserRole } from "@/types/simple";

export interface UseRBACOptions {
  teamId?: string;
  userId?: string;
  autoLoad?: boolean;
}

export interface UseRBACReturn {
  roles: SimpleRole[];
  permissions: SimplePermission[];
  userRoles: SimpleUserRole[];
  rolePermissions: SimpleRolePermission[];
  loading: boolean;
  error: string | null;
  checkPermission: (resource: string, action: string) => boolean;
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
  hasAllRoles: (roleNames: string[]) => boolean;
  assignRole: (userId: string, roleId: string) => Promise<boolean>;
  revokeRole: (userId: string, roleId: string) => Promise<boolean>;
  updateUserRoles: (userId: string, roleIds: string[]) => Promise<boolean>;
  grantPermission: (roleId: string, permissionId: string) => Promise<boolean>;
  revokePermission: (roleId: string, permissionId: string) => Promise<boolean>;
  updateRolePermissions: (roleId: string, permissionIds: string[]) => Promise<boolean>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function useRBAC(options: UseRBACOptions = {}): UseRBACReturn {
  const { userProfile, user } = useAuth();
  const { teamId, userId, autoLoad = true } = options;

  const [roles, setRoles] = useState<SimpleRole[]>([]);
  const [permissions, setPermissions] = useState<SimplePermission[]>([]);
  const [userRoles, setUserRoles] = useState<SimpleUserRole[]>([]);
  const [rolePermissions, setRolePermissions] = useState<SimpleRolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveTeamId = teamId || userProfile?.default_team_id;
  const effectiveUserId = userId || user?.id;

  const userPermissions = useMemo(() => {
    if (!effectiveUserId) return new Set<string>();

    const userRoleIds = userRoles
      .filter(ur => ur.user_id === effectiveUserId && ur.is_active)
      .map(ur => ur.role_id);

    const rolePermissionIds = rolePermissions
      .filter(rp => userRoleIds.includes(rp.role_id))
      .map(rp => rp.permission_id);

    return new Set(rolePermissionIds);
  }, [userRoles, rolePermissions, effectiveUserId]);

  const userRoleNames = useMemo(() => {
    if (!effectiveUserId) return new Set<string>();

    const userRoleIds = userRoles
      .filter(ur => ur.user_id === effectiveUserId && ur.is_active)
      .map(ur => ur.role_id);

    return new Set(
      roles
        .filter(role => userRoleIds.includes(role.id))
        .map(role => role.name)
    );
  }, [userRoles, roles, effectiveUserId]);

  const loadRBACData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .order('display_name', { ascending: true });

      if (permissionsError) throw permissionsError;

      const mappedPermissions: SimplePermission[] = (permissionsData || []).map(p => ({
        id: p.id,
        name: p.name,
        display_name: p.display_name,
        description: p.description,
        resource: p.resource,
        action: p.action,
        created_at: p.created_at
      }));

      setPermissions(mappedPermissions);

      // Load roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .order('display_name', { ascending: true });

      if (rolesError) throw rolesError;

      const mappedRoles: SimpleRole[] = (rolesData || []).map(r => ({
        id: r.id,
        name: r.name,
        display_name: r.display_name,
        description: r.description,
        created_at: r.created_at,
        updated_at: r.updated_at
      }));

      setRoles(mappedRoles);

      // Load role permissions
      const { data: rolePermissionsData, error: rolePermissionsError } = await supabase
        .from('role_permissions')
        .select('*');

      if (rolePermissionsError) throw rolePermissionsError;

      const mappedRolePermissions: SimpleRolePermission[] = (rolePermissionsData || []).map(rp => ({
        id: rp.id,
        role_id: rp.role_id,
        permission_id: rp.permission_id,
        granted_at: rp.granted_at,
        granted_by: rp.granted_by
      }));

      setRolePermissions(mappedRolePermissions);

      // Load user roles
      const { data: userRolesData, error: userRolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (userRolesError) throw userRolesError;

      const mappedUserRoles: SimpleUserRole[] = (userRolesData || []).map(ur => ({
        id: ur.id,
        user_id: ur.user_id,
        role_id: ur.role_id,
        team_id: ur.team_id,
        organization_id: ur.organization_id,
        granted_at: ur.granted_at,
        granted_by: ur.granted_by,
        is_active: ur.is_active
      }));

      setUserRoles(mappedUserRoles);

    } catch (err: any) {
      const errorMessage = err.message || 'Error loading RBAC data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkPermission = useCallback((resource: string, action: string): boolean => {
    const permissionName = `${resource}.${action}`;
    return userPermissions.has(permissionName);
  }, [userPermissions]);

  const hasRole = useCallback((roleName: string): boolean => {
    return userRoleNames.has(roleName);
  }, [userRoleNames]);

  const hasAnyRole = useCallback((roleNames: string[]): boolean => {
    return roleNames.some(roleName => userRoleNames.has(roleName));
  }, [userRoleNames]);

  const hasAllRoles = useCallback((roleNames: string[]): boolean => {
    return roleNames.every(roleName => userRoleNames.has(roleName));
  }, [userRoleNames]);

  const assignRole = useCallback(async (userId: string, roleId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert([{
          user_id: userId,
          role_id: roleId,
          team_id: effectiveTeamId,
          granted_by: effectiveUserId,
          is_active: true
        }]);

      if (error) throw error;
      toast.success('Role assigned successfully');
      await loadRBACData();
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Error assigning role');
      return false;
    }
  }, [effectiveTeamId, effectiveUserId, loadRBACData]);

  const revokeRole = useCallback(async (userId: string, roleId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('role_id', roleId);

      if (error) throw error;
      toast.success('Role revoked successfully');
      await loadRBACData();
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Error revoking role');
      return false;
    }
  }, [loadRBACData]);

  const updateUserRoles = useCallback(async (userId: string, roleIds: string[]): Promise<boolean> => {
    // Simple implementation - just assign new roles
    try {
      // Deactivate existing roles
      await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', userId);

      // Add new roles
      if (roleIds.length > 0) {
        const userRoleData = roleIds.map(roleId => ({
          user_id: userId,
          role_id: roleId,
          team_id: effectiveTeamId,
          granted_by: effectiveUserId,
          is_active: true
        }));

        const { error } = await supabase
          .from('user_roles')
          .insert(userRoleData);

        if (error) throw error;
      }

      toast.success('User roles updated successfully');
      await loadRBACData();
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Error updating user roles');
      return false;
    }
  }, [effectiveTeamId, effectiveUserId, loadRBACData]);

  const grantPermission = useCallback(async (roleId: string, permissionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('role_permissions')
        .insert([{
          role_id: roleId,
          permission_id: permissionId,
          granted_at: new Date().toISOString()
        }]);

      if (error) throw error;
      toast.success('Permission granted successfully');
      await loadRBACData();
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Error granting permission');
      return false;
    }
  }, [loadRBACData]);

  const revokePermission = useCallback(async (roleId: string, permissionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId)
        .eq('permission_id', permissionId);

      if (error) throw error;
      toast.success('Permission revoked successfully');
      await loadRBACData();
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Error revoking permission');
      return false;
    }
  }, [loadRBACData]);

  const updateRolePermissions = useCallback(async (roleId: string, permissionIds: string[]): Promise<boolean> => {
    try {
      // Delete existing permissions
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

      toast.success('Role permissions updated successfully');
      await loadRBACData();
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Error updating role permissions');
      return false;
    }
  }, [loadRBACData]);

  const refresh = useCallback(async () => {
    await loadRBACData();
  }, [loadRBACData]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (autoLoad) {
      loadRBACData();
    }
  }, [autoLoad, loadRBACData]);

  return {
    roles,
    permissions,
    userRoles,
    rolePermissions,
    loading,
    error,
    checkPermission,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    assignRole,
    revokeRole,
    updateUserRoles,
    grantPermission,
    revokePermission,
    updateRolePermissions,
    refresh,
    clearError
  };
}