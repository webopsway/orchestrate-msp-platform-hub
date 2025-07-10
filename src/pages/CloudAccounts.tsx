import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
  CreditCard, 
  Plus, 
  Search, 
  TestTube, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  Key,
  Globe
} from "lucide-react";
import { toast } from "sonner";

interface CloudAccount {
  id: string;
  team_id: string;
  provider_id: string;
  name: string;
  description?: string;
  config: {
    access_key?: string;
    secret_key?: string;
    region?: string;
    project_id?: string;
    subscription_id?: string;
    tenant_id?: string;
    [key: string]: any;
  };
  status: 'active' | 'inactive' | 'error' | 'testing';
  last_test_at?: string;
  last_test_result?: boolean;
  created_at: string;
  updated_at: string;
}

interface CloudProvider {
  id: string;
  name: string;
  display_name: string;
  icon_url?: string;
  config_schema: {
    required_fields: string[];
    optional_fields: string[];
    field_types: Record<string, 'text' | 'password' | 'select' | 'textarea'>;
    field_labels: Record<string, string>;
    field_placeholders: Record<string, string>;
  };
}

const CloudAccounts = () => {
  const { sessionContext } = useAuth();
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [providers, setProviders] = useState<CloudProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [selectedAccount, setSelectedAccount] = useState<CloudAccount | null>(null);

  // État pour le modal de création/édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: "",
    description: "",
    provider_id: "",
    config: {} as Record<string, any>
  });

  useEffect(() => {
    fetchCloudData();
  }, [sessionContext]);

  const fetchCloudData = async () => {
    if (!sessionContext?.current_team_id) return;

    try {
      setLoading(true);
      
      // Récupérer les providers
      const { data: providersData, error: providersError } = await supabase
        .from('cloud_providers')
        .select('*');

      if (providersError) throw providersError;
      setProviders(providersData || []);

      // Récupérer les comptes
      const { data: accountsData, error: accountsError } = await supabase
        .from('cloud_credentials')
        .select('*')
        .eq('team_id', sessionContext.current_team_id);

      if (accountsError) throw accountsError;
      setAccounts(accountsData || []);
    } catch (error) {
      console.error('Error fetching cloud data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async () => {
    if (!sessionContext?.current_team_id) return;

    try {
      setLoading(true);
      
      const accountData = {
        team_id: sessionContext.current_team_id,
        provider_id: newAccount.provider_id,
        config: newAccount.config,
        configured_by: sessionContext.current_team_id // TODO: utiliser l'ID utilisateur réel
      };
      
      const { data, error } = await supabase
        .from('cloud_credentials')
        .insert([accountData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Compte cloud créé avec succès');
      setIsModalOpen(false);
      resetForm();
      fetchCloudData();
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error('Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  const updateAccount = async () => {
    if (!selectedAccount) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('cloud_credentials')
        .update({
          config: newAccount.config,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedAccount.id);

      if (error) throw error;

      toast.success('Compte cloud mis à jour');
      setIsModalOpen(false);
      resetForm();
      fetchCloudData();
    } catch (error) {
      console.error('Error updating account:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('cloud_credentials')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      toast.success('Compte cloud supprimé');
      fetchCloudData();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const testConnection = async (accountId: string) => {
    try {
      setTestingConnection(true);
      
      const { data, error } = await supabase.functions.invoke('cloud-orchestration', {
        body: { 
          action: 'test_connection', 
          account_id: accountId 
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Connexion réussie');
      } else {
        toast.error('Échec de la connexion');
      }

      fetchCloudData();
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Erreur lors du test de connexion');
    } finally {
      setTestingConnection(false);
    }
  };

  const resetForm = () => {
    setNewAccount({
      name: "",
      description: "",
      provider_id: "",
      config: {}
    });
    setSelectedAccount(null);
    setIsEditing(false);
    setShowSecrets(false);
  };

  const openEditModal = (account: CloudAccount) => {
    setSelectedAccount(account);
    setNewAccount({
      name: account.name || "",
      description: account.description || "",
      provider_id: account.provider_id,
      config: { ...account.config }
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "inactive": return "secondary";
      case "error": return "destructive";
      case "testing": return "outline";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: string, lastTestResult?: boolean) => {
    if (status === 'testing') return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (status === 'active' && lastTestResult) return <CheckCircle className="h-4 w-4" />;
    if (status === 'error' || lastTestResult === false) return <XCircle className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || account.status === statusFilter;
    const matchesProvider = providerFilter === "all" || account.provider_id === providerFilter;

    return matchesSearch && matchesStatus && matchesProvider;
  });

  const stats = [
    {
      title: "Comptes configurés",
      value: accounts.length.toString(),
      icon: CreditCard,
      color: "text-blue-500"
    },
    {
      title: "Actifs",
      value: accounts.filter(a => a.status === 'active').length.toString(),
      icon: CheckCircle,
      color: "text-green-500"
    },
    {
      title: "En erreur",
      value: accounts.filter(a => a.status === 'error').length.toString(),
      icon: XCircle,
      color: "text-red-500"
    },
    {
      title: "Dernier test",
      value: accounts.length > 0 ? new Date(Math.max(...accounts.map(a => new Date(a.last_test_at || 0).getTime()))).toLocaleDateString() : "Jamais",
      icon: Calendar,
      color: "text-purple-500"
    }
  ];

  if (loading && accounts.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Comptes Cloud"
          description="Gestion des comptes et accès cloud"
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
        title="Comptes Cloud"
        description="Gestion des comptes et accès cloud"
        action={{
          label: "Ajouter un compte",
          icon: Plus,
          onClick: () => {
            resetForm();
            setIsModalOpen(true);
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

      {/* Filtres */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un compte..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les providers</SelectItem>
                  {providers.map(provider => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.display_name}
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
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  <SelectItem value="error">Erreur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAccounts.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="Aucun compte trouvé"
              description="Aucun compte cloud ne correspond à vos critères"
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernier test</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account) => {
                    const provider = providers.find(p => p.id === account.provider_id);
                    
                    return (
                      <TableRow key={account.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{account.name || `Compte ${account.id.slice(0, 8)}`}</p>
                            {account.description && (
                              <p className="text-sm text-muted-foreground">{account.description}</p>
                            )}
                          </div>
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
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(account.status, account.last_test_result)}
                            <Badge variant={getStatusColor(account.status)}>
                              {account.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">
                              {account.last_test_at ? new Date(account.last_test_at).toLocaleDateString() : "Jamais"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {new Date(account.created_at).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => testConnection(account.id)}
                              disabled={testingConnection}
                            >
                              <TestTube className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(account)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteAccount(account.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de création/édition */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Modifier le compte' : 'Ajouter un compte cloud'}
            </DialogTitle>
            <DialogDescription>
              Configurez les accès à votre compte cloud
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du compte</Label>
                <Input
                  id="name"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                  placeholder="Mon compte AWS"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select 
                  value={newAccount.provider_id} 
                  onValueChange={(value) => setNewAccount({...newAccount, provider_id: value, config: {}})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map(provider => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newAccount.description}
                onChange={(e) => setNewAccount({...newAccount, description: e.target.value})}
                placeholder="Description optionnelle..."
                rows={2}
              />
            </div>

            {newAccount.provider_id && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Configuration</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSecrets(!showSecrets)}
                  >
                    {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                
                {providers.find(p => p.id === newAccount.provider_id)?.config_schema.required_fields.map(field => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={field}>
                      {providers.find(p => p.id === newAccount.provider_id)?.config_schema.field_labels[field] || field}
                    </Label>
                    <Input
                      id={field}
                      type={showSecrets && field.includes('key') ? 'text' : 'password'}
                      value={newAccount.config[field] || ''}
                      onChange={(e) => setNewAccount({
                        ...newAccount, 
                        config: {...newAccount.config, [field]: e.target.value}
                      })}
                      placeholder={providers.find(p => p.id === newAccount.provider_id)?.config_schema.field_placeholders[field] || field}
                    />
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={isEditing ? updateAccount : createAccount}
                disabled={!newAccount.provider_id}
              >
                {isEditing ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CloudAccounts; 