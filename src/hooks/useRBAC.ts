import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Permission,
  Role,
  RolePermission,
  UserRole,
  RBACResource,
  RBACAction,
  UseRBACOptions,
  UseRBACReturn,
  SYSTEM_PERMISSIONS,
  SYSTEM_ROLES,
  DEFAULT_ROLE_PERMISSIONS
} from "@/types/rbac";

export function useRBAC(options: UseRBACOptions = {}): UseRBACReturn {
  const { sessionContext } = useAuth();
  const { teamId, userId, autoLoad = true } = options;

  // États pour les données RBAC
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  
  // États pour la gestion
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ID de l'équipe à utiliser (priorité: options > session > null)
  const effectiveTeamId = teamId || sessionContext?.current_team_id;
  
  // ID de l'utilisateur à utiliser (priorité: options > session > null)
  const effectiveUserId = userId || sessionContext?.user?.id;

  // Cache des permissions de l'utilisateur actuel
  const userPermissions = useMemo(() => {
    if (!effectiveUserId || !effectiveTeamId) return new Set<string>();

    const userRoleIds = userRoles
      .filter(ur => ur.user_id === effectiveUserId && ur.is_active)
      .map(ur => ur.role_id);

    const rolePermissionIds = rolePermissions
      .filter(rp => userRoleIds.includes(rp.role_id) && rp.granted)
      .map(rp => rp.permission_id);

    return new Set(rolePermissionIds);
  }, [userRoles, rolePermissions, effectiveUserId, effectiveTeamId]);

  // Cache des rôles de l'utilisateur actuel
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

  // Charger les données RBAC
  const loadRBACData = useCallback(async () => {
    if (!effectiveTeamId) return;

    try {
      setLoading(true);
      setError(null);

      // Charger les permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .order('category', { ascending: true })
        .order('display_name', { ascending: true });

      if (permissionsError) throw permissionsError;
      setPermissions(permissionsData || []);

      // Charger les rôles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*, user_count:users(count)')
        .eq('team_id', effectiveTeamId)
        .order('is_system', { ascending: false })
        .order('display_name', { ascending: true });

      if (rolesError) throw rolesError;
      setRoles(rolesData || []);

      // Charger les relations rôle-permission
      const { data: rolePermissionsData, error: rolePermissionsError } = await supabase
        .from('role_permissions')
        .select('*')
        .in('role_id', rolesData?.map(r => r.id) || []);

      if (rolePermissionsError) throw rolePermissionsError;
      setRolePermissions(rolePermissionsData || []);

      // Charger les relations utilisateur-rôle
      const { data: userRolesData, error: userRolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('team_id', effectiveTeamId);

      if (userRolesError) throw userRolesError;
      setUserRoles(userRolesData || []);

    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du chargement des données RBAC';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [effectiveTeamId]);

  // Initialiser les données système si nécessaire
  const initializeSystemData = useCallback(async () => {
    if (!effectiveTeamId) return;

    try {
      // Vérifier si les permissions système existent
      const { data: existingPermissions } = await supabase
        .from('permissions')
        .select('id')
        .eq('is_system', true)
        .limit(1);

      if (!existingPermissions || existingPermissions.length === 0) {
        // Insérer les permissions système
        const { error: insertPermissionsError } = await supabase
          .from('permissions')
          .insert(SYSTEM_PERMISSIONS);

        if (insertPermissionsError) throw insertPermissionsError;
        toast.success('Permissions système initialisées');
      }

      // Vérifier si les rôles système existent
      const { data: existingRoles } = await supabase
        .from('roles')
        .select('id')
        .eq('team_id', effectiveTeamId)
        .eq('is_system', true)
        .limit(1);

      if (!existingRoles || existingRoles.length === 0) {
        // Créer les rôles système
        const systemRolesData = Object.entries(SYSTEM_ROLES).map(([key, name]) => ({
          team_id: effectiveTeamId,
          name,
          display_name: key.replace('_', ' ').toUpperCase(),
          description: `Rôle système ${name}`,
          is_system: true,
          is_default: name === SYSTEM_ROLES.TEAM_MEMBER,
          permissions: DEFAULT_ROLE_PERMISSIONS[name] || []
        }));

        const { data: insertedRoles, error: insertRolesError } = await supabase
          .from('roles')
          .insert(systemRolesData)
          .select();

        if (insertRolesError) throw insertRolesError;

        // Créer les relations rôle-permission pour les rôles système
        const rolePermissionData = insertedRoles.flatMap(role => 
          (role.permissions as string[]).map(permissionName => ({
            role_id: role.id,
            permission_id: permissionName,
            granted: true
          }))
        );

        if (rolePermissionData.length > 0) {
          const { error: insertRolePermissionsError } = await supabase
            .from('role_permissions')
            .insert(rolePermissionData);

          if (insertRolePermissionsError) throw insertRolePermissionsError;
        }

        toast.success('Rôles système initialisés');
      }

      // Recharger les données
      await loadRBACData();
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'initialisation des données système';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [effectiveTeamId, loadRBACData]);

  // Vérifier une permission
  const checkPermission = useCallback((
    resource: RBACResource,
    action: RBACAction,
    conditions?: any
  ): boolean => {
    if (!effectiveUserId || !effectiveTeamId) return false;

    // Vérifier les conditions d'équipe
    if (conditions?.team_id && conditions.team_id !== effectiveTeamId) {
      return false;
    }

    // Construire le nom de la permission
    const permissionName = `${resource}.${action}`;

    // Vérifier si l'utilisateur a la permission
    return userPermissions.has(permissionName);
  }, [userPermissions, effectiveUserId, effectiveTeamId]);

  // Vérifier un rôle
  const hasRole = useCallback((roleName: string): boolean => {
    return userRoleNames.has(roleName);
  }, [userRoleNames]);

  // Vérifier si l'utilisateur a au moins un des rôles
  const hasAnyRole = useCallback((roleNames: string[]): boolean => {
    return roleNames.some(roleName => userRoleNames.has(roleName));
  }, [userRoleNames]);

  // Vérifier si l'utilisateur a tous les rôles
  const hasAllRoles = useCallback((roleNames: string[]): boolean => {
    return roleNames.every(roleName => userRoleNames.has(roleName));
  }, [userRoleNames]);

  // Assigner un rôle à un utilisateur
  const assignRole = useCallback(async (
    userId: string,
    roleId: string,
    grantedBy?: string
  ): Promise<boolean> => {
    try {
      setError(null);

      const { error: assignError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: userId,
          role_id: roleId,
          team_id: effectiveTeamId,
          granted_by: grantedBy || effectiveUserId,
          granted_at: new Date().toISOString(),
          is_active: true
        }]);

      if (assignError) throw assignError;

      toast.success('Rôle assigné avec succès');
      await loadRBACData();
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'assignation du rôle';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, [effectiveTeamId, effectiveUserId, loadRBACData]);

  // Révoquer un rôle d'un utilisateur
  const revokeRole = useCallback(async (
    userId: string,
    roleId: string
  ): Promise<boolean> => {
    try {
      setError(null);

      const { error: revokeError } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('role_id', roleId)
        .eq('team_id', effectiveTeamId);

      if (revokeError) throw revokeError;

      toast.success('Rôle révoqué avec succès');
      await loadRBACData();
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la révocation du rôle';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, [effectiveTeamId, loadRBACData]);

  // Mettre à jour les rôles d'un utilisateur
  const updateUserRoles = useCallback(async (
    userId: string,
    roleIds: string[]
  ): Promise<boolean> => {
    try {
      setError(null);

      // Désactiver tous les rôles actuels
      const { error: deactivateError } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('team_id', effectiveTeamId);

      if (deactivateError) throw deactivateError;

      // Activer les nouveaux rôles
      if (roleIds.length > 0) {
        const userRoleData = roleIds.map(roleId => ({
          user_id: userId,
          role_id: roleId,
          team_id: effectiveTeamId,
          granted_by: effectiveUserId,
          granted_at: new Date().toISOString(),
          is_active: true
        }));

        const { error: activateError } = await supabase
          .from('user_roles')
          .upsert(userRoleData, { onConflict: 'user_id,role_id' });

        if (activateError) throw activateError;
      }

      toast.success('Rôles mis à jour avec succès');
      await loadRBACData();
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la mise à jour des rôles';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, [effectiveTeamId, effectiveUserId, loadRBACData]);

  // Accorder une permission à un rôle
  const grantPermission = useCallback(async (
    roleId: string,
    permissionId: string
  ): Promise<boolean> => {
    try {
      setError(null);

      const { error: grantError } = await supabase
        .from('role_permissions')
        .upsert([{
          role_id: roleId,
          permission_id: permissionId,
          granted: true
        }], { onConflict: 'role_id,permission_id' });

      if (grantError) throw grantError;

      toast.success('Permission accordée avec succès');
      await loadRBACData();
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'accord de la permission';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, [loadRBACData]);

  // Révoquer une permission d'un rôle
  const revokePermission = useCallback(async (
    roleId: string,
    permissionId: string
  ): Promise<boolean> => {
    try {
      setError(null);

      const { error: revokeError } = await supabase
        .from('role_permissions')
        .update({ granted: false })
        .eq('role_id', roleId)
        .eq('permission_id', permissionId);

      if (revokeError) throw revokeError;

      toast.success('Permission révoquée avec succès');
      await loadRBACData();
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la révocation de la permission';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, [loadRBACData]);

  // Mettre à jour les permissions d'un rôle
  const updateRolePermissions = useCallback(async (
    roleId: string,
    permissionIds: string[]
  ): Promise<boolean> => {
    try {
      setError(null);

      // Récupérer toutes les permissions existantes pour ce rôle
      const { data: existingPermissions } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', roleId);

      const existingPermissionIds = existingPermissions?.map(p => p.permission_id) || [];

      // Désactiver toutes les permissions actuelles
      if (existingPermissionIds.length > 0) {
        const { error: deactivateError } = await supabase
          .from('role_permissions')
          .update({ granted: false })
          .eq('role_id', roleId);

        if (deactivateError) throw deactivateError;
      }

      // Activer les nouvelles permissions
      if (permissionIds.length > 0) {
        const rolePermissionData = permissionIds.map(permissionId => ({
          role_id: roleId,
          permission_id: permissionId,
          granted: true
        }));

        const { error: activateError } = await supabase
          .from('role_permissions')
          .upsert(rolePermissionData, { onConflict: 'role_id,permission_id' });

        if (activateError) throw activateError;
      }

      toast.success('Permissions mises à jour avec succès');
      await loadRBACData();
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la mise à jour des permissions';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, [loadRBACData]);

  // Actualiser les données
  const refresh = useCallback(async () => {
    await loadRBACData();
  }, [loadRBACData]);

  // Effacer l'erreur
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Charger les données au montage
  useEffect(() => {
    if (autoLoad && effectiveTeamId) {
      initializeSystemData();
    }
  }, [autoLoad, effectiveTeamId, initializeSystemData]);

  return {
    // Données
    roles,
    permissions,
    userRoles,
    rolePermissions,
    
    // États
    loading,
    error,
    
    // Actions
    checkPermission,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    
    // Gestion des rôles
    assignRole,
    revokeRole,
    updateUserRoles,
    
    // Gestion des permissions
    grantPermission,
    revokePermission,
    updateRolePermissions,
    
    // Utilitaires
    refresh,
    clearError
  };
} 