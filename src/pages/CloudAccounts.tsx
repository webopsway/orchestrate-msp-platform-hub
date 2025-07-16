import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  PageHeader, 
  DataGrid, 
  EmptyState 
} from "@/components/common";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Cloud, 
  CreditCard, 
  Plus, 
  Search,
  CheckCircle,
  XCircle,
  Globe,
  Users
} from "lucide-react";
import { useCloudAccounts, type CloudAccountWithDetails, type CloudAccountFormData } from "@/hooks/useCloudAccounts";
import { CloudAccountForm } from "@/components/cloud/CloudAccountForm";
import { CloudAccountCard } from "@/components/cloud/CloudAccountCard";

const CloudAccounts = () => {
  const { userProfile } = useAuth();
  const {
    cloudAccounts,
    providers,
    organizations,
    teams,
    environments,
    isLoading,
    createCloudAccount,
    updateCloudAccount,
    deleteCloudAccount
  } = useCloudAccounts();

  // États locaux pour l'interface
  const [searchTerm, setSearchTerm] = useState("");
  const [providerFilter, setProviderFilter] = useState<string>("");
  const [organizationFilter, setOrganizationFilter] = useState<string>("");
  const [teamFilter, setTeamFilter] = useState<string>("");
  
  // États pour les modales
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CloudAccountWithDetails | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<CloudAccountWithDetails | null>(null);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!cloudAccounts) return null;
    
    const total = cloudAccounts.length;
    const active = cloudAccounts.filter(acc => acc.is_active).length;
    const byProvider = cloudAccounts.reduce((acc, account) => {
      const provider = account.cloud_providers?.display_name || 'Unknown';
      acc[provider] = (acc[provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byEnvironment = cloudAccounts.reduce((acc, account) => {
      if (account.environments && Array.isArray(account.environments)) {
        account.environments.forEach(env => {
          acc[env.display_name] = (acc[env.display_name] || 0) + 1;
        });
      }
      return acc;
    }, {} as Record<string, number>);

    return { total, active, byProvider, byEnvironment };
  }, [cloudAccounts]);

  // Filter accounts based on search and filters
  const filteredAccounts = useMemo(() => {
    if (!cloudAccounts) return [];
    
    return cloudAccounts.filter(account => {
      const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          account.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          account.account_identifier.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesProvider = !providerFilter || providerFilter === "all" || account.provider_id === providerFilter;
      const matchesOrganization = !organizationFilter || organizationFilter === "all" || account.client_organization_id === organizationFilter;
      const matchesTeam = !teamFilter || teamFilter === "all" || account.team_id === teamFilter;
      
      return matchesSearch && matchesProvider && matchesOrganization && matchesTeam;
    });
  }, [cloudAccounts, searchTerm, providerFilter, organizationFilter, teamFilter]);

  const handleCreateAccount = async (data: CloudAccountFormData) => {
    createCloudAccount.mutate(data, {
      onSuccess: () => {
        setShowCreateDialog(false);
      }
    });
  };

  const handleUpdateAccount = async (data: CloudAccountFormData) => {
    if (!editingAccount) return;
    
    updateCloudAccount.mutate({ ...data, id: editingAccount.id }, {
      onSuccess: () => {
        setShowEditDialog(false);
        setEditingAccount(null);
      }
    });
  };

  const handleDeleteAccount = (id: string) => {
    deleteCloudAccount.mutate(id);
  };

  const handleEditAccount = (account: CloudAccountWithDetails) => {
    setEditingAccount(account);
    setShowEditDialog(true);
  };

  const handleManageUsers = (account: CloudAccountWithDetails) => {
    setSelectedAccount(account);
    setShowUserDialog(true);
  };

  const canManageAccounts = userProfile?.is_msp_admin || false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comptes Cloud"
        description="Gestion centralisée des comptes cloud"
        action={canManageAccounts ? {
          label: "Nouveau compte",
          icon: Plus,
          onClick: () => setShowCreateDialog(true)
        } : undefined}
      />

      {/* Statistiques */}
      {stats && (
        <DataGrid columns={4}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-lg bg-muted text-blue-500">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total des comptes</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-lg bg-muted text-green-500">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Comptes actifs</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-lg bg-muted text-red-500">
                  <XCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Comptes inactifs</p>
                  <p className="text-2xl font-bold">{stats.total - stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-lg bg-muted text-purple-500">
                  <Globe className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Environnements</p>
                  <p className="text-2xl font-bold">{Object.keys(stats.byEnvironment).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </DataGrid>
      )}

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, description ou identifiant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les fournisseurs</SelectItem>
                  {providers?.map(provider => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Organisation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les organisations</SelectItem>
                  {organizations?.map(org => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Équipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les équipes</SelectItem>
                  {teams?.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des comptes */}
      {filteredAccounts.length === 0 ? (
        <EmptyState
          icon={Cloud}
          title={searchTerm || providerFilter || organizationFilter || teamFilter 
            ? "Aucun compte trouvé" 
            : "Aucun compte cloud"}
          description={searchTerm || providerFilter || organizationFilter || teamFilter
            ? "Aucun compte ne correspond à vos critères de recherche"
            : canManageAccounts 
              ? "Commencez par créer votre premier compte cloud"
              : "Aucun compte cloud n'a été configuré pour le moment"}
        />
      ) : (
        <DataGrid columns={1} className="sm:grid-cols-2 lg:grid-cols-3">
          {filteredAccounts.map((account) => (
            <CloudAccountCard
              key={account.id}
              account={account}
              onEdit={handleEditAccount}
              onDelete={handleDeleteAccount}
              onManageUsers={handleManageUsers}
              canManage={canManageAccounts}
            />
          ))}
        </DataGrid>
      )}

      {/* Dialogs */}
      {canManageAccounts && (
        <CloudAccountForm
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSubmit={handleCreateAccount}
          providers={providers || []}
          organizations={organizations || []}
          teams={teams || []}
          environments={environments || []}
        />
      )}

      {editingAccount && (
        <CloudAccountForm
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSubmit={handleUpdateAccount}
          providers={providers || []}
          organizations={organizations || []}
          teams={teams || []}
          environments={environments || []}
          initialData={{
            environment_ids: editingAccount.environments?.map(env => env.id) || [],
            ...editingAccount
          }}
          isEditing
        />
      )}

      {selectedAccount && (
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Gestion des utilisateurs - {selectedAccount.name}</DialogTitle>
              <DialogDescription>
                Gérez les accès utilisateurs pour le compte.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Utilisateurs ayant accès au compte :
              </p>
              <div className="space-y-2">
                {/* TODO: Liste des utilisateurs avec possibilité d'ajouter/retirer */}
                <p className="text-sm text-muted-foreground">
                  Fonctionnalité de gestion des utilisateurs à implémenter
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CloudAccounts;