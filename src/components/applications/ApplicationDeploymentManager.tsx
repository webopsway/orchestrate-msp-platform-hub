import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ApplicationDeploymentForm } from './ApplicationDeploymentForm';
import { useApplicationDeployments } from '@/hooks/useApplicationDeployments';
import { Plus, Server, Calendar, Globe, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function ApplicationDeploymentManager() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { deployments, isLoading, createDeployment } = useApplicationDeployments();

  const handleCreateDeployment = async (data: any) => {
    const success = await createDeployment(data);
    if (success) {
      setIsCreateDialogOpen(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'stopped': return 'bg-red-100 text-red-800';
      case 'deploying': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEnvironmentColor = (env: string) => {
    switch (env.toLowerCase()) {
      case 'production': return 'bg-red-100 text-red-800';
      case 'staging': return 'bg-yellow-100 text-yellow-800';
      case 'development': 
      case 'dev': return 'bg-blue-100 text-blue-800';
      case 'test': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/3 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Déploiements d'Applications</h2>
          <p className="text-muted-foreground">
            Gérez les déploiements de vos applications sur votre infrastructure cloud
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Déploiement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un nouveau déploiement</DialogTitle>
            </DialogHeader>
            <ApplicationDeploymentForm 
              onSubmit={handleCreateDeployment}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {deployments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun déploiement</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par créer votre premier déploiement d'application.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un déploiement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {deployments.map((deployment) => (
            <Card key={deployment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Server className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">
                        {(deployment as any).applications?.name || 'Application inconnue'}
                      </h3>
                      <Badge className={getStatusColor(deployment.status)}>
                        <Activity className="h-3 w-3 mr-1" />
                        {deployment.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Environnement</p>
                        <Badge className={getEnvironmentColor(deployment.environment_name)}>
                          {deployment.environment_name}
                        </Badge>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Asset Cloud</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Globe className="h-3 w-3" />
                          <span className="text-sm">
                            {(deployment as any).cloud_asset?.asset_name || 'Asset inconnu'}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Date de déploiement</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          <span className="text-sm">
                            {format(new Date(deployment.deployment_date), 'dd MMM yyyy', { locale: fr })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {deployment.version && (
                      <div className="mt-3">
                        <span className="text-sm text-muted-foreground">Version: </span>
                        <Badge variant="outline">{deployment.version}</Badge>
                      </div>
                    )}

                    {deployment.health_check_url && (
                      <div className="mt-2">
                        <span className="text-sm text-muted-foreground">URL de santé: </span>
                        <a 
                          href={deployment.health_check_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {deployment.health_check_url}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}