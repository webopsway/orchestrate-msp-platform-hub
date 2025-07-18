import { useState } from 'react';
import { Plus, Search, Filter, Server, Globe, Smartphone, Database, Settings, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ApplicationForm } from '@/components/applications/ApplicationForm';
import { CreateDialog } from '@/components/common/CreateDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { useApplications } from '@/hooks/useApplications';
import type { Application, ApplicationFilters } from '@/types/application';

export function ApplicationManager() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filters, setFilters] = useState<ApplicationFilters>({});
  const { applications, isLoading, createApplication, updateApplication, deleteApplication } = useApplications();

  const getApplicationIcon = (type: string) => {
    switch (type) {
      case 'web': return Globe;
      case 'mobile': return Smartphone;
      case 'database': return Database;
      case 'service': return Settings;
      case 'api': return Layers;
      default: return Server;
    }
  };

  const getApplicationTypeColor = (type: string) => {
    switch (type) {
      case 'web': return 'bg-blue-500 text-white';
      case 'mobile': return 'bg-green-500 text-white';
      case 'database': return 'bg-purple-500 text-white';
      case 'service': return 'bg-orange-500 text-white';
      case 'api': return 'bg-cyan-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const filteredApplications = applications?.filter((app: Application) => {
    if (filters.search && !app.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.application_type && app.application_type !== filters.application_type) {
      return false;
    }
    return true;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions et filtres */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher des applications..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10 w-64"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Application
        </Button>
      </div>

      {/* Liste des applications */}
      {filteredApplications.length === 0 ? (
        <EmptyState
          title="Aucune application"
          description="Commencez par enregistrer votre première application"
          action={
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une application
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredApplications.map((app: Application) => {
            const IconComponent = getApplicationIcon(app.application_type);
            return (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">{app.name}</CardTitle>
                    </div>
                    <Badge className={getApplicationTypeColor(app.application_type)}>
                      {app.application_type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {app.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {app.description}
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    {app.version && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Version:</span>
                        <span>{app.version}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Services métiers:</span>
                      <span>{app.business_services?.length || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Déploiements:</span>
                      <span>{app.deployments?.length || 0}</span>
                    </div>
                  </div>

                  {app.technology_stack && app.technology_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {app.technology_stack.slice(0, 3).map((tech, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                      {app.technology_stack.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{app.technology_stack.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog de création */}
      <CreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        title="Nouvelle Application"
        description="Enregistrez une nouvelle application et configurez ses déploiements."
      >
        <ApplicationForm
          onSubmit={async (data) => {
            await createApplication(data);
            setShowCreateDialog(false);
          }}
          onCancel={() => setShowCreateDialog(false)}
        />
      </CreateDialog>
    </div>
  );
}