import { useState, useEffect, useCallback, useMemo } from "react";
import { useUsers } from "@/hooks/useUsers";
import { useAuth } from "@/contexts/AuthContext";
import { CRUDTable } from "@/components/common/CRUDTable";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users as UsersIcon, 
  UserPlus,
  Shield, 
  Mail, 
  Phone, 
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lock,
  Unlock,
  Send,
  Download,
  Upload,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { UserForm } from "@/components/forms/UserForm";
import type { User } from "@/hooks/useUsers";
import { supabase } from "@/integrations/supabase/client";

interface Role {
  id: string;
  name: string;
  display_name: string;
  permissions?: string[];
  is_system?: boolean;
}

const Users = () => {
  const { user, sessionContext } = useAuth();
  const { 
    users, 
    loading, 
    error, 
    totalCount, 
    refresh, 
    createUser, 
    updateUser, 
    deleteUser,
    clearError 
  } = useUsers();

  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  
  // Charger les rôles depuis la base de données
  const loadRoles = useCallback(async () => {
    if (!user) return;
    
    try {
      setRolesLoading(true);
      const { data, error } = await supabase
        .from('roles')
        .select('id, name, display_name')
        .order('display_name');
        
      if (error) throw error;
      
      setRoles(data || []);
    } catch (err) {
      console.error('Error loading roles:', err);
      toast.error('Erreur lors du chargement des rôles');
      // Fallback vers les rôles par défaut
      setRoles([
        { id: '1', name: 'admin', display_name: 'Administrateur' },
        { id: '2', name: 'manager', display_name: 'Manager' },
        { id: '3', name: 'user', display_name: 'Utilisateur' },
        { id: '4', name: 'msp', display_name: 'MSP Admin' },
        { id: '5', name: 'editor', display_name: 'Éditeur' },
        { id: '6', name: 'viewer', display_name: 'Visualiseur' }
      ]);
    } finally {
      setRolesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<any[]>([]);

  // États pour les modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkActionModalOpen, setIsBulkActionModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // États pour les formulaires
  const [editUser, setEditUser] = useState<{
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    role: string;
    status: "active" | "inactive" | "pending" | "suspended";
    department: string;
    position: string;
  }>({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    role: "",
    status: "active",
    department: "",
    position: ""
  });

  const handleCreateUser = useCallback(async (data: any) => {
    console.log('handleCreateUser called with:', data);
    const success = await createUser(data);
    if (success) {
      setIsCreateModalOpen(false);
    }
  }, [createUser]);

  const handleUpdateUser = useCallback(async (data: any) => {
    if (!selectedUser) return;
    
    console.log('handleUpdateUser called with:', data);
    const success = await updateUser(selectedUser.id, data);
    if (success) {
      setIsEditModalOpen(false);
      setSelectedUser(null);
      resetEditUserForm();
    }
  }, [selectedUser, updateUser]);

  const handleDeleteUser = useCallback(async (user: User) => {
    const success = await deleteUser(user.id);
    if (success) {
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    }
  }, [deleteUser]);

  const bulkDeleteUsers = useCallback(async () => {
    try {
      for (const userId of selectedUsers) {
        await deleteUser(userId);
      }
      toast.success(`${selectedUsers.length} utilisateurs supprimés`);
      setIsBulkActionModalOpen(false);
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      toast.error('Erreur lors de la suppression en masse');
    }
  }, [selectedUsers, deleteUser]);

  const resetEditUserForm = useCallback(() => {
    setEditUser({
      email: "",
      first_name: "",
      last_name: "",
      phone: "",
      role: "",
      status: "active",
      department: "",
      position: ""
    });
    setSelectedUser(null);
  }, []);

  const openEditModal = useCallback((user: User) => {
    setSelectedUser(user);
    setEditUser({
      email: user.email,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone: user.metadata?.phone || "",
      role: user.metadata?.role || "",
      status: (user.metadata?.status as "active" | "inactive" | "pending" | "suspended") || "active",
      department: user.metadata?.department || "",
      position: user.metadata?.position || ""
    });
    setIsEditModalOpen(true);
  }, []);

  const openViewModal = useCallback((user: User) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  }, []);

  const openDeleteModal = useCallback((user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "active": return "default";
      case "inactive": return "secondary";
      case "pending": return "outline";
      case "suspended": return "destructive";
      default: return "outline";
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4" />;
      case "inactive": return <XCircle className="h-4 w-4" />;
      case "pending": return <AlertCircle className="h-4 w-4" />;
      case "suspended": return <Lock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  }, []);

  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'Nom',
      type: 'custom' as const,
      sortable: true,
      filterable: true,
      render: (value: any, row: User) => (
        <div>
          <p className="font-medium">{`${row.first_name || ''} ${row.last_name || ''}`}</p>
          <p className="text-sm text-muted-foreground">{row.email}</p>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Rôle',
      type: 'badge' as const,
      sortable: true,
      filterable: true,
      render: (value: any, row: User) => {
        const roleName = row.metadata?.role || 'user';
        const role = roles.find(r => r.name === roleName);
        return (
          <Badge variant="outline">
            {role?.display_name || roleName}
          </Badge>
        );
      }
    },
    {
      key: 'status',
      label: 'Statut',
      type: 'custom' as const,
      sortable: true,
      filterable: true,
      render: (value: any, row: User) => {
        const status = row.metadata?.status || 'active';
        return (
          <div className="flex items-center space-x-2">
            {getStatusIcon(status)}
            <Badge variant={getStatusColor(status)}>
              {status}
            </Badge>
          </div>
        );
      }
    },
    {
      key: 'department',
      label: 'Département',
      type: 'text' as const,
      sortable: true,
      filterable: true,
      render: (value: any, row: User) => row.metadata?.department || '-'
    },
    {
      key: 'last_login',
      label: 'Dernière connexion',
      type: 'date' as const,
      sortable: true,
      render: (value: any, row: User) => 
        row.metadata?.last_login ? new Date(row.metadata.last_login).toLocaleDateString() : 'Jamais'
    },
    {
      key: 'created_at',
      label: 'Créé le',
      type: 'date' as const,
      sortable: true,
      render: (value: any, row: User) => new Date(row.created_at).toLocaleDateString()
    }
  ], [roles, getStatusColor, getStatusIcon]);

  const stats = useMemo(() => [
    {
      title: "Utilisateurs totaux",
      value: totalCount.toString(),
      icon: UsersIcon,
      color: "text-blue-500"
    },
    {
      title: "Actifs",
      value: users.filter(u => u.metadata?.status === 'active' || !u.metadata?.status).length.toString(),
      icon: CheckCircle,
      color: "text-green-500"
    },
    {
      title: "En attente",
      value: users.filter(u => u.metadata?.status === 'pending').length.toString(),
      icon: AlertCircle,
      color: "text-yellow-500"
    },
    {
      title: "Suspendus",
      value: users.filter(u => u.metadata?.status === 'suspended').length.toString(),
      icon: Lock,
      color: "text-red-500"
    }
  ], [users, totalCount]);

  // Vérifier les permissions d'accès
  const canManageUsers = useMemo(() => {
    return sessionContext?.is_msp || sessionContext?.current_team_id;
  }, [sessionContext]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Accès non autorisé</h3>
          <p className="text-muted-foreground">Vous devez être connecté pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Permissions insuffisantes</h3>
          <p className="text-muted-foreground">Vous n'avez pas les permissions nécessaires pour gérer les utilisateurs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      </div>

      {/* Tableau CRUD */}
      <CRUDTable
        title="Gestion des utilisateurs"
        description="Gérez les utilisateurs de votre équipe"
        columns={columns}
        data={users}
        loading={loading || rolesLoading}
        totalCount={totalCount}
        pageSize={pageSize}
        currentPage={currentPage}
        searchPlaceholder="Rechercher un utilisateur..."
        onSearch={setSearchTerm}
        onFilter={setFilters}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        onCreate={() => setIsCreateModalOpen(true)}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onView={openViewModal}
        onRefresh={refresh}
        onExport={() => toast.info('Export en cours de développement')}
        onImport={() => toast.info('Import en cours de développement')}
        selectable={true}
        onSelectionChange={setSelectedUsers}
        emptyState={{
          icon: UsersIcon,
          title: "Aucun utilisateur",
          description: "Commencez par créer votre premier utilisateur",
          action: {
            label: "Créer un utilisateur",
            onClick: () => setIsCreateModalOpen(true)
          }
        }}
        actions={[
          {
            label: "Envoyer un email",
            icon: Mail,
            onClick: (user) => toast.info(`Email envoyé à ${user.email}`),
            variant: "outline"
          }
        ]}
      />

      {/* Formulaires de création et modification */}
      <UserForm
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={handleCreateUser}
        loading={loading}
        title="Créer un utilisateur"
        roles={roles}
      />

      <UserForm
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSubmit={handleUpdateUser}
        defaultValues={editUser}
        loading={loading}
        title="Modifier l'utilisateur"
        roles={roles}
        isEdit={true}
      />

      {/* Modal de visualisation */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Détails de l'utilisateur</DialogTitle>
            <DialogDescription>
              Informations complètes de l'utilisateur
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nom complet</Label>
                  <p className="font-medium">{`${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Téléphone</Label>
                  <p className="font-medium">{selectedUser.metadata?.phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Rôle</Label>
                  <Badge variant="outline">
                    {roles.find(r => r.name === (selectedUser.metadata?.role || 'user'))?.display_name || selectedUser.metadata?.role || 'user'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Statut</Label>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedUser.metadata?.status || 'active')}
                    <Badge variant={getStatusColor(selectedUser.metadata?.status || 'active')}>
                      {selectedUser.metadata?.status || 'active'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Département</Label>
                  <p className="font-medium">{selectedUser.metadata?.department || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Poste</Label>
                  <p className="font-medium">{selectedUser.metadata?.position || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Dernière connexion</Label>
                  <p className="font-medium">
                    {selectedUser.metadata?.last_login ? new Date(selectedUser.metadata.last_login).toLocaleString() : 'Jamais'}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openEditModal(selectedUser);
                  }}
                >
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast.info(`Email envoyé à ${selectedUser.email}`)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer un email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de suppression */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'utilisateur "{selectedUser?.first_name} {selectedUser?.last_name}" ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedUser && handleDeleteUser(selectedUser)}
            >
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'actions en masse */}
      <Dialog open={isBulkActionModalOpen} onOpenChange={setIsBulkActionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actions en masse</DialogTitle>
            <DialogDescription>
              {selectedUsers.length} utilisateur(s) sélectionné(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button 
              variant="destructive" 
              onClick={bulkDeleteUsers}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer les utilisateurs sélectionnés
            </Button>
            <Button 
              variant="outline" 
              onClick={() => toast.info('Envoi d\'emails en masse en cours de développement')}
              className="w-full"
            >
              <Mail className="h-4 w-4 mr-2" />
              Envoyer un email aux utilisateurs sélectionnés
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;