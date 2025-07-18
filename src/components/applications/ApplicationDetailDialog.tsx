import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2, Code, Globe, GitBranch, Users } from 'lucide-react';
import type { Application } from '@/types/application';
import { ApplicationForm } from './ApplicationForm';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

interface ApplicationDetailDialogProps {
  application: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, data: any) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  businessServices: any[];
  teams: any[];
}

export function ApplicationDetailDialog({
  application,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  businessServices,
  teams
}: ApplicationDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!application) return null;

  const getBusinessServiceNames = (serviceIds?: string[]) => {
    if (!serviceIds || serviceIds.length === 0) return [];
    return serviceIds.map(id => {
      const service = businessServices.find(s => s.id === id);
      return service ? service.name : 'Service inconnu';
    });
  };

  const getTeamName = (teamId?: string) => {
    if (!teamId) return 'Non assigné';
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Équipe inconnue';
  };

  const getApplicationTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      web: 'Application Web',
      mobile: 'Application Mobile',
      desktop: 'Application Desktop',
      service: 'Service/API',
      api: 'API',
      database: 'Base de données',
      other: 'Autre'
    };
    return types[type] || type;
  };

  const getApplicationTypeIcon = (type: string) => {
    switch (type) {
      case 'web': return <Globe className="h-4 w-4" />;
      case 'mobile': return <Code className="h-4 w-4" />;
      case 'api':
      case 'service': return <GitBranch className="h-4 w-4" />;
      default: return <Code className="h-4 w-4" />;
    }
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
    const success = await onUpdate(application.id, data);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    const success = await onDelete(application.id);
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
            <DialogTitle>Modifier l'application</DialogTitle>
          </DialogHeader>
          <ApplicationForm
            initialData={{
              name: application.name,
              description: application.description,
              version: application.version,
              application_type: application.application_type,
              technology_stack: application.technology_stack,
              repository_url: application.repository_url,
              documentation_url: application.documentation_url,
              business_services: application.business_services,
              metadata: application.metadata
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
              <div className="flex items-center gap-2">
                {getApplicationTypeIcon(application.application_type)}
                <span>{application.name}</span>
                {application.version && (
                  <Badge variant="outline">v{application.version}</Badge>
                )}
              </div>
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
                  <Code className="h-5 w-5" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Type d'application</label>
                    <div className="mt-1 flex items-center gap-2">
                      {getApplicationTypeIcon(application.application_type)}
                      <span>{getApplicationTypeLabel(application.application_type)}</span>
                    </div>
                  </div>
                </div>
                
                {application.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="mt-1 text-sm">{application.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {application.repository_url && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Dépôt de code</label>
                      <a 
                        href={application.repository_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-1 text-sm text-blue-600 hover:underline block"
                      >
                        {application.repository_url}
                      </a>
                    </div>
                  )}
                  {application.documentation_url && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Documentation</label>
                      <a 
                        href={application.documentation_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-1 text-sm text-blue-600 hover:underline block"
                      >
                        {application.documentation_url}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stack technique */}
            {application.technology_stack && application.technology_stack.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Stack technique</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {application.technology_stack.map((tech, index) => (
                      <Badge key={index} variant="secondary">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Services métiers */}
            {application.business_services && application.business_services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Services métiers associés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {getBusinessServiceNames(application.business_services).map((serviceName, index) => (
                      <Badge key={index} variant="outline">
                        {serviceName}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}


            {/* Déploiements */}
            {application.deployments && application.deployments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Déploiements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {application.deployments.map((deployment, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <span className="font-medium">{deployment.environment_name}</span>
                          <Badge className="ml-2" variant="outline">
                            {deployment.deployment_type}
                          </Badge>
                        </div>
                        <Badge 
                          variant={deployment.status === 'running' ? 'default' : 'destructive'}
                        >
                          {deployment.status}
                        </Badge>
                      </div>
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
                    <p>{new Date(application.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Modifié le:</span>
                    <p>{new Date(application.updated_at).toLocaleDateString('fr-FR')}</p>
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
        title="Supprimer l'application"
        description={`Êtes-vous sûr de vouloir supprimer l'application "${application.name}" ? Cette action est irréversible.`}
        onConfirm={handleDelete}
      />
    </>
  );
}