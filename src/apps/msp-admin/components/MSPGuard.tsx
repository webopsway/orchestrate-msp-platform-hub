import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';

interface MSPGuardProps {
  children: ReactNode;
}

export const MSPGuard: React.FC<MSPGuardProps> = ({ children }) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Vérifier que l'utilisateur est bien un admin MSP
  if (!userProfile?.is_msp_admin) {
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
                  Accès restreint
                </h3>
                <p className="text-gray-600 mt-2">
                  Cette interface est réservée aux administrateurs MSP.
                </p>
                <p className="text-sm text-gray-500 mt-4">
                  Si vous êtes un client, veuillez utiliser votre portail dédié.
                </p>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => window.location.href = '/auth'}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Se reconnecter avec un autre compte
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