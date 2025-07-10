import { ReactNode } from "react";
import { useRBAC } from "@/hooks/useRBAC";
import { RBACResource, RBACAction, RBACGuardProps } from "@/types/rbac";
import { AlertTriangle, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Composant de protection basé sur les permissions RBAC
 * Affiche le contenu seulement si l'utilisateur a la permission requise
 */
export const RBACGuard = ({
  resource,
  action,
  conditions,
  fallback,
  children
}: RBACGuardProps) => {
  const { checkPermission } = useRBAC();

  const hasPermission = checkPermission(resource, action);

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className="border-dashed border-2 border-muted-foreground/25">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg">Accès restreint</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>Vous n'avez pas les permissions nécessaires pour accéder à cette fonctionnalité.</p>
          <p className="text-sm mt-2">
            Permission requise : <code className="bg-muted px-2 py-1 rounded">{resource}.{action}</code>
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};

/**
 * Composant de protection basé sur les rôles
 * Affiche le contenu seulement si l'utilisateur a le(s) rôle(s) requis
 */
export const RoleGuard = ({
  roles,
  requireAll = false,
  fallback,
  children
}: {
  roles: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}) => {
  const { hasRole, hasAllRoles, hasAnyRole } = useRBAC();

  const hasRequiredRoles = requireAll 
    ? hasAllRoles(roles)
    : hasAnyRole(roles);

  if (!hasRequiredRoles) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className="border-dashed border-2 border-muted-foreground/25">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg">Rôle requis</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>
            Vous devez avoir {requireAll ? 'tous les' : 'au moins un des'} rôles suivants :
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {roles.map(role => (
              <code key={role} className="bg-muted px-2 py-1 rounded text-sm">
                {role}
              </code>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};

/**
 * Composant de protection basé sur les permissions spécifiques
 * Affiche le contenu seulement si l'utilisateur a la(les) permission(s) requise(s)
 */
export const PermissionGuard = ({
  permissions,
  requireAll = false,
  fallback,
  children
}: {
  permissions: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}) => {
  const { checkPermission } = useRBAC();

  const hasRequiredPermissions = permissions.every(permission => {
    const [resource, action] = permission.split('.');
    return checkPermission(resource as RBACResource, action as RBACAction);
  });

  const hasAnyPermission = permissions.some(permission => {
    const [resource, action] = permission.split('.');
    return checkPermission(resource as RBACResource, action as RBACAction);
  });

  const hasPermissions = requireAll ? hasRequiredPermissions : hasAnyPermission;

  if (!hasPermissions) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className="border-dashed border-2 border-muted-foreground/25">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg">Permissions requises</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>
            Vous devez avoir {requireAll ? 'toutes les' : 'au moins une des'} permissions suivantes :
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {permissions.map(permission => (
              <code key={permission} className="bg-muted px-2 py-1 rounded text-sm">
                {permission}
              </code>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};

/**
 * Composant pour afficher conditionnellement du contenu basé sur les permissions
 * Ne rend rien si l'utilisateur n'a pas la permission
 */
export const ConditionalRender = ({
  resource,
  action,
  conditions,
  children
}: {
  resource: RBACResource;
  action: RBACAction;
  conditions?: any;
  children: ReactNode;
}) => {
  const { checkPermission } = useRBAC();
  const hasPermission = checkPermission(resource, action);

  if (!hasPermission) {
    return null;
  }

  return <>{children}</>;
};

/**
 * Hook pour vérifier les permissions dans les composants
 */
export const usePermission = (resource: RBACResource, action: RBACAction, conditions?: any) => {
  const { checkPermission } = useRBAC();
  return checkPermission(resource, action);
};

/**
 * Hook pour vérifier les rôles dans les composants
 */
export const useRole = (roleName: string) => {
  const { hasRole } = useRBAC();
  return hasRole(roleName);
};

/**
 * Hook pour vérifier plusieurs rôles dans les composants
 */
export const useRoles = (roleNames: string[], requireAll = false) => {
  const { hasAllRoles, hasAnyRole } = useRBAC();
  return requireAll ? hasAllRoles(roleNames) : hasAnyRole(roleNames);
}; 