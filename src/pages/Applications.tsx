import { useState, useEffect, useMemo } from 'react';
import { useApplications } from '@/hooks/useApplications';
import { PageHeader, DataGrid, StatsCard } from '@/components/common';
import { ApplicationForm } from '@/components/forms/ApplicationForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Server, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Code,
  Package,
  TrendingUp,
  BarChart3,
  Activity,
  ExternalLink,
  GitBranch,
  FileText,
  Globe,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { 
  ApplicationWithDetails, 
  ApplicationFormData, 
  ApplicationFilters 
} from '@/types/application';

const Applications = () => {
  const {
    applications,
    loading,
    error,
    stats,
    createApplication,
    updateApplication,
    deleteApplication,
    fetchApplications,
    refreshData
  } = useApplications();

  // États pour les modals et filtres
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithDetails | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [technologyFilter, setTechnologyFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Filtrer les applications
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const matchesSearch = searchTerm === '' || 
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'all' || 
        app.application_type === typeFilter;
      
      const matchesTechnology = technologyFilter === 'all' || 
        app.technology_stack?.includes(technologyFilter);

      return matchesSearch && matchesType && matchesTechnology;
    });
  }, [applications, searchTerm, typeFilter, technologyFilter]);

  // Gestionnaires d'événements
  const handleCreateApplication = async (data: ApplicationFormData) => {
    const success = await createApplication(data);
    if (success) {
      setIsCreateModalOpen(false);
    }
    return success;
  };

  const handleUpdateApplication = async (data: ApplicationFormData) => {
    if (!selectedApplication) return false;
    const success = await updateApplication({ id: selectedApplication.id, ...data });
    if (success) {
      setIsEditModalOpen(false);
      setSelectedApplication(null);
    }
    return success;
  };

  const handleDeleteApplication = async () => {
    if (!selectedApplication) return;
    const success = await deleteApplication(selectedApplication.id);
    if (success) {
      setIsDeleteModalOpen(false);
      setSelectedApplication(null);
    }
  };

  const openViewModal = (app: ApplicationWithDetails) => {
    setSelectedApplication(app);
    setIsViewModalOpen(true);
  };

  const openEditModal = (app: ApplicationWithDetails) => {
    setSelectedApplication(app);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (app: ApplicationWithDetails) => {
    setSelectedApplication(app);
    setIsDeleteModalOpen(true);
  };

  const getApplicationTypeIcon = (type: string) => {
    switch (type) {
      case 'web': return <Globe className="h-4 w-4" />;
      case 'api': return <Server className="h-4 w-4" />;
      case 'mobile': return <Package className="h-4 w-4" />;
      case 'database': return <FileText className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

  const getApplicationTypeBadge = (type: string) => {
    const colors = {
      web: 'bg-blue-100 text-blue-800',
      api: 'bg-green-100 text-green-800',
      mobile: 'bg-purple-100 text-purple-800',
      database: 'bg-orange-100 text-orange-800',
      microservice: 'bg-cyan-100 text-cyan-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Données pour les statistiques
  const statsCards = [
    {
      title: 'Applications totales',
      value: stats?.total.toString() || '0',
      description: 'Dans l\'équipe',
      icon: Server,
      trend: '+3 ce mois'
    },
    {
      title: 'Services métiers liés',
      value: stats?.business_services_coverage.with_services.toString() || '0',
      description: 'Applications connectées',
      icon: Package,
      trend: `${Math.round(((stats?.business_services_coverage.with_services || 0) / (stats?.total || 1)) * 100)}%`
    },
    {
      title: 'Déploiements actifs',
      value: stats?.deployment_stats.active_environments.toString() || '0',
      description: 'Environnements',
      icon: Activity,
      trend: `${stats?.deployment_stats.recent_deployments || 0} récents`
    },
    {
      title: 'Santé globale',
      value: `${Math.round(((stats?.health_metrics.healthy || 0) / (stats?.total || 1)) * 100)}%`,
      description: 'Applications saines',
      icon: TrendingUp,
      trend: '+2% cette semaine'
    }
  ];

  // Obtenir les types d'applications uniques
  const applicationTypes = useMemo(() => {
    const types = new Set(applications.map(app => app.application_type));
    return Array.from(types);
  }, [applications]);

  // Obtenir les technologies populaires
  const popularTechnologies = useMemo(() => {
    const techCount: Record<string, number> = {};
    applications.forEach(app => {
      app.technology_stack?.forEach(tech => {
        techCount[tech] = (techCount[tech] || 0) + 1;
      });
    });
    return Object.entries(techCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tech]) => tech);
  }, [applications]);

  // Colonnes du tableau
  const columns = [
    {
      key: 'name',
      label: 'Application',
      sortable: true,
      render: (value: any, app: ApplicationWithDetails) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {getApplicationTypeIcon(app.application_type)}
            <span className="font-medium">{app.name}</span>
          </div>
          {app.description && (
            <div className="text-sm text-muted-foreground line-clamp-2">
              {app.description}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'application_type',
      label: 'Type',
      sortable: true,
      render: (value: any, app: ApplicationWithDetails) => (
        <Badge className={getApplicationTypeBadge(app.application_type)}>
          {app.application_type}
        </Badge>
      )
    },
    {
      key: 'version',
      label: 'Version',
      render: (value: any, app: ApplicationWithDetails) => (
        <span className="text-sm font-mono">
          {app.version || 'N/A'}
        </span>
      )
    },
    {
      key: 'technology_stack',
      label: 'Technologies',
      render: (value: any, app: ApplicationWithDetails) => (
        <div className="flex flex-wrap gap-1">
          {app.technology_stack?.slice(0, 3).map((tech, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tech}
            </Badge>
          ))}
          {(app.technology_stack?.length || 0) > 3 && (
            <Badge variant="outline" className="text-xs">
              +{(app.technology_stack?.length || 0) - 3}
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'business_services',
      label: 'Services métiers',
      render: (value: any, app: ApplicationWithDetails) => (
        <div className="flex items-center gap-1">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{app.business_services?.length || 0}</span>
        </div>
      )
    },
    {
      key: 'links',
      label: 'Liens',
      render: (value: any, app: ApplicationWithDetails) => (
        <div className="flex gap-1">
          {app.repository_url && (
            <Button variant="ghost" size="sm" asChild>
              <a href={app.repository_url} target="_blank" rel="noopener noreferrer">
                <GitBranch className="h-4 w-4" />
              </a>
            </Button>
          )}
          {app.documentation_url && (
            <Button variant="ghost" size="sm" asChild>
              <a href={app.documentation_url} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Créée le',
      sortable: true,
      render: (value: any, app: ApplicationWithDetails) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(app.created_at), 'dd/MM/yyyy', { locale: fr })}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, app: ApplicationWithDetails) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openViewModal(app)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(app)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDeleteModal(app)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={refreshData}>Réessayer</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        description="Gestion et supervision des applications de l'équipe"
        action={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle application
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="analytics">Analytiques</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistiques */}
          <DataGrid columns={4}>
            {statsCards.map((stat) => (
              <StatsCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                description={stat.description}
                icon={stat.icon}
                trend={stat.trend}
              />
            ))}
          </DataGrid>

          {/* Applications récentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Applications récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications.slice(0, 5).map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => openViewModal(app)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {getApplicationTypeIcon(app.application_type)}
                      </div>
                      <div>
                        <h4 className="font-medium">{app.name}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {app.description || 'Aucune description'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getApplicationTypeBadge(app.application_type)}>
                        {app.application_type}
                      </Badge>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
                {applications.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune application configurée</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      Créer la première application
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          {/* Filtres */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher une application..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type d'application" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {applicationTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={technologyFilter} onValueChange={setTechnologyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Technologie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les technologies</SelectItem>
                    {popularTechnologies.map((tech) => (
                      <SelectItem key={tech} value={tech}>
                        {tech}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                  setTechnologyFilter('all');
                }}>
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tableau des applications */}
          <Card>
            <CardHeader>
              <CardTitle>
                Applications ({filteredApplications.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead key={column.key}>{column.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((app) => (
                      <TableRow key={app.id}>
                        {columns.map((column) => (
                          <TableCell key={column.key}>
                            {column.render ? 
                              column.render(app[column.key as keyof ApplicationWithDetails], app) :
                              app[column.key as keyof ApplicationWithDetails]
                            }
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Répartition par type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Répartition par type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats && Object.entries(stats.by_type).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getApplicationTypeIcon(type)}
                        <span className="font-medium">{type}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{count}</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round((count / (stats.total || 1)) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Technologies populaires */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Technologies populaires
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.by_technology.map((tech) => (
                    <div key={tech.technology} className="flex items-center justify-between">
                      <span className="font-medium">{tech.technology}</span>
                      <div className="text-right">
                        <div className="font-medium">{tech.count}</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round((tech.count / (stats.total || 1)) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de création */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une application</DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle application à votre inventaire
            </DialogDescription>
          </DialogHeader>
          <ApplicationForm
            mode="create"
            onSubmit={handleCreateApplication}
            onCancel={() => setIsCreateModalOpen(false)}
            loading={loading}
          />
        </DialogContent>
      </Dialog>

      {/* Modal d'édition */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'application</DialogTitle>
            <DialogDescription>
              Modifiez les informations de {selectedApplication?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <ApplicationForm
              mode="edit"
              initialData={selectedApplication}
              onSubmit={handleUpdateApplication}
              onCancel={() => setIsEditModalOpen(false)}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de vue détaillée */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedApplication && getApplicationTypeIcon(selectedApplication.application_type)}
              {selectedApplication?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Type</h4>
                  <Badge className={getApplicationTypeBadge(selectedApplication.application_type)}>
                    {selectedApplication.application_type}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Version</h4>
                  <span className="font-mono">{selectedApplication.version || 'N/A'}</span>
                </div>
              </div>

              {selectedApplication.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                  <p className="text-sm">{selectedApplication.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Technologies</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedApplication.technology_stack?.map((tech, index) => (
                      <Badge key={index} variant="outline">{tech}</Badge>
                    )) || <span className="text-sm text-muted-foreground">Aucune</span>}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Services métiers</h4>
                  <div className="text-sm">
                    {selectedApplication.business_services?.length || 0} service(s) lié(s)
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                {selectedApplication.repository_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedApplication.repository_url} target="_blank" rel="noopener noreferrer">
                      <GitBranch className="h-4 w-4 mr-2" />
                      Repository
                    </a>
                  </Button>
                )}
                {selectedApplication.documentation_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedApplication.documentation_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-2" />
                      Documentation
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de suppression */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'application</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'application "{selectedApplication?.name}" ? 
              Cette action est irréversible et supprimera également tous les déploiements associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteApplication}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Applications; 