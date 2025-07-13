import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  PageHeader, 
  DataGrid,
  EmptyState
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Cloud, 
  Plus, 
  Search, 
  Settings,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Globe,
  Zap
} from "lucide-react";
import { toast } from "sonner";

interface CloudProvider {
  id: string;
  name: string;
  display_name: string;
  api_endpoint?: string;
  is_active: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

interface CloudProviderFormData {
  name: string;
  display_name: string;
  api_endpoint: string;
  is_active: boolean;
  metadata: {
    icon_url?: string;
    description?: string;
    supported_regions?: string[];
    documentation_url?: string;
  };
}

const CloudProviderManager = () => {
  const { userProfile } = useAuth();
  const [providers, setProviders] = useState<CloudProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider | null>(null);

  // États pour les modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // État pour le formulaire
  const [formData, setFormData] = useState<CloudProviderFormData>({
    name: "",
    display_name: "",
    api_endpoint: "",
    is_active: true,
    metadata: {
      description: "",
      icon_url: "",
      supported_regions: [],
      documentation_url: ""
    }
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('cloud_providers')
        .select('*')
        .order('display_name');

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast.error('Erreur lors du chargement des providers');
    } finally {
      setLoading(false);
    }
  };

  const createProvider = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('cloud_providers')
        .insert([{
          name: formData.name,
          display_name: formData.display_name,
          api_endpoint: formData.api_endpoint || null,
          is_active: formData.is_active,
          metadata: formData.metadata
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Provider créé avec succès');
      setIsCreateModalOpen(false);
      resetForm();
      fetchProviders();
    } catch (error) {
      console.error('Error creating provider:', error);
      toast.error('Erreur lors de la création du provider');
    } finally {
      setLoading(false);
    }
  };

  const updateProvider = async () => {
    if (!selectedProvider) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('cloud_providers')
        .update({
          name: formData.name,
          display_name: formData.display_name,
          api_endpoint: formData.api_endpoint || null,
          is_active: formData.is_active,
          metadata: formData.metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProvider.id);

      if (error) throw error;

      toast.success('Provider mis à jour');
      setIsEditModalOpen(false);
      resetForm();
      fetchProviders();
    } catch (error) {
      console.error('Error updating provider:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const deleteProvider = async () => {
    if (!selectedProvider) return;

    try {
      const { error } = await supabase
        .from('cloud_providers')
        .delete()
        .eq('id', selectedProvider.id);

      if (error) throw error;

      toast.success('Provider supprimé');
      setIsDeleteModalOpen(false);
      setSelectedProvider(null);
      fetchProviders();
    } catch (error) {
      console.error('Error deleting provider:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      display_name: "",
      api_endpoint: "",
      is_active: true,
      metadata: {
        description: "",
        icon_url: "",
        supported_regions: [],
        documentation_url: ""
      }
    });
    setSelectedProvider(null);
  };

  const openEditModal = (provider: CloudProvider) => {
    setSelectedProvider(provider);
    setFormData({
      name: provider.name,
      display_name: provider.display_name,
      api_endpoint: provider.api_endpoint || "",
      is_active: provider.is_active,
      metadata: {
        description: provider.metadata?.description || "",
        icon_url: provider.metadata?.icon_url || "",
        supported_regions: provider.metadata?.supported_regions || [],
        documentation_url: provider.metadata?.documentation_url || ""
      }
    });
    setIsEditModalOpen(true);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "default" : "secondary";
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />;
  };

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && provider.is_active) ||
                         (statusFilter === "inactive" && !provider.is_active);

    return matchesSearch && matchesStatus;
  });

  const stats = [
    {
      title: "Providers totaux",
      value: providers.length.toString(),
      icon: Cloud,
      color: "text-blue-500"
    },
    {
      title: "Actifs",
      value: providers.filter(p => p.is_active).length.toString(),
      icon: CheckCircle,
      color: "text-green-500"
    },
    {
      title: "Inactifs",
      value: providers.filter(p => !p.is_active).length.toString(),
      icon: XCircle,
      color: "text-red-500"
    },
    {
      title: "Configurations",
      value: providers.filter(p => p.api_endpoint).length.toString(),
      icon: Settings,
      color: "text-purple-500"
    }
  ];

  // Formulaire réutilisable pour création/édition
  const ProviderForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nom technique</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="aws, azure, gcp..."
          />
        </div>
        <div>
          <Label htmlFor="display_name">Nom d'affichage</Label>
          <Input
            id="display_name"
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            placeholder="Amazon Web Services"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="api_endpoint">Point d'entrée API (optionnel)</Label>
        <Input
          id="api_endpoint"
          value={formData.api_endpoint}
          onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
          placeholder="https://api.provider.com/v1"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.metadata.description}
          onChange={(e) => setFormData({ 
            ...formData, 
            metadata: { ...formData.metadata, description: e.target.value }
          })}
          placeholder="Description du provider..."
        />
      </div>

      <div>
        <Label htmlFor="icon_url">URL de l'icône</Label>
        <Input
          id="icon_url"
          value={formData.metadata.icon_url}
          onChange={(e) => setFormData({ 
            ...formData, 
            metadata: { ...formData.metadata, icon_url: e.target.value }
          })}
          placeholder="https://example.com/icon.png"
        />
      </div>

      <div>
        <Label htmlFor="documentation_url">URL de documentation</Label>
        <Input
          id="documentation_url"
          value={formData.metadata.documentation_url}
          onChange={(e) => setFormData({ 
            ...formData, 
            metadata: { ...formData.metadata, documentation_url: e.target.value }
          })}
          placeholder="https://docs.provider.com"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="is_active">Provider actif</Label>
      </div>
    </div>
  );

  if (loading && providers.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Gestionnaire Cloud Providers"
          description="Gestion des fournisseurs cloud disponibles"
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
        title="Gestionnaire Cloud Providers"
        description="Gestion des fournisseurs cloud disponibles"
        action={{
          label: "Ajouter un provider",
          icon: Plus,
          onClick: () => {
            resetForm();
            setIsCreateModalOpen(true);
          }
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

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un provider..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">Tous</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Liste des providers */}
      <Card>
        <CardContent>
          {filteredProviders.length === 0 ? (
            <EmptyState
              icon={Cloud}
              title="Aucun provider trouvé"
              description="Aucun fournisseur cloud ne correspond à vos critères"
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Nom technique</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>API Endpoint</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProviders.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {provider.metadata?.icon_url ? (
                            <img 
                              src={provider.metadata.icon_url} 
                              alt={provider.display_name}
                              className="h-6 w-6"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Cloud className="h-6 w-6 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium">{provider.display_name}</p>
                            {provider.metadata?.description && (
                              <p className="text-sm text-muted-foreground">
                                {provider.metadata.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {provider.name}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(provider.is_active)}
                          <Badge variant={getStatusColor(provider.is_active)}>
                            {provider.is_active ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {provider.api_endpoint ? (
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4" />
                            <span className="text-sm font-mono">
                              {provider.api_endpoint}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(provider.created_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProvider(provider);
                              setIsDetailsModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(provider)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProvider(provider);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modales */}
      {/* Modal de création */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un nouveau provider</DialogTitle>
            <DialogDescription>
              Ajouter un nouveau fournisseur cloud
            </DialogDescription>
          </DialogHeader>
          <ProviderForm />
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={createProvider} disabled={!formData.name || !formData.display_name}>
              Créer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'édition */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le provider</DialogTitle>
            <DialogDescription>
              Mettre à jour les informations du provider
            </DialogDescription>
          </DialogHeader>
          <ProviderForm />
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={updateProvider} disabled={!formData.name || !formData.display_name}>
              Sauvegarder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de suppression */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le provider</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer "{selectedProvider?.display_name}" ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={deleteProvider}>
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CloudProviderManager;