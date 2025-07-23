import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Server, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Play,
  Pause,
  RotateCcw,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  Settings,
  AlertTriangle,
  ExternalLink,
  Cloud
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { useDeployments } from '@/hooks/useDeployments';
import { DeploymentForm } from './DeploymentForm';
import type { 
  ApplicationDeploymentWithDetails, 
  CreateDeploymentData,
  DeploymentFilters 
} from '@/types/application';

interface DeploymentManagerProps {
  applicationId?: string; // Si fourni, affiche seulement les déploiements de cette app
  showApplicationColumn?: boolean; // Afficher la colonne application ou non
  compact?: boolean; // Mode compact pour intégration dans d'autres vues
}

export const DeploymentManager: React.FC<DeploymentManagerProps> = ({
  applicationId,
  showApplicationColumn = true,
  compact = false
}) => {
  const {
    deployments,
    loading,
    stats,
    createDeployment,
    updateDeployment,
    deleteDeployment,
    changeDeploymentStatus,
    performHealthCheck,
    fetchDeployments,
    refreshData
  } = useDeployments(applicationId);

  // États pour les modals et filtres
  const [selectedDeployment, setSelectedDeployment] = useState<ApplicationDeploymentWithDetails | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filtrer les déploiements
  const filteredDeployments = useMemo(() => {
    return deployments.filter(deployment => {
      const matchesSearch = searchTerm === '' || 
        deployment.application?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deployment.cloud_asset?.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deployment.version?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesEnvironment = environmentFilter === 'all' || 
        deployment.environment_name === environmentFilter;
      
      const matchesStatus = statusFilter === 'all' || 
        deployment.status === statusFilter;

      return matchesSearch && matchesEnvironment && matchesStatus;
    });
  }, [deployments, searchTerm, environmentFilter, statusFilter]);

  // Gestionnaires d'événements
  const handleCreateDeployment = async (data: CreateDeploymentData) => {
    const success = await createDeployment(data);
    if (success) {
      setIsCreateModalOpen(false);
    }
    return success;
  };

  const handleUpdateDeployment = async (data: CreateDeploymentData) => {
    if (!selectedDeployment) return false;
    const success = await updateDeployment({ id: selectedDeployment.id, ...data });
    if (success) {
      setIsEditModalOpen(false);
      setSelectedDeployment(null);
    }
    return success;
  };

  const handleDeleteDeployment = async () => {
    if (!selectedDeployment) return;
    const success = await deleteDeployment(selectedDeployment.id);
    if (success) {
      setIsDeleteModalOpen(false);
      setSelectedDeployment(null);
    }
  };

  const openViewModal = (deployment: ApplicationDeploymentWithDetails) => {
    setSelectedDeployment(deployment);
    setIsViewModalOpen(true);
  };

  const openEditModal = (deployment: ApplicationDeploymentWithDetails) => {
    setSelectedDeployment(deployment);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (deployment: ApplicationDeploymentWithDetails) => {
    setSelectedDeployment(deployment);
    setIsDeleteModalOpen(true);
  };

  // Utilitaires pour l'affichage
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'maintenance': return <Settings className="h-4 w-4 text-orange-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-gray-100 text-gray-800',
      maintenance: 'bg-orange-100 text-orange-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getEnvironmentIcon = (env: string) => {
    switch (env) {
      case 'production': return <Globe className="h-4 w-4" />;
      case 'staging': return <Server className="h-4 w-4" />;
      case 'development': return <Settings className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getEnvironmentBadge = (env: string) => {
    const colors = {
      production: 'bg-green-100 text-green-800',
      staging: 'bg-yellow-100 text-yellow-800',
      development: 'bg-blue-100 text-blue-800',
      testing: 'bg-purple-100 text-purple-800',
      demo: 'bg-orange-100 text-orange-800'
    };
    return colors[env as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Actions rapides
  const handleQuickAction = async (action: string, deployment: ApplicationDeploymentWithDetails) => {
    switch (action) {
      case 'activate':
        await changeDeploymentStatus(deployment.id, 'active');
        break;
      case 'deactivate':
        await changeDeploymentStatus(deployment.id, 'inactive');
        break;
      case 'maintenance':
        await changeDeploymentStatus(deployment.id, 'maintenance');
        break;
      case 'health_check':
        await performHealthCheck(deployment.id);
        break;
      default:
        break;
    }
  };

  // Environnements uniques pour le filtre
  const availableEnvironments = useMemo(() => {
    const envs = new Set(deployments.map(d => d.environment_name));
    return Array.from(envs);
  }, [deployments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête et statistiques (si pas en mode compact) */}
      {!compact && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Déploiements</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Server className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Actifs</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active_environments}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Récents</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.recent_deployments}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Succès</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.success_rate}%</p>
                </div>
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres et actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Déploiements {!applicationId && `(${filteredDeployments.length})`}
            </CardTitle>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau déploiement
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par application, asset, version..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={environmentFilter} onValueChange={setEnvironmentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Environnement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les environnements</SelectItem>
                {availableEnvironments.map((env) => (
                  <SelectItem key={env} value={env}>{env}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="failed">Échoué</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={refreshData}>
              <Activity className="h-4 w-4" />
            </Button>
          </div>

          {/* Table des déploiements */}
          <Table>
            <TableHeader>
              <TableRow>
                {showApplicationColumn && <TableHead>Application</TableHead>}
                <TableHead>Environnement</TableHead>
                <TableHead>Cloud Asset</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Déployé le</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeployments.map((deployment) => (
                <TableRow key={deployment.id}>
                  {showApplicationColumn && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {deployment.application?.name || 'Application inconnue'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {deployment.application?.application_type}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  )}
                  
                  <TableCell>
                    <Badge className={`flex items-center gap-1 ${getEnvironmentBadge(deployment.environment_name)}`}>
                      {getEnvironmentIcon(deployment.environment_name)}
                      {deployment.environment_name}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Cloud className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">
                          {deployment.cloud_asset?.asset_name || 'Asset inconnu'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {deployment.cloud_asset?.region}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-sm">
                      {deployment.version || 'N/A'}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge className={`flex items-center gap-1 ${getStatusBadge(deployment.status)}`}>
                      {getStatusIcon(deployment.status)}
                      {deployment.status}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <span className="text-sm">{deployment.deployment_type}</span>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(deployment.deployment_date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      par {deployment.deployed_by_profile?.first_name || 'Inconnu'}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewModal(deployment)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => openEditModal(deployment)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          {deployment.status !== 'active' && (
                            <DropdownMenuItem onClick={() => handleQuickAction('activate', deployment)}>
                              <Play className="h-4 w-4 mr-2" />
                              Activer
                            </DropdownMenuItem>
                          )}
                          
                          {deployment.status === 'active' && (
                            <DropdownMenuItem onClick={() => handleQuickAction('deactivate', deployment)}>
                              <Pause className="h-4 w-4 mr-2" />
                              Désactiver
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem onClick={() => handleQuickAction('maintenance', deployment)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Maintenance
                          </DropdownMenuItem>
                          
                          {deployment.health_check_url && (
                            <DropdownMenuItem onClick={() => handleQuickAction('health_check', deployment)}>
                              <Activity className="h-4 w-4 mr-2" />
                              Health Check
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onClick={() => openDeleteModal(deployment)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredDeployments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun déploiement trouvé</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsCreateModalOpen(true)}
              >
                Créer le premier déploiement
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de création */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un déploiement</DialogTitle>
            <DialogDescription>
              Déployer une application sur un actif cloud
            </DialogDescription>
          </DialogHeader>
          <DeploymentForm
            mode="create"
            applicationId={applicationId}
            onSubmit={handleCreateDeployment}
            onCancel={() => setIsCreateModalOpen(false)}
            loading={loading}
          />
        </DialogContent>
      </Dialog>

      {/* Modal d'édition */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le déploiement</DialogTitle>
            <DialogDescription>
              Mettre à jour la configuration du déploiement
            </DialogDescription>
          </DialogHeader>
          {selectedDeployment && (
            <DeploymentForm
              mode="edit"
              initialData={selectedDeployment}
              onSubmit={handleUpdateDeployment}
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
              <Server className="h-5 w-5" />
              Détails du déploiement
            </DialogTitle>
          </DialogHeader>
          {selectedDeployment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Application</h4>
                  <p className="font-medium">{selectedDeployment.application?.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Environnement</h4>
                  <Badge className={getEnvironmentBadge(selectedDeployment.environment_name)}>
                    {selectedDeployment.environment_name}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Statut</h4>
                  <Badge className={getStatusBadge(selectedDeployment.status)}>
                    {getStatusIcon(selectedDeployment.status)}
                    <span className="ml-1">{selectedDeployment.status}</span>
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Version</h4>
                  <p className="font-mono">{selectedDeployment.version || 'N/A'}</p>
                </div>
              </div>

              {selectedDeployment.health_check_url && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Health Check</h4>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedDeployment.health_check_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Tester
                      </a>
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {selectedDeployment.health_check_url}
                    </span>
                  </div>
                </div>
              )}

              {selectedDeployment.configuration && Object.keys(selectedDeployment.configuration).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Configuration</h4>
                  <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(selectedDeployment.configuration, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de suppression */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le déploiement</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce déploiement ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDeployment}
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