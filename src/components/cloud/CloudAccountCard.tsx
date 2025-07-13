import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Users, 
  Globe, 
  Building,
  Calendar,
  MapPin
} from 'lucide-react';
import type { CloudAccountWithDetails } from '@/hooks/useCloudAccounts';

interface CloudAccountCardProps {
  account: CloudAccountWithDetails;
  onEdit: (account: CloudAccountWithDetails) => void;
  onDelete: (id: string) => void;
  onManageUsers: (account: CloudAccountWithDetails) => void;
  canManage: boolean;
}

export const CloudAccountCard = ({
  account,
  onEdit,
  onDelete,
  onManageUsers,
  canManage
}: CloudAccountCardProps) => {
  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'production': return 'default';
      case 'staging': return 'secondary';
      case 'development': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'default' : 'secondary';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-muted">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{account.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {account.cloud_providers?.display_name}
              </p>
            </div>
          </div>
          
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(account)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onManageUsers(account)}>
                  <Users className="h-4 w-4 mr-2" />
                  Gérer les accès
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(account.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {account.description && (
          <p className="text-sm text-muted-foreground">
            {account.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Badge variant={getStatusColor(account.is_active)}>
            {account.is_active ? 'Actif' : 'Inactif'}
          </Badge>
          <Badge variant={getEnvironmentColor(account.environment || 'production')}>
            {account.environment || 'production'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Organisation:</span>
          </div>
          <span className="font-medium">{account.organizations?.name}</span>

          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Équipe:</span>
          </div>
          <span className="font-medium">{account.teams?.name}</span>

          {account.region && (
            <>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Région:</span>
              </div>
              <span className="font-medium">{account.region}</span>
            </>
          )}

          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Créé le:</span>
          </div>
          <span className="font-medium">
            {new Date(account.created_at).toLocaleDateString()}
          </span>
        </div>

        <div className="text-xs text-muted-foreground">
          <span className="font-medium">ID:</span> {account.account_identifier}
        </div>

        {account.profiles && account.profiles.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {account.profiles.length} utilisateur(s) assigné(s)
              </span>
              {canManage && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onManageUsers(account)}
                >
                  <Users className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};