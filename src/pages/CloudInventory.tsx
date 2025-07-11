import { useState, useEffect } from "react";
import { useSession } from "@/hooks/useSession";
import { cloudService, CloudAssetWithProvider } from "@/services/cloudService";
import { supabase } from "@/integrations/supabase/client";
import { 
  PageHeader, 
  DataGrid, 
  SearchAndFilters,
  EmptyState 
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Cloud, 
  Server, 
  Database, 
  HardDrive, 
  Network, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Tag,
  Activity,
  Shield,
  Zap,
  RefreshCw,
  Eye,
  Settings,
  Trash2,
  Copy,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

interface CloudAsset {
  id: string;
  team_id: string;
  cloud_provider_id: string;
  asset_type: 'instance' | 'database' | 'storage' | 'network' | 'load_balancer' | 'container';
  name: string;
  identifier: string;
  region: string;
  status: 'running' | 'stopped' | 'terminated' | 'pending' | 'error';
  size?: string;
  cost_per_hour?: number;
  tags: Record<string, string>;
  metadata: any;
  created_at: string;
  updated_at: string;
  last_inventory_at: string;
}

interface CloudProvider {
  id: string;
  name: string;
  display_name: string;
  icon_url?: string;
}

const CloudInventory = () => {
  const { sessionContext, hasValidContext } = useSession();
  const [assets, setAssets] = useState<CloudAssetWithProvider[]>([]);
  const [providers, setProviders] = useState<CloudProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedAsset, setSelectedAsset] = useState<CloudAssetWithProvider | null>(null);

  // État pour le modal de détails
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    if (hasValidContext) {
      fetchCloudData();
    } else {
      setAssets([]);
      setProviders([]);
      setLoading(false);
    }
  }, [hasValidContext]);

  const fetchCloudData = async () => {
    if (!hasValidContext) {
      toast.error('Session non valide - veuillez vous reconnecter');
      return;
    }

    try {
      setLoading(true);
      
      const [assetsData, providersData] = await Promise.all([
        cloudService.getAssets(),
        cloudService.getProviders()
      ]);

      setAssets(assetsData);
      setProviders(providersData);
    } catch (error) {
      console.error('Error fetching cloud data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const refreshInventory = async () => {
    if (!hasValidContext) {
      toast.error('Session non valide - impossible de rafraîchir l\'inventaire');
      return;
    }

    try {
      setLoading(true);
      
      const executionIds = await cloudService.refreshInventory();
      
      if (executionIds.length > 0) {
        toast.success(`Inventaire mis à jour - ${executionIds.length} tâche(s) démarrée(s)`);
        // Attendre un peu puis recharger les données
        setTimeout(() => {
          fetchCloudData();
        }, 2000);
      } else {
        toast.warning('Aucune tâche d\'inventaire n\'a pu être démarrée');
      }
    } catch (error) {
      console.error('Error refreshing inventory:', error);
      toast.error('Erreur lors de la mise à jour de l\'inventaire');
    } finally {
      setLoading(false);
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'instance': return Server;
      case 'database': return Database;
      case 'storage': return HardDrive;
      case 'network': return Network;
      case 'load_balancer': return Activity;
      case 'container': return Cloud;
      default: return Cloud;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "default";
      case "stopped": return "secondary";
      case "pending": return "outline";
      case "terminated":
      case "error": return "destructive";
      default: return "outline";
    }
  };

  const getProviderIcon = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    return provider?.icon_url || Cloud;
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = (asset.asset_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (asset.asset_id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || asset.status === statusFilter;
    const matchesType = typeFilter === "all" || asset.asset_type === typeFilter;
    const matchesProvider = providerFilter === "all" || asset.cloud_provider_id === providerFilter;

    return matchesSearch && matchesStatus && matchesType && matchesProvider;
  });

  const stats = [
    {
      title: "Assets totaux",
      value: assets.length.toString(),
      icon: Cloud,
      color: "text-blue-500"
    },
    {
      title: "En cours d'exécution",
      value: assets.filter(a => a.status === 'running').length.toString(),
      icon: Activity,
      color: "text-green-500"
    },
    {
      title: "Coût estimé/mois",
      value: "N/A",
      icon: Zap,
      color: "text-orange-500"
    },
    {
      title: "Dernière mise à jour",
      value: assets.length > 0 ? new Date(Math.max(...assets.map(a => new Date(a.last_scan || a.discovered_at || Date.now()).getTime()))).toLocaleDateString() : "Jamais",
      icon: Calendar,
      color: "text-purple-500"
    }
  ];

  const assetTypes = [
    { value: "all", label: "Tous les types" },
    { value: "instance", label: "Instances" },
    { value: "database", label: "Bases de données" },
    { value: "storage", label: "Stockage" },
    { value: "network", label: "Réseau" },
    { value: "load_balancer", label: "Load Balancers" },
    { value: "container", label: "Conteneurs" }
  ];

  if (loading && assets.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Inventaire Cloud"
          description="Gestion et surveillance des ressources cloud"
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventaire Cloud"
        description="Gestion et surveillance des ressources cloud"
        action={{
          label: "Actualiser",
          icon: RefreshCw,
          onClick: refreshInventory
        }}
      />

      {/* Statistiques */}
      <DataGrid columns={4}>
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </DataGrid>

      {/* Filtres et vue */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
              <TabsList>
                <TabsTrigger value="table">Tableau</TabsTrigger>
                <TabsTrigger value="grid">Grille</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un asset..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {assetTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="running">En cours</SelectItem>
                  <SelectItem value="stopped">Arrêté</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="terminated">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAssets.length === 0 ? (
            <EmptyState
              icon={Cloud}
              title="Aucun asset trouvé"
              description="Aucune ressource cloud ne correspond à vos critères"
            />
          ) : viewMode === "table" ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Région</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Coût/h</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset) => {
                    const AssetIcon = getAssetIcon(asset.asset_type);
                    const provider = providers.find(p => p.id === asset.cloud_provider_id);
                    
                    return (
                      <TableRow key={asset.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <AssetIcon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{asset.asset_name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground font-mono">
                                {asset.asset_id}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {asset.asset_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <img 
                              src={provider?.icon_url} 
                              alt={provider?.name}
                              className="h-4 w-4"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <span className="text-sm">{provider?.display_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{asset.region}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(asset.status)}>
                            {asset.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">N/A</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(asset.tags || {}).slice(0, 2).map(([key, value]) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {key}: {value}
                              </Badge>
                            ))}
                            {Object.keys(asset.tags || {}).length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{Object.keys(asset.tags || {}).length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAsset(asset);
                                setIsDetailsModalOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssets.map((asset) => {
                const AssetIcon = getAssetIcon(asset.asset_type);
                const provider = providers.find(p => p.id === asset.cloud_provider_id);
                
                return (
                  <Card key={asset.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <AssetIcon className="h-6 w-6 text-muted-foreground" />
                          <div>
                            <CardTitle className="text-lg">{asset.asset_name || 'Unknown'}</CardTitle>
                            <p className="text-sm text-muted-foreground font-mono">
                              {asset.asset_id}
                            </p>
                          </div>
                        </div>
                        <Badge variant={getStatusColor(asset.status)}>
                          {asset.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Provider</p>
                          <p className="font-medium">{provider?.display_name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Région</p>
                          <p className="font-medium">{asset.region}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <Badge variant="outline" className="text-xs">
                            {asset.asset_type}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Coût/h</p>
                          <p className="font-medium">N/A</p>
                        </div>
                      </div>
                      
                      {Object.keys(asset.tags || {}).length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Tags</p>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(asset.tags || {}).slice(0, 3).map(([key, value]) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {key}: {value}
                              </Badge>
                            ))}
                            {Object.keys(asset.tags || {}).length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{Object.keys(asset.tags || {}).length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-end space-x-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAsset(asset);
                            setIsDetailsModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Détails
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-1" />
                          Config
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de détails */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Détails de l'asset</DialogTitle>
            <DialogDescription>
              Informations détaillées sur la ressource cloud
            </DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom</Label>
                  <p className="text-sm font-medium">{selectedAsset.asset_name || 'Unknown'}</p>
                </div>
                <div>
                  <Label>Identifiant</Label>
                  <p className="text-sm font-mono">{selectedAsset.asset_id}</p>
                </div>
                <div>
                  <Label>Type</Label>
                  <Badge variant="outline">{selectedAsset.asset_type}</Badge>
                </div>
                <div>
                  <Label>Statut</Label>
                  <Badge variant={getStatusColor(selectedAsset.status)}>
                    {selectedAsset.status}
                  </Badge>
                </div>
                <div>
                  <Label>Région</Label>
                  <p className="text-sm">{selectedAsset.region}</p>
                </div>
                <div>
                  <Label>Coût par heure</Label>
                  <p className="text-sm">N/A</p>
                </div>
              </div>
              
              {Object.keys(selectedAsset.tags || {}).length > 0 && (
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(selectedAsset.tags || {}).map(([key, value]) => (
                      <Badge key={key} variant="outline">
                        {key}: {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <Label>Métadonnées</Label>
                <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                  {JSON.stringify(selectedAsset.metadata, null, 2)}
                </pre>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
                  Fermer
                </Button>
                <Button>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ouvrir dans la console
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CloudInventory; 