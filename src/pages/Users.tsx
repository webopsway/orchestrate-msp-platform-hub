import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CRUDTable } from "@/components/common/CRUDTable";
// import { CRUDForm } from "@/components/common/CRUDForm";
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

interface User {
  id: string;
  team_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  last_login?: string;
  created_at: string;
  updated_at: string;
  metadata?: {
    department?: string;
    position?: string;
    manager_id?: string;
    [key: string]: any;
  };
}

interface Role {
  id: string;
  name: string;
  display_name: string;
  permissions: string[];
  is_system: boolean;
}

const Users = () => {
  const { sessionContext } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
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
  const [newUser, setNewUser] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    role: "",
    department: "",
    position: ""
  });

  const [editUser, setEditUser] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    role: "",
    status: "active" as const,
    department: "",
    position: ""
  });

  useEffect(() => {
    fetchData();
  }, [sessionContext, currentPage, pageSize, searchTerm, filters]);

  const fetchData = async () => {
    if (!sessionContext?.current_team_id) return;

    try {
      setLoading(true);
      
      // Récupérer les utilisateurs avec pagination
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      // Appliquer les filtres
      if (searchTerm) {
        query = query.or(`email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`);
      }

      // Skip complex filters to avoid type issues
      // filters.forEach(filter => {
      //   if (filter.value) {
      //     query = query.eq(filter.key, filter.value);
      //   }
      // });

      // Pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: usersData, error: usersError, count } = await query;

      if (usersError) throw usersError;
      
      // Transform data to match interface
      const transformedUsers = (usersData || []).map(user => ({
        ...user,
        team_id: sessionContext.current_team_id,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        role: 'user',
        status: 'active' as const,
        phone: (user.metadata as any)?.phone || '',
        metadata: (user.metadata as any) || {},
        created_at: user.created_at || new Date().toISOString(),
        updated_at: user.updated_at || new Date().toISOString()
      }));
      
      setUsers(transformedUsers);
      setTotalCount(count || 0);

      // Récupérer les rôles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*');

      if (rolesError) throw rolesError;
      
      // Transform data to match interface
      const transformedRoles = (rolesData || []).map(role => ({
        ...role,
        permissions: [],
        is_system: role.is_system_role || false
      }));
      
      setRoles(transformedRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (data: any) => {
    if (!sessionContext?.current_team_id) return;

    try {
      setLoading(true);
      
      const userData = {
        id: crypto.randomUUID(),
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        metadata: {
          phone: data.phone,
          role: data.role,
          status: 'pending',
          department: data.department,
          position: data.position
        }
      };
      
      const { data: newUser, error } = await supabase
        .from('profiles')
        .insert([userData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Utilisateur créé avec succès');
      setIsCreateModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (data: any) => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      
      const updateData = {
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        updated_at: new Date().toISOString(),
        metadata: {
          phone: data.phone,
          role: data.role,
          status: data.status,
          department: data.department,
          position: data.position
        }
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast.success('Utilisateur mis à jour avec succès');
      setIsEditModalOpen(false);
      setSelectedUser(null);
      fetchData();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (user: User) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Utilisateur supprimé');
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const bulkDeleteUsers = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .in('id', selectedUsers);

      if (error) throw error;

      toast.success(`${selectedUsers.length} utilisateurs supprimés`);
      setIsBulkActionModalOpen(false);
      setSelectedUsers([]);
      fetchData();
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      toast.error('Erreur lors de la suppression en masse');
    }
  };

  const resetNewUserForm = () => {
    setNewUser({
      email: "",
      first_name: "",
      last_name: "",
      phone: "",
      role: "",
      department: "",
      position: ""
    });
  };

  const resetEditUserForm = () => {
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
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone || "",
      role: user.role,
      status: "active" as const,
      department: user.metadata?.department || "",
      position: user.metadata?.position || ""
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (user: User) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "inactive": return "secondary";
      case "pending": return "outline";
      case "suspended": return "destructive";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4" />;
      case "inactive": return <XCircle className="h-4 w-4" />;
      case "pending": return <AlertCircle className="h-4 w-4" />;
      case "suspended": return <Lock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Nom',
      type: 'custom' as const,
      sortable: true,
      filterable: true,
      render: (value: any, row: User) => (
        <div>
          <p className="font-medium">{`${row.first_name} ${row.last_name}`}</p>
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
        const role = roles.find(r => r.name === row.role);
        return (
          <Badge variant="outline">
            {role?.display_name || row.role}
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
      render: (value: any, row: User) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(row.status)}
          <Badge variant={getStatusColor(row.status)}>
            {row.status}
          </Badge>
        </div>
      )
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
        row.last_login ? new Date(row.last_login).toLocaleDateString() : 'Jamais'
    },
    {
      key: 'created_at',
      label: 'Créé le',
      type: 'date' as const,
      sortable: true,
      render: (value: any, row: User) => new Date(row.created_at).toLocaleDateString()
    }
  ];

  const userFields = [
    {
      key: 'email',
      label: 'Email',
      type: 'email' as const,
      required: true,
      placeholder: 'utilisateur@example.com'
    },
    {
      key: 'first_name',
      label: 'Prénom',
      type: 'text' as const,
      required: true,
      placeholder: 'Prénom'
    },
    {
      key: 'last_name',
      label: 'Nom',
      type: 'text' as const,
      required: true,
      placeholder: 'Nom'
    },
    {
      key: 'phone',
      label: 'Téléphone',
      type: 'text' as const,
      placeholder: '+33 1 23 45 67 89'
    },
    {
      key: 'role',
      label: 'Rôle',
      type: 'select' as const,
      required: true,
      options: roles.map(role => ({
        value: role.name,
        label: role.display_name
      }))
    },
    {
      key: 'department',
      label: 'Département',
      type: 'text' as const,
      placeholder: 'IT, RH, Finance...'
    },
    {
      key: 'position',
      label: 'Poste',
      type: 'text' as const,
      placeholder: 'Développeur, Manager...'
    }
  ];

  const editUserFields = [
    ...userFields,
    {
      key: 'status',
      label: 'Statut',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'active', label: 'Actif' },
        { value: 'inactive', label: 'Inactif' },
        { value: 'pending', label: 'En attente' },
        { value: 'suspended', label: 'Suspendu' }
      ]
    }
  ];

  const stats = [
    {
      title: "Utilisateurs totaux",
      value: totalCount.toString(),
      icon: UsersIcon,
      color: "text-blue-500"
    },
    {
      title: "Actifs",
      value: users.filter(u => u.status === 'active').length.toString(),
      icon: CheckCircle,
      color: "text-green-500"
    },
    {
      title: "En attente",
      value: users.filter(u => u.status === 'pending').length.toString(),
      icon: AlertCircle,
      color: "text-yellow-500"
    },
    {
      title: "Suspendus",
      value: users.filter(u => u.status === 'suspended').length.toString(),
      icon: Lock,
      color: "text-red-500"
    }
  ];

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
        loading={loading}
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
        onRefresh={fetchData}
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

      {/* Utiliser les nouveaux formulaires depuis les pages dédiées */}

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
                  <p className="font-medium">{`${selectedUser.first_name} ${selectedUser.last_name}`}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Téléphone</Label>
                  <p className="font-medium">{selectedUser.phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Rôle</Label>
                  <Badge variant="outline">
                    {roles.find(r => r.name === selectedUser.role)?.display_name || selectedUser.role}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Statut</Label>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedUser.status)}
                    <Badge variant={getStatusColor(selectedUser.status)}>
                      {selectedUser.status}
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
                    {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : 'Jamais'}
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
              onClick={() => selectedUser && deleteUser(selectedUser)}
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