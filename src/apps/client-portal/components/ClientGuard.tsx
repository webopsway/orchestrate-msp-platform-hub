import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertTriangle, Globe } from 'lucide-react';

interface ClientGuardProps {
  children: ReactNode;
}

export const ClientGuard: React.FC<ClientGuardProps> = ({ children }) => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { currentTenant, loading: tenantLoading, error: tenantError } = useTenant();
  const [accessGranted, setAccessGranted] = useState(false);

  useEffect(() => {
    if (authLoading || tenantLoading) return;

    // Vérifier si l'utilisateur a accès au tenant résolu
    if (currentTenant && userProfile) {
      // Vérifier si l'utilisateur appartient à l'organisation du tenant
      const hasAccess = userProfile.is_msp_admin || 
                       userProfile.default_organization_id === currentTenant.organization_id ||
                       currentTenant.allowed_organizations?.includes(userProfile.default_organization_id || '');
      
      setAccessGranted(hasAccess);
    }
  }, [authLoading, tenantLoading, currentTenant, userProfile]);

  if (authLoading || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement du portail...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Erreur de résolution du tenant
  if (tenantError || !currentTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Globe className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Domaine non configuré
                </h3>
                <p className="text-gray-600 mt-2">
                  Ce domaine n'est pas configuré ou n'est plus actif.
                </p>
                <p className="text-sm text-gray-500 mt-4">
                  Contactez votre administrateur pour plus d'informations.
                </p>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => window.location.href = '/auth'}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Retour à la connexion
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vérifier l'accès à ce tenant
  if (!accessGranted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Accès non autorisé
                </h3>
                <p className="text-gray-600 mt-2">
                  Vous n'avez pas accès à ce portail client.
                </p>
                <p className="text-sm text-gray-500 mt-4">
                  Domaine : {currentTenant.domain_name}
                </p>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => window.location.href = '/auth'}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Se connecter avec un autre compte
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}; 