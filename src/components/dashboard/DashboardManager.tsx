import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useDashboardConfigurations } from '@/hooks/useDashboardConfigurations';
import { DashboardBuilder } from './DashboardBuilder';
import { DashboardGridLayout } from './DashboardGridLayout';
import { Plus, Settings, Layout, Monitor } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function DashboardManager() {
  const { userProfile } = useAuth();
  const {
    configurations,
    availableWidgets,
    isLoading,
    createConfiguration,
    updateConfiguration,
    deleteConfiguration
  } = useDashboardConfigurations();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);

  const isMspAdmin = userProfile?.is_msp_admin || false;

  if (!isMspAdmin) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Accès Restreint</h3>
          <p className="text-muted-foreground">
            Seuls les administrateurs MSP peuvent gérer les configurations de dashboard.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleCreateConfiguration = async (data: any) => {
    const success = await createConfiguration(data);
    if (success) {
      setIsCreateDialogOpen(false);
    }
  };

  const handleUpdateConfiguration = async (data: any) => {
    if (!editingConfig) return;
    const success = await updateConfiguration(editingConfig.id, data);
    if (success) {
      setEditingConfig(null);
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
        <PageHeader
          title="Gestion des Dashboards"
          description="Configurez les dashboards pour vos équipes et organisations"
        />
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Dashboard
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer une configuration de dashboard</DialogTitle>
            </DialogHeader>
            <DashboardBuilder
              widgets={availableWidgets}
              onSave={handleCreateConfiguration}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="configurations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configurations" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Configurations
          </TabsTrigger>
          <TabsTrigger value="widgets" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Widgets Disponibles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-4">
          {configurations.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Layout className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucune configuration</h3>
                <p className="text-muted-foreground mb-4">
                  Créez votre première configuration de dashboard.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une configuration
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {configurations.map((config) => (
                <Card key={config.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {config.name}
                          {config.is_default && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                              Par défaut
                            </span>
                          )}
                        </CardTitle>
                        {config.description && (
                          <p className="text-muted-foreground mt-1">{config.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>
                            Cible: {
                              config.team_id ? 'Équipe spécifique' :
                              config.organization_id ? 'Organisation spécifique' :
                              'Global'
                            }
                          </span>
                          <span>{config.widgets.length} widgets</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingConfig(config)}
                        >
                          Modifier
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteConfiguration(config.id)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <DashboardGridLayout 
                      configuration={config} 
                      widgets={availableWidgets}
                      isEditing={false}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="widgets" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableWidgets.map((widget) => (
              <Card key={widget.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{widget.display_name}</CardTitle>
                  {widget.description && (
                    <p className="text-sm text-muted-foreground">{widget.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium capitalize">{widget.widget_type}</span>
                    {widget.is_system_widget && (
                      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                        Système
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog d'édition */}
      <Dialog open={!!editingConfig} onOpenChange={() => setEditingConfig(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la configuration</DialogTitle>
          </DialogHeader>
          {editingConfig && (
            <DashboardBuilder
              widgets={availableWidgets}
              initialData={editingConfig}
              onSave={handleUpdateConfiguration}
              onCancel={() => setEditingConfig(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}