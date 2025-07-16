export interface Permission {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  resource: string;
  action: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_system_role?: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  organization_id?: string;
  team_id?: string;
  granted_at: string;
  granted_by?: string;
  expires_at?: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  user_role_catalog_id?: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  granted_at: string;
  granted_by?: string;
}

export const SYSTEM_ROLES = {
  MSP_ADMIN: 'msp_admin',
  ORG_ADMIN: 'org_admin',
  TEAM_ADMIN: 'team_admin',
  USER: 'user',
  VIEWER: 'viewer'
} as const;

export type SystemRole = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];

// RBAC Types
export type RBACResource = 'users' | 'roles' | 'permissions' | 'organizations' | 'teams' | 'incidents' | 'changes' | 'assets' | 'vulnerabilities';
export type RBACAction = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'assign';

export interface RBACGuardProps {
  resource: RBACResource;
  action: RBACAction;
  conditions?: any;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export interface RoleGuardProps {
  roles: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export interface PermissionGuardProps {
  permissions: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}