import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCloudAssetManagement } from '@/hooks/useCloudAssetManagement';
import { 
  PageHeader, 
  DataGrid, 
  SearchAndFilters,
  EmptyState,
  StatsCard
} from '@/components/common';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Server, 
  Package, 
  Activity, 
  Shield, 
  AlertTriangle,
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Settings,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  HardDrive,
  Network,
  Cpu
} from 'lucide-react';
import { toast } from 'sonner';
import { CloudAssetConfigurationForm } from '@/components/cloud/CloudAssetConfigurationForm';
import { CloudInstalledPackageForm } from '@/components/cloud/CloudInstalledPackageForm';
import { CloudRunningProcessForm } from '@/components/cloud/CloudRunningProcessForm';
import { CloudPatchStatusForm } from '@/components/cloud/CloudPatchStatusForm';
import { SecurityVulnerabilityForm } from '@/components/cloud/SecurityVulnerabilityForm';
import {
  CloudAssetConfiguration,
  CloudInstalledPackage,
  CloudRunningProcess,
  CloudPatchStatus,
  SecurityVulnerability,
  CreateCloudAssetConfigurationData,
  CreateCloudInstalledPackageData,
  CreateCloudRunningProcessData,
  CreateCloudPatchStatusData,
  CreateSecurityVulnerabilityData,
  UpdateCloudAssetConfigurationData,
  UpdateCloudInstalledPackageData,
  UpdateCloudRunningProcessData,
  UpdateCloudPatchStatusData,
  UpdateSecurityVulnerabilityData
} from '@/types/cloudAsset';

const CloudAssetManagement = () => {
  const { userProfile } = useAuth();
  const hasValidContext = userProfile?.is_msp_admin || userProfile?.default_team_id;
  
  // États pour les modals
  const [activeTab, setActiveTab] = useState('configurations');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('create');
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Hook pour la gestion des données
  const {
    configurations,
    packages,
    processes,
    patches,
    vulnerabilities,
    cloudStats,
    securityStats,
    loading,
    loadingStats,
    totalCount,
    currentPage,
    pageSize,
    hasValidContext: hookHasValidContext,
    loadConfigurations,
    loadPackages,
    loadProcesses,
    loadPatches,
    loadVulnerabilities,
    loadStats,
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,
    createPackage,
    updatePackage,
    deletePackage,
    createProcess,
    updateProcess,
    deleteProcess,
    createPatch,
    updatePatch,
    deletePatch,
    createVulnerability,
    updateVulnerability,
    deleteVulnerability,
    refreshData,
    setPage,
    setPageSize
  } = useCloudAssetManagement();

  useEffect(() => {
    if (hasValidContext) {
      refreshData();
    }
  }, [hasValidContext, refreshData]);

  // Fonctions pour ouvrir les modals
  const openCreateModal = (type: string) => {
    setModalType('create');
    setSelectedItem(null);
    setActiveTab(type);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (item: any, type: string) => {
    setModalType('edit');
    setSelectedItem(item);
    setActiveTab(type);
    setIsEditModalOpen(true);
  };

  const openViewModal = (item: any, type: string) => {
    setModalType('view');
    setSelectedItem(item);
    setActiveTab(type);
    setIsViewModalOpen(true);
  };

  // Fonctions de soumission
  const handleCreate = async (data: any) => {
    try {
      switch (activeTab) {
        case 'configurations':
          await createConfiguration(data as CreateCloudAssetConfigurationData);
          break;
        case 'packages':
          await createPackage(data as CreateCloudInstalledPackageData);
          break;
        case 'processes':
          await createProcess(data as CreateCloudRunningProcessData);
          break;
        case 'patches':
          await createPatch(data as CreateCloudPatchStatusData);
          break;
        case 'vulnerabilities':
          await createVulnerability(data as CreateSecurityVulnerabilityData);
          break;
      }
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  const handleUpdate = async (data: any) => {
    try {
      switch (activeTab) {
        case 'configurations':
          await updateConfiguration(selectedItem.id, data as UpdateCloudAssetConfigurationData);
          break;
        case 'packages':
          await updatePackage(selectedItem.id, data as UpdateCloudInstalledPackageData);
          break;
        case 'processes':
          await updateProcess(selectedItem.id, data as UpdateCloudRunningProcessData);
          break;
        case 'patches':
          await updatePatch(selectedItem.id, data as UpdateCloudPatchStatusData);
          break;
        case 'vulnerabilities':
          await updateVulnerability(selectedItem.cve_id, data as UpdateSecurityVulnerabilityData);
          break;
      }
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDelete = async (item: any, type: string) => {
    try {
      switch (type) {
        case 'configurations':
          await deleteConfiguration(item.id);
          break;
        case 'packages':
          await deletePackage(item.id);
          break;
        case 'processes':
          await deleteProcess(item.id);
          break;
        case 'patches':
          await deletePatch(item.id);
          break;
        case 'vulnerabilities':
          await deleteVulnerability(item.cve_id);
          break;
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  // Fonctions de filtrage
  const getFilteredData = () => {
    let data: any[] = [];
    switch (activeTab) {
      case 'configurations':
        data = configurations;
        break;
      case 'packages':
        data = packages;
        break;
      case 'processes':
        data = processes;
        break;
      case 'patches':
        data = patches;
        break;
      case 'vulnerabilities':
        data = vulnerabilities;
        break;
    }

    return data.filter(item => {
      const matchesSearch = searchTerm === '' || 
        Object.values(item).some(value => 
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      return matchesSearch;
    });
  };

  // Fonctions utilitaires
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
      case 'running':
      case 'active': return 'default';
      case 'pending': return 'secondary';
      case 'not_available':
      case 'stopped':
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'default';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Statistiques
  const stats = [
    {
      title: "Configurations",
      value: configurations.length.toString(),
      description: "Actifs configurés",
      icon: Server,
      trend: "+2 ce mois",
      trendColor: "blue" as const
    },
    {
      title: "Packages",
      value: packages.length.toString(),
      description: "Packages installés",
      icon: Package,
      trend: "+15 ce mois",
      trendColor: "green" as const
    },
    {
      title: "Processus",
      value: processes.length.toString(),
      description: "Processus actifs",
      icon: Activity,
      trend: "+8 ce mois",
      trendColor: "blue" as const
    },
    {
      title: "Patches",
      value: patches.length.toString(),
      description: "Patches gérés",
      icon: Shield,
      trend: "+5 ce mois",
      trendColor: "green" as const
    }
  ];

  if (!hasValidContext) {
    return (
      <EmptyState
        icon={Server}
        title="Accès non autorisé"
        description="Vous devez être administrateur MSP pour accéder à cette page"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Actifs Cloud"
        description="Inventaire, configurations, packages, processus et sécurité des actifs cloud"
        action={{
          label: "Rafraîchir",
          icon: RefreshCw,
          onClick: refreshData
        }}
      />

      {/* Statistiques */}
      <DataGrid columns={4}>
        {stats.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            trend={stat.trend}
            trendColor={stat.trendColor}
          />
        ))}
      </DataGrid>

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="configurations" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Configurations
          </TabsTrigger>
          <TabsTrigger value="packages" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Packages
          </TabsTrigger>
          <TabsTrigger value="processes" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Processus
          </TabsTrigger>
          <TabsTrigger value="patches" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Patches
          </TabsTrigger>
          <TabsTrigger value="vulnerabilities" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Vulnérabilités
          </TabsTrigger>
        </TabsList>

        {/* Contenu des onglets */}
        {['configurations', 'packages', 'processes', 'patches', 'vulnerabilities'].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {/* Barre d'outils */}
            <div className="flex justify-between items-center">
              <SearchAndFilters
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                placeholder={`Rechercher dans les ${tab}...`}
              />
              <Button
                onClick={() => openCreateModal(tab)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </div>

            {/* Tableau de données */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="capitalize">{tab}</span>
                  <Badge variant="outline">{getFilteredData().length} éléments</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Chargement...</span>
                  </div>
                ) : getFilteredData().length === 0 ? (
                  <EmptyState
                    icon={tab === 'configurations' ? Server : 
                          tab === 'packages' ? Package :
                          tab === 'processes' ? Activity :
                          tab === 'patches' ? Shield : AlertTriangle}
                    title={`Aucun ${tab.slice(0, -1)} trouvé`}
                    description={`Aucun ${tab.slice(0, -1)} ne correspond à vos critères de recherche`}
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {tab === 'configurations' && (
                          <>
                            <TableHead>Actif</TableHead>
                            <TableHead>OS</TableHead>
                            <TableHead>CPU</TableHead>
                            <TableHead>RAM</TableHead>
                            <TableHead>IP</TableHead>
                            <TableHead>Collecté le</TableHead>
                            <TableHead>Actions</TableHead>
                          </>
                        )}
                        {tab === 'packages' && (
                          <>
                            <TableHead>Actif</TableHead>
                            <TableHead>Package</TableHead>
                            <TableHead>Version</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Collecté le</TableHead>
                            <TableHead>Actions</TableHead>
                          </>
                        )}
                        {tab === 'processes' && (
                          <>
                            <TableHead>Actif</TableHead>
                            <TableHead>Processus</TableHead>
                            <TableHead>PID</TableHead>
                            <TableHead>Chemin</TableHead>
                            <TableHead>Collecté le</TableHead>
                            <TableHead>Actions</TableHead>
                          </>
                        )}
                        {tab === 'patches' && (
                          <>
                            <TableHead>Actif</TableHead>
                            <TableHead>Patch</TableHead>
                            <TableHead>CVE</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Collecté le</TableHead>
                            <TableHead>Actions</TableHead>
                          </>
                        )}
                        {tab === 'vulnerabilities' && (
                          <>
                            <TableHead>CVE ID</TableHead>
                            <TableHead>Sévérité</TableHead>
                            <TableHead>Score CVSS</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Publié le</TableHead>
                            <TableHead>Actions</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredData().map((item) => (
                        <TableRow key={item.id || item.cve_id}>
                          {tab === 'configurations' && (
                            <>
                              <TableCell className="font-mono text-sm">{item.asset_id}</TableCell>
                              <TableCell>{item.os || '-'}</TableCell>
                              <TableCell>{item.cpu || '-'}</TableCell>
                              <TableCell>{item.ram || '-'}</TableCell>
                              <TableCell>{item.ip || '-'}</TableCell>
                              <TableCell>{formatDate(item.collected_at)}</TableCell>
                            </>
                          )}
                          {tab === 'packages' && (
                            <>
                              <TableCell className="font-mono text-sm">{item.asset_id}</TableCell>
                              <TableCell className="font-medium">{item.package_name}</TableCell>
                              <TableCell>{item.version || '-'}</TableCell>
                              <TableCell>{item.source || '-'}</TableCell>
                              <TableCell>{formatDate(item.collected_at)}</TableCell>
                            </>
                          )}
                          {tab === 'processes' && (
                            <>
                              <TableCell className="font-mono text-sm">{item.asset_id}</TableCell>
                              <TableCell className="font-medium">{item.process_name}</TableCell>
                              <TableCell>{item.pid || '-'}</TableCell>
                              <TableCell className="font-mono text-sm">{item.path || '-'}</TableCell>
                              <TableCell>{formatDate(item.collected_at)}</TableCell>
                            </>
                          )}
                          {tab === 'patches' && (
                            <>
                              <TableCell className="font-mono text-sm">{item.asset_id}</TableCell>
                              <TableCell>{item.patch_name || '-'}</TableCell>
                              <TableCell className="font-mono text-sm">{item.cve_id || '-'}</TableCell>
                              <TableCell>
                                <Badge variant={getStatusColor(item.status)}>
                                  {item.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDate(item.collected_at)}</TableCell>
                            </>
                          )}
                          {tab === 'vulnerabilities' && (
                            <>
                              <TableCell className="font-mono font-medium">{item.cve_id}</TableCell>
                              <TableCell>
                                <Badge variant={getSeverityColor(item.severity)}>
                                  {item.severity || 'Inconnu'}
                                </Badge>
                              </TableCell>
                              <TableCell>{item.cvss_score || '-'}</TableCell>
                              <TableCell className="max-w-xs truncate">
                                {item.description || '-'}
                              </TableCell>
                              <TableCell>{item.published_at ? formatDate(item.published_at) : '-'}</TableCell>
                            </>
                          )}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openViewModal(item, tab)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(item, tab)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item, tab)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Modals */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {activeTab === 'configurations' && 'Nouvelle configuration'}
              {activeTab === 'packages' && 'Nouveau package'}
              {activeTab === 'processes' && 'Nouveau processus'}
              {activeTab === 'patches' && 'Nouveau patch'}
              {activeTab === 'vulnerabilities' && 'Nouvelle vulnérabilité'}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations pour créer un nouvel élément
            </DialogDescription>
          </DialogHeader>
          
          {activeTab === 'configurations' && (
            <CloudAssetConfigurationForm
              onSubmit={handleCreate}
              onCancel={() => setIsCreateModalOpen(false)}
              loading={loading}
            />
          )}
          {activeTab === 'packages' && (
            <CloudInstalledPackageForm
              onSubmit={handleCreate}
              onCancel={() => setIsCreateModalOpen(false)}
              loading={loading}
            />
          )}
          {activeTab === 'processes' && (
            <CloudRunningProcessForm
              onSubmit={handleCreate}
              onCancel={() => setIsCreateModalOpen(false)}
              loading={loading}
            />
          )}
          {activeTab === 'patches' && (
            <CloudPatchStatusForm
              onSubmit={handleCreate}
              onCancel={() => setIsCreateModalOpen(false)}
              loading={loading}
            />
          )}
          {activeTab === 'vulnerabilities' && (
            <SecurityVulnerabilityForm
              onSubmit={handleCreate}
              onCancel={() => setIsCreateModalOpen(false)}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {activeTab === 'configurations' && 'Modifier la configuration'}
              {activeTab === 'packages' && 'Modifier le package'}
              {activeTab === 'processes' && 'Modifier le processus'}
              {activeTab === 'patches' && 'Modifier le patch'}
              {activeTab === 'vulnerabilities' && 'Modifier la vulnérabilité'}
            </DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'élément sélectionné
            </DialogDescription>
          </DialogHeader>
          
          {activeTab === 'configurations' && selectedItem && (
            <CloudAssetConfigurationForm
              configuration={selectedItem}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditModalOpen(false)}
              loading={loading}
            />
          )}
          {activeTab === 'packages' && selectedItem && (
            <CloudInstalledPackageForm
              package={selectedItem}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditModalOpen(false)}
              loading={loading}
            />
          )}
          {activeTab === 'processes' && selectedItem && (
            <CloudRunningProcessForm
              process={selectedItem}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditModalOpen(false)}
              loading={loading}
            />
          )}
          {activeTab === 'patches' && selectedItem && (
            <CloudPatchStatusForm
              patch={selectedItem}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditModalOpen(false)}
              loading={loading}
            />
          )}
          {activeTab === 'vulnerabilities' && selectedItem && (
            <SecurityVulnerabilityForm
              vulnerability={selectedItem}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditModalOpen(false)}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {activeTab === 'configurations' && 'Détails de la configuration'}
              {activeTab === 'packages' && 'Détails du package'}
              {activeTab === 'processes' && 'Détails du processus'}
              {activeTab === 'patches' && 'Détails du patch'}
              {activeTab === 'vulnerabilities' && 'Détails de la vulnérabilité'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedItem && (
              <Card>
                <CardContent className="pt-6">
                  <pre className="text-sm bg-gray-50 p-4 rounded-lg overflow-auto">
                    {JSON.stringify(selectedItem, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CloudAssetManagement; 