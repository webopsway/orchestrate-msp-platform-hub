import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Edit, Trash2, Users, Building, Settings } from 'lucide-react';
import type { BusinessService } from '@/types/application';
import { BusinessServiceForm } from './BusinessServiceForm';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

interface BusinessServiceDetailDialogProps {
  service: BusinessService | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, data: any) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  teams: any[];
  organizations: any[];
  applications: any[];
  cloudAssets: any[];
}

export function BusinessServiceDetailDialog({
  service,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  teams,
  organizations,
  applications,
  cloudAssets
}: BusinessServiceDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!service) return null;

  const getTeamName = (teamId?: string) => {
    if (!teamId) return 'Non assigné';
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Équipe inconnue';
  };

  const getOrganizationName = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    return org ? org.name : 'Organisation inconnue';
  };

  const getApplicationNames = (appIds?: string[]) => {
    if (!appIds || appIds.length === 0) return [];
    return appIds.map(id => {
      const app = applications.find(a => a.id === id);
      return app ? app.name : 'Application inconnue';
    });
  };

  const getCloudAssetNames = (assetIds?: string[]) => {
    if (!assetIds || assetIds.length === 0) return [];
    return assetIds.map(id => {
      const asset = cloudAssets.find(a => a.id === id);
      return asset ? asset.asset_name : 'Asset inconnu';
    });
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCriticalityLabel = (criticality: string) => {
    switch (criticality) {
      case 'low': return 'Faible';
      case 'medium': return 'Moyenne';
      case 'high': return 'Élevée';
      case 'critical': return 'Critique';
      default: return criticality;
    }
  };

  const handleUpdate = async (data: any) => {
    const success = await onUpdate(service.id, data);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    const success = await onDelete(service.id);
    if (success) {
      setShowDeleteDialog(false);
      onOpenChange(false);
    }
  };

  if (isEditing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le service métier</DialogTitle>
          </DialogHeader>
          <BusinessServiceForm
            initialData={{
              name: service.name,
              description: service.description,
              criticality: service.criticality,
              organization_id: service.organization_id,
              business_owner_team_id: service.business_owner_team_id,
              technical_owner_team_id: service.technical_owner_team_id,
              application_stack: service.application_stack,
              technical_stack: service.technical_stack,
              business_owner: service.business_owner,
              technical_owner: service.technical_owner,
              service_level: service.service_level,
              metadata: service.metadata
            }}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{service.name}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Criticité</label>
                    <div className="mt-1">
                      <Badge className={getCriticalityColor(service.criticality)}>
                        {getCriticalityLabel(service.criticality)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Organisation</label>
                    <p className="mt-1">{getOrganizationName(service.organization_id)}</p>
                  </div>
                </div>
                
                {service.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="mt-1 text-sm">{service.description}</p>
                  </div>
                )}

                {service.service_level && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Niveau de service</label>
                    <p className="mt-1 text-sm">{service.service_level}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Équipes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Équipes responsables
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Propriétaire métier</label>
                    <p className="mt-1">{getTeamName(service.business_owner_team_id)}</p>
                    {service.business_owner && (
                      <p className="text-sm text-muted-foreground">Contact: {service.business_owner}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Propriétaire technique</label>
                    <p className="mt-1">{getTeamName(service.technical_owner_team_id)}</p>
                    {service.technical_owner && (
                      <p className="text-sm text-muted-foreground">Contact: {service.technical_owner}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stack applicative */}
            {service.application_stack && service.application_stack.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Stack applicative</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {getApplicationNames(service.application_stack).map((appName, index) => (
                      <Badge key={index} variant="secondary">
                        {appName}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stack technique */}
            {service.technical_stack && service.technical_stack.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Stack technique</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {getCloudAssetNames(service.technical_stack).map((assetName, index) => (
                      <Badge key={index} variant="outline">
                        {assetName}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Métadonnées */}
            <Card>
              <CardHeader>
                <CardTitle>Informations système</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Créé le:</span>
                    <p>{new Date(service.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Modifié le:</span>
                    <p>{new Date(service.updated_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Supprimer le service métier"
        description={`Êtes-vous sûr de vouloir supprimer le service métier "${service.name}" ? Cette action est irréversible.`}
        onConfirm={handleDelete}
      />
    </>
  );
}