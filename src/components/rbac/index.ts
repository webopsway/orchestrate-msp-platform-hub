// Export des composants RBAC
export { RBACGuard, RoleGuard, PermissionGuard, ConditionalRender } from './RBACGuard';
export { PermissionManager } from './PermissionManager';
export { UserRoleManager } from './UserRoleManager';

// Export des hooks utilitaires
export { usePermission, useRole, useRoles } from './RBACGuard';

// Export des types
export type {
  RBACGuardProps,
  RoleGuardProps,
  PermissionGuardProps
} from '@/types/rbac'; 