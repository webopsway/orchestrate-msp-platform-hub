// Export des composants RBAC
export { RBACGuard, RoleGuard, PermissionGuard, ConditionalRender } from './RBACGuard';
export { PermissionManagerPlaceholder } from './PermissionManagerPlaceholder';
export { UserRoleManager } from './UserRoleManager';

// Export des hooks utilitaires  
export { usePermission, useRole, useRoles } from './RBACGuard';

// Export des types
export type {
  RBACGuardProps,
  RoleGuardProps,
  PermissionGuardProps
} from '@/types/rbac';