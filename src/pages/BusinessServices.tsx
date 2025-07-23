import { useState, useEffect, useMemo } from 'react';
import { useBusinessServices } from '@/hooks/useBusinessServices';
import { PageHeader, DataGrid, StatsCard } from '@/components/common';
import { BusinessServiceForm } from '@/components/forms/BusinessServiceForm';
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
  Layers, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Users,
  Server,
  Shield,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Package,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { 
  BusinessServiceWithDetails, 
  BusinessServiceFormData, 
  BusinessServiceFilters 
} from '@/types/businessService';

const BusinessServices = () => {
  const {
    services,
    loading,
    error,
    stats,
    createService,
    updateService,
    deleteService,
    fetchServices,
    refreshData
  } = useBusinessServices();

  // États pour les modals et filtres
  const [selectedService, setSelectedService] = useState<BusinessServiceWithDetails | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [criticalityFilter, setCriticalityFilter] = useState<string>('all');
  const [serviceLevelFilter, setServiceLevelFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Filtrer les services
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = searchTerm === '' || 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCriticality = criticalityFilter === 'all' || 
        service.criticality === criticalityFilter;
      
      const matchesServiceLevel = serviceLevelFilter === 'all' || 
        service.service_level === serviceLevelFilter;

      return matchesSearch && matchesCriticality && matchesServiceLevel;
    });
  }, [services, searchTerm, criticalityFilter, serviceLevelFilter]);

  // Gestionnaires d'événements
  const handleCreateService = async (data: BusinessServiceFormData) => {
    const success = await createService(data);
    if (success) {
      setIsCreateModalOpen(false);
    }
    return success;
  };

  const handleUpdateService = async (data: BusinessServiceFormData) => {
    if (!selectedService) return false;
    const success = await updateService({ id: selectedService.id, ...data });
    if (success) {
      setIsEditModalOpen(false);
      setSelectedService(null);
    }
    return success;
  };

  const handleDeleteService = async () => {
    if (!selectedService) return;
    const success = await deleteService(selectedService.id);
    if (success) {
      setIsDeleteModalOpen(false);
      setSelectedService(null);
    }
  };

  const openViewModal = (service: BusinessServiceWithDetails) => {
    setSelectedService(service);
    setIsViewModalOpen(true);
  };

  const openEditModal = (service: BusinessServiceWithDetails) => {
    setSelectedService(service);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (service: BusinessServiceWithDetails) => {
    setSelectedService(service);
    setIsDeleteModalOpen(true);
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

  const getServiceLevelBadge = (level: string) => {
    const colors = {
      bronze: 'bg-amber-100 text-amber-800',
      silver: 'bg-gray-100 text-gray-800',
      gold: 'bg-yellow-100 text-yellow-800',
      platinum: 'bg-purple-100 text-purple-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Données pour les statistiques
  const statsCards = [
    {
      title: 'Services métiers',
      value: stats?.total.toString() || '0',
      description: 'Total des services',
      icon: Layers,
      trend: '+2 ce mois'
    },
    {
      title: 'Services critiques',
      value: stats?.by_criticality.critical.toString() || '0',
      description: 'Haute priorité',
      icon: AlertTriangle,
      trend: 'Stable'
    },
    {
      title: 'Avec applications',
      value: stats?.applications_coverage.with_apps.toString() || '0',
      description: 'Services liés',
      icon: Package,
      trend: `${Math.round(((stats?.applications_coverage.with_apps || 0) / (stats?.total || 1)) * 100)}%`
    },
    {
      title: 'Conformité SLA',
      value: `${stats?.sla_compliance.average || 95}%`,
      description: 'Niveau moyen',
      icon: TrendingUp,
      trend: '+2.5% ce mois'
    }
  ];

  // Colonnes du tableau
  const columns = [
    {
      key: 'name',
      label: 'Service',
      sortable: true,
      render: (value: any, service: BusinessServiceWithDetails) => (
        <div className="space-y-1">
          <div className="font-medium">{service.name}</div>
          {service.description && (
            <div className="text-sm text-muted-foreground line-clamp-2">
              {service.description}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'criticality',
      label: 'Criticité',
      sortable: true,
      render: (value: any, service: BusinessServiceWithDetails) => (
        <Badge className={getCriticalityColor(service.criticality)}>
          {getCriticalityLabel(service.criticality)}
        </Badge>
      )
    },
    {
      key: 'service_level',
      label: 'Niveau',
      sortable: true,
      render: (value: any, service: BusinessServiceWithDetails) => (
        <Badge className={getServiceLevelBadge(service.service_level || '')}>
          {service.service_level?.toUpperCase()}
        </Badge>
      )
    },
    {
      key: 'applications',
      label: 'Applications',
      render: (value: any, service: BusinessServiceWithDetails) => (
        <div className="flex items-center gap-1">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{service.applications?.length || 0}</span>
        </div>
      )
    },
    {
      key: 'owners',
      label: 'Propriétaires',
      render: (value: any, service: BusinessServiceWithDetails) => (
        <div className="space-y-1">
          {service.business_owner_profile && (
            <div className="flex items-center gap-1 text-xs">
              <Users className="h-3 w-3" />
              <span>
                {service.business_owner_profile.first_name} {service.business_owner_profile.last_name}
              </span>
            </div>
          )}
          {service.technical_owner_profile && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Server className="h-3 w-3" />
              <span>
                {service.technical_owner_profile.first_name} {service.technical_owner_profile.last_name}
              </span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Créé le',
      sortable: true,
      render: (value: any, service: BusinessServiceWithDetails) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(service.created_at), 'dd/MM/yyyy', { locale: fr })}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, service: BusinessServiceWithDetails) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openViewModal(service)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(service)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDeleteModal(service)}
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
        title="Services métiers"
        description="Gestion et supervision des services métiers de l'organisation"
        action={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau service
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
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

          {/* Services récents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Services récents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.slice(0, 5).map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => openViewModal(service)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Layers className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{service.name}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {service.description || 'Aucune description'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getCriticalityColor(service.criticality)}>
                        {getCriticalityLabel(service.criticality)}
                      </Badge>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
                {services.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun service métier configuré</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      Créer le premier service
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
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
                    placeholder="Rechercher un service..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={criticalityFilter} onValueChange={setCriticalityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Criticité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les criticités</SelectItem>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={serviceLevelFilter} onValueChange={setServiceLevelFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Niveau de service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les niveaux</SelectItem>
                    <SelectItem value="bronze">Bronze</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  setCriticalityFilter('all');
                  setServiceLevelFilter('all');
                }}>
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tableau des services */}
          <Card>
            <CardHeader>
              <CardTitle>
                Services métiers ({filteredServices.length})
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
                    {filteredServices.map((service) => (
                      <TableRow key={service.id}>
                        {columns.map((column) => (
                          <TableCell key={column.key}>
                            {column.render ? 
                              column.render(service[column.key as keyof BusinessServiceWithDetails], service) :
                              service[column.key as keyof BusinessServiceWithDetails]
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
            {/* Répartition par criticité */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Répartition par criticité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats && Object.entries(stats.by_criticality).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getCriticalityColor(level)}>
                          {getCriticalityLabel(level)}
                        </Badge>
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

            {/* Couverture des applications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Couverture des applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Avec applications</span>
                    <div className="text-right">
                      <div className="font-medium text-green-600">
                        {stats?.applications_coverage.with_apps || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(((stats?.applications_coverage.with_apps || 0) / (stats?.total || 1)) * 100)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sans applications</span>
                    <div className="text-right">
                      <div className="font-medium text-orange-600">
                        {stats?.applications_coverage.without_apps || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(((stats?.applications_coverage.without_apps || 0) / (stats?.total || 1)) * 100)}%
                      </div>
                    </div>
                  </div>
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
            <DialogTitle>Créer un service métier</DialogTitle>
            <DialogDescription>
              Définissez un nouveau service métier pour votre organisation
            </DialogDescription>
          </DialogHeader>
          <BusinessServiceForm
            mode="create"
            onSubmit={handleCreateService}
            onCancel={() => setIsCreateModalOpen(false)}
            loading={loading}
          />
        </DialogContent>
      </Dialog>

      {/* Modal d'édition */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le service métier</DialogTitle>
            <DialogDescription>
              Modifiez les informations du service {selectedService?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedService && (
            <BusinessServiceForm
              mode="edit"
              initialData={selectedService}
              onSubmit={handleUpdateService}
              onCancel={() => setIsEditModalOpen(false)}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de vue détaillée */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              {selectedService?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Criticité</h4>
                  <Badge className={getCriticalityColor(selectedService.criticality)}>
                    {getCriticalityLabel(selectedService.criticality)}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Niveau de service</h4>
                  <Badge className={getServiceLevelBadge(selectedService.service_level || '')}>
                    {selectedService.service_level?.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {selectedService.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                  <p className="text-sm">{selectedService.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Stack technique</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedService.technical_stack?.map((tech, index) => (
                      <Badge key={index} variant="outline">{tech}</Badge>
                    )) || <span className="text-sm text-muted-foreground">Aucune</span>}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Stack applicative</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedService.application_stack?.map((app, index) => (
                      <Badge key={index} variant="outline">{app}</Badge>
                    )) || <span className="text-sm text-muted-foreground">Aucune</span>}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Applications liées</h4>
                <div className="text-sm">
                  {selectedService.applications?.length || 0} application(s) liée(s)
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de suppression */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le service métier</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le service "{selectedService?.name}" ? 
              Cette action est irréversible et peut affecter les applications liées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteService}
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

export default BusinessServices; 