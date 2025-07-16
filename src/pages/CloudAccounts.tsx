import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  PageHeader, 
  DataGrid, 
  EmptyState 
} from "@/components/common";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CloudAccounts = () => {
  const { userProfile } = useAuth();
  const { 
    accounts, 
    providers, 
    organizations, 
    teams, 
    loading,
    createAccount,
    updateAccount,
    deleteAccount
  } = useCloudAccounts();

  // États locaux pour l'interface
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [environmentFilter, setEnvironmentFilter] = useState<string>("all");
  
  // États pour les modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<CloudAccountWithDetails | null>(null);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  // Gestionnaires d'événements
  const handleCreateAccount = async (data: CloudAccountFormData) => {
    await createAccount(data);
  };

  const handleUpdateAccount = async (data: CloudAccountFormData) => {
    if (!selectedAccount) return;
    await updateAccount(selectedAccount.id, data);
  };

  const handleEditAccount = (account: CloudAccountWithDetails) => {
    setSelectedAccount(account);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleDeleteAccount = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) {
      await deleteAccount(id);
    }
  };

  const handleManageUsers = (account: CloudAccountWithDetails) => {
    setSelectedAccount(account);
    setIsUserManagementOpen(true);
  };

  const resetForm = () => {
    setSelectedAccount(null);
    setIsEditing(false);
    setIsFormOpen(false);
  };

  // Fonctions de filtrage
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = 
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.cloud_providers?.display_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && account.is_active) ||
      (statusFilter === "inactive" && !account.is_active);
    
    const matchesProvider = providerFilter === "all" || account.provider_id === providerFilter;
    
    const matchesEnvironment = environmentFilter === "all" || 
      (Array.isArray(account.environment) && account.environment.includes(environmentFilter));

    return matchesSearch && matchesStatus && matchesProvider && matchesEnvironment;
  });

  // Statistiques
  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter(a => a.is_active).length;
  const inactiveAccounts = totalAccounts - activeAccounts;
  const environments = [...new Set(accounts.flatMap(a => Array.isArray(a.environment) ? a.environment : [a.environment || 'production']))].length;

  const stats = [
    {
      title: "Total des comptes",
      value: totalAccounts.toString(),
      icon: CreditCard,
      color: "text-blue-500"
    },
    {
      title: "Comptes actifs",
      value: activeAccounts.toString(),
      icon: CheckCircle,
      color: "text-green-500"
    },
    {
      title: "Comptes inactifs",
      value: inactiveAccounts.toString(),
      icon: XCircle,
      color: "text-red-500"
    },
    {
      title: "Environnements",
      value: environments.toString(),
      icon: Globe,
      color: "text-purple-500"
    }
  ];

  // Gestion des permissions
  const canManageAccounts = userProfile?.is_msp_admin || false;

  if (loading && accounts.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Comptes Cloud"
          description="Gestion centralisée des comptes cloud"
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
        description="Gestion centralisée des comptes cloud par les administrateurs MSP"
        action={canManageAccounts ? {
          label: "Nouveau compte",
          icon: Plus,
          onClick: () => {
            resetForm();
            setIsFormOpen(true);
          }
        } : undefined}
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
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, description ou provider..."
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
              <Select value={environmentFilter} onValueChange={setEnvironmentFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Environnement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="development">Développement</SelectItem>
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
          title={searchTerm || statusFilter !== "all" || providerFilter !== "all" || environmentFilter !== "all" 
            ? "Aucun compte trouvé" 
            : "Aucun compte cloud"}
          description={searchTerm || statusFilter !== "all" || providerFilter !== "all" || environmentFilter !== "all"
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

      {/* Modal de création/édition */}
      <CloudAccountForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) resetForm();
        }}
        onSubmit={isEditing ? handleUpdateAccount : handleCreateAccount}
        providers={providers}
        organizations={organizations}
        teams={teams}
        initialData={selectedAccount ? {
          name: selectedAccount.name,
          description: selectedAccount.description || '',
          provider_id: selectedAccount.provider_id,
          team_id: selectedAccount.team_id,
          client_organization_id: selectedAccount.client_organization_id,
          account_identifier: selectedAccount.account_identifier,
          region: selectedAccount.region || '',
          environment: Array.isArray(selectedAccount.environment) ? selectedAccount.environment : ['production']
        } : undefined}
        isEditing={isEditing}
      />

      {/* Modal de gestion des utilisateurs */}
      <Dialog open={isUserManagementOpen} onOpenChange={setIsUserManagementOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Gestion des accès - {selectedAccount?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Fonctionnalité de gestion des utilisateurs à venir</span>
            </div>
            {selectedAccount?.profiles && selectedAccount.profiles.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">
                  Utilisateurs actuellement assignés : {selectedAccount.profiles.length}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CloudAccounts;