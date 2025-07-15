// Types pour le système RBAC (Role-Based Access Control)

export interface Permission {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  team_id: string;
  name: string;
  display_name: string;
  description?: string;
  is_system: boolean;
  is_default: boolean;
  permissions: string[]; // IDs des permissions
  user_count: number;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  granted: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  granted_by?: string;
  granted_at: string;
  expires_at?: string;
  is_active: boolean;
}

export interface RBACContext {
  user: {
    id: string;
    team_id: string;
    roles: string[];
    permissions: string[];
  };
  roles: Role[];
  permissions: Permission[];
  isLoading: boolean;
  error: string | null;
}

// Types pour les actions RBAC
export type RBACAction = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'list' 
  | 'export' 
  | 'import' 
  | 'approve' 
  | 'reject' 
  | 'assign' 
  | 'manage';

export type RBACResource = 
  | 'users' 
  | 'roles' 
  | 'permissions' 
  | 'organizations' 
  | 'teams' 
  | 'itsm' 
  | 'cloud' 
  | 'monitoring' 
  | 'documentation' 
  | 'settings' 
  | 'reports';

// Interface pour les permissions granulaires
export interface GranularPermission {
  resource: RBACResource;
  action: RBACAction;
  conditions?: {
    team_id?: string;
    organization_id?: string;
    user_id?: string;
    [key: string]: any;
  };
}

// Types pour les hooks RBAC
export interface UseRBACOptions {
  teamId?: string;
  userId?: string;
  autoLoad?: boolean;
}

export interface UseRBACReturn {
  // Données
  roles: Role[];
  permissions: Permission[];
  userRoles: UserRole[];
  rolePermissions: RolePermission[];
  
  // États
  loading: boolean;
  error: string | null;
  
  // Actions
  checkPermission: (resource: RBACResource, action: RBACAction, conditions?: any) => boolean;
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
  hasAllRoles: (roleNames: string[]) => boolean;
  
  // Gestion des rôles
  assignRole: (userId: string, roleId: string, grantedBy?: string) => Promise<boolean>;
  revokeRole: (userId: string, roleId: string) => Promise<boolean>;
  updateUserRoles: (userId: string, roleIds: string[]) => Promise<boolean>;
  
  // Gestion des permissions
  grantPermission: (roleId: string, permissionId: string) => Promise<boolean>;
  revokePermission: (roleId: string, permissionId: string) => Promise<boolean>;
  updateRolePermissions: (roleId: string, permissionIds: string[]) => Promise<boolean>;
  
  // Utilitaires
  refresh: () => Promise<void>;
  clearError: () => void;
}

// Types pour les composants RBAC
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

// Types pour les utilitaires RBAC
export interface PermissionMatrix {
  [resource: string]: {
    [action: string]: boolean;
  };
}

export interface RoleMatrix {
  [roleName: string]: {
    permissions: string[];
    users: string[];
  };
}

// Constantes pour les permissions système
export const SYSTEM_PERMISSIONS: Permission[] = [
  // Gestion des utilisateurs
  {
    id: 'users.create',
    name: 'users.create',
    display_name: 'Créer des utilisateurs',
    description: 'Permet de créer de nouveaux utilisateurs',
    category: 'Gestion des utilisateurs',
    resource: 'users',
    action: 'create',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'users.read',
    name: 'users.read',
    display_name: 'Lire les utilisateurs',
    description: 'Permet de consulter les informations des utilisateurs',
    category: 'Gestion des utilisateurs',
    resource: 'users',
    action: 'read',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'users.update',
    name: 'users.update',
    display_name: 'Modifier les utilisateurs',
    description: 'Permet de modifier les informations des utilisateurs',
    category: 'Gestion des utilisateurs',
    resource: 'users',
    action: 'update',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'users.delete',
    name: 'users.delete',
    display_name: 'Supprimer les utilisateurs',
    description: 'Permet de supprimer des utilisateurs',
    category: 'Gestion des utilisateurs',
    resource: 'users',
    action: 'delete',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'users.list',
    name: 'users.list',
    display_name: 'Lister les utilisateurs',
    description: 'Permet de voir la liste des utilisateurs',
    category: 'Gestion des utilisateurs',
    resource: 'users',
    action: 'list',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  
  // Gestion des rôles
  {
    id: 'roles.create',
    name: 'roles.create',
    display_name: 'Créer des rôles',
    description: 'Permet de créer de nouveaux rôles',
    category: 'Gestion des rôles',
    resource: 'roles',
    action: 'create',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'roles.read',
    name: 'roles.read',
    display_name: 'Lire les rôles',
    description: 'Permet de consulter les informations des rôles',
    category: 'Gestion des rôles',
    resource: 'roles',
    action: 'read',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'roles.update',
    name: 'roles.update',
    display_name: 'Modifier les rôles',
    description: 'Permet de modifier les informations des rôles',
    category: 'Gestion des rôles',
    resource: 'roles',
    action: 'update',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'roles.delete',
    name: 'roles.delete',
    display_name: 'Supprimer les rôles',
    description: 'Permet de supprimer des rôles',
    category: 'Gestion des rôles',
    resource: 'roles',
    action: 'delete',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'roles.manage',
    name: 'roles.manage',
    display_name: 'Gérer les rôles',
    description: 'Permet de gérer les permissions des rôles',
    category: 'Gestion des rôles',
    resource: 'roles',
    action: 'manage',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  
  // Gestion des organisations
  {
    id: 'organizations.create',
    name: 'organizations.create',
    display_name: 'Créer des organisations',
    description: 'Permet de créer de nouvelles organisations',
    category: 'Gestion des organisations',
    resource: 'organizations',
    action: 'create',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'organizations.read',
    name: 'organizations.read',
    display_name: 'Lire les organisations',
    description: 'Permet de consulter les informations des organisations',
    category: 'Gestion des organisations',
    resource: 'organizations',
    action: 'read',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'organizations.update',
    name: 'organizations.update',
    display_name: 'Modifier les organisations',
    description: 'Permet de modifier les informations des organisations',
    category: 'Gestion des organisations',
    resource: 'organizations',
    action: 'update',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'organizations.delete',
    name: 'organizations.delete',
    display_name: 'Supprimer les organisations',
    description: 'Permet de supprimer des organisations',
    category: 'Gestion des organisations',
    resource: 'organizations',
    action: 'delete',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  
  // ITSM
  {
    id: 'itsm.create',
    name: 'itsm.create',
    display_name: 'Créer des tickets ITSM',
    description: 'Permet de créer des incidents, changements et demandes',
    category: 'ITSM',
    resource: 'itsm',
    action: 'create',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'itsm.read',
    name: 'itsm.read',
    display_name: 'Lire les tickets ITSM',
    description: 'Permet de consulter les tickets ITSM',
    category: 'ITSM',
    resource: 'itsm',
    action: 'read',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'itsm.update',
    name: 'itsm.update',
    display_name: 'Modifier les tickets ITSM',
    description: 'Permet de modifier les tickets ITSM',
    category: 'ITSM',
    resource: 'itsm',
    action: 'update',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'itsm.approve',
    name: 'itsm.approve',
    display_name: 'Approuver les tickets ITSM',
    description: 'Permet d\'approuver les changements et demandes',
    category: 'ITSM',
    resource: 'itsm',
    action: 'approve',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  
  // Cloud
  {
    id: 'cloud.read',
    name: 'cloud.read',
    display_name: 'Lire les ressources cloud',
    description: 'Permet de consulter l\'inventaire cloud',
    category: 'Cloud',
    resource: 'cloud',
    action: 'read',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'cloud.manage',
    name: 'cloud.manage',
    display_name: 'Gérer les ressources cloud',
    description: 'Permet de gérer les ressources cloud',
    category: 'Cloud',
    resource: 'cloud',
    action: 'manage',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  
  // Monitoring
  {
    id: 'monitoring.read',
    name: 'monitoring.read',
    display_name: 'Lire les métriques',
    description: 'Permet de consulter les métriques de monitoring',
    category: 'Monitoring',
    resource: 'monitoring',
    action: 'read',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'monitoring.manage',
    name: 'monitoring.manage',
    display_name: 'Gérer le monitoring',
    description: 'Permet de configurer le monitoring',
    category: 'Monitoring',
    resource: 'monitoring',
    action: 'manage',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  
  // Documentation
  {
    id: 'documentation.read',
    name: 'documentation.read',
    display_name: 'Lire la documentation',
    description: 'Permet de consulter la documentation',
    category: 'Documentation',
    resource: 'documentation',
    action: 'read',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'documentation.manage',
    name: 'documentation.manage',
    display_name: 'Gérer la documentation',
    description: 'Permet de créer et modifier la documentation',
    category: 'Documentation',
    resource: 'documentation',
    action: 'manage',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  
  // Paramètres
  {
    id: 'settings.read',
    name: 'settings.read',
    display_name: 'Lire les paramètres',
    description: 'Permet de consulter les paramètres',
    category: 'Paramètres',
    resource: 'settings',
    action: 'read',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'settings.manage',
    name: 'settings.manage',
    display_name: 'Gérer les paramètres',
    description: 'Permet de modifier les paramètres',
    category: 'Paramètres',
    resource: 'settings',
    action: 'manage',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Supprimer SYSTEM_ROLES et DEFAULT_ROLE_PERMISSIONS (remplacés par la table 'roles' et 'permissions')
// Adapter les types pour qu'ils correspondent à la nouvelle structure dynamique 