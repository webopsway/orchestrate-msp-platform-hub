import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MoreHorizontal, 
  Edit, 
  Trash, 
  Users,
  Cloud,
  MapPin,
  Building
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CloudAccountWithDetails, CloudEnvironment } from '@/hooks/useCloudAccounts';

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
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{account.name}</CardTitle>
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(account)}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onManageUsers(account)}>
                <Users className="mr-2 h-4 w-4" />
                Utilisateurs
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(account.id)}
                className="text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Cloud className="h-4 w-4" />
            <span>{account.cloud_providers?.display_name}</span>
          </div>
          
          {account.description && (
            <p className="text-sm text-muted-foreground">{account.description}</p>
          )}
          
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Building className="h-4 w-4" />
            <span>{account.organizations?.name}</span>
          </div>

          {account.region && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{account.region}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-1 mt-2">
            {account.environments?.map((env) => (
              <Badge 
                key={env.id} 
                variant="secondary" 
                className="text-xs"
                style={{ backgroundColor: env.color + '20', color: env.color, borderColor: env.color + '40' }}
              >
                {env.display_name}
              </Badge>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <Badge variant={account.is_active ? "default" : "secondary"}>
              {account.is_active ? "Actif" : "Inactif"}
            </Badge>
            <div className="flex items-center text-xs text-muted-foreground">
              <Users className="h-3 w-3 mr-1" />
              Actif
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};