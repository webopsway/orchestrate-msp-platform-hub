import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Cloud, 
  MapPin, 
  Calendar, 
  Users, 
  Edit, 
  Trash2, 
  Settings,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { CloudAccountWithDetails } from '@/hooks/useCloudAccounts';

interface CloudAccountCardProps {
  account: CloudAccountWithDetails;
  onEdit: (account: CloudAccountWithDetails) => void;
  onDelete: (id: string) => void;
  onManageUsers: (account: CloudAccountWithDetails) => void;
  canManage: boolean;
}

export const CloudAccountCard: React.FC<CloudAccountCardProps> = ({
  account,
  onEdit,
  onDelete,
  onManageUsers,
  canManage
}) => {
  const getEnvironmentColor = (environment: string) => {
    switch (environment) {
      case 'production':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'staging':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'development':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getEnvironmentLabel = (environment: string) => {
    switch (environment) {
      case 'production':
        return 'Prod';
      case 'staging':
        return 'Staging';
      case 'development':
        return 'Dev';
      default:
        return environment;
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {account.cloud_providers?.metadata && 
             typeof account.cloud_providers.metadata === 'object' &&
             !Array.isArray(account.cloud_providers.metadata) &&
             'icon_url' in account.cloud_providers.metadata &&
             account.cloud_providers.metadata.icon_url ? (
              <img 
                src={account.cloud_providers.metadata.icon_url as string} 
                alt={account.cloud_providers.display_name}
                className="h-8 w-8"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <Cloud className="h-8 w-8 text-muted-foreground" />
            )}
            <div>
              <CardTitle className="text-lg">{account.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {account.cloud_providers?.display_name}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge className={getStatusColor(account.is_active)}>
              {account.is_active ? 'Actif' : 'Inactif'}
            </Badge>
            {(account.environment as string[] || ['production']).map((env) => (
              <Badge key={env} className={getEnvironmentColor(env)}>
                {getEnvironmentLabel(env)}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {account.description && (
          <p className="text-sm text-muted-foreground">
            {account.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Organisation</p>
            <p className="font-medium">{account.organizations?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Équipe</p>
            <p className="font-medium">{account.teams?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Identifiant</p>
            <p className="font-mono text-xs">{account.account_identifier}</p>
          </div>
          {account.region && (
            <div>
              <p className="text-muted-foreground">Région</p>
              <p className="font-medium flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {account.region}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1" />
            {format(new Date(account.created_at), 'dd/MM/yyyy', { locale: fr })}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <Users className="h-3 w-3 mr-1" />
            {account.profiles?.length || 0} utilisateur(s)
          </div>
        </div>

        {canManage && (
          <div className="flex space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(account)}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onManageUsers(account)}
              className="flex-1"
            >
              <Users className="h-4 w-4 mr-2" />
              Utilisateurs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(account.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};