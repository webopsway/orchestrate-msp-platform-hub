import { useState } from "react";
import { useRoles } from "@/hooks/useRoles";
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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Shield, 
  ShieldCheck, 
  ShieldX, 
  Users, 
  Settings,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Edit,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

const Roles = () => {
  const {
    roles,
    permissions,
    loading,
    createRole,
    updateRole,
    deleteRole,
    duplicateRole,
    updateRolePermissions,
    getRolePermissions,
    getPermissionsByCategory,
    getPermissionCategories,
    refresh,
    totalRoles,
    systemRoles,
    customRoles,
    totalPermissions
  } = useRoles();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<any[]>([]);

  // États pour les modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // États pour les formulaires
  const [newRole, setNewRole] = useState({
    name: "",
    display_name: "",
    description: "",
    permissions: [] as string[]
  });

  const [editRole, setEditRole] = useState({
    name: "",
    display_name: "",
    description: "",
    permissions: [] as string[]
  });

  // Filter and paginate roles locally
  const filteredRoles = roles.filter(role => {
    if (searchTerm) {
      return role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             role.display_name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const totalCount = filteredRoles.length;
  const paginatedRoles = filteredRoles.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleCreateRole = async (data: any) => {
    const success = await createRole(data);
    if (success) {
      setIsCreateModalOpen(false);
      resetNewRoleForm();
    }
  };

  const handleUpdateRole = async (data: any) => {
    if (!selectedRole) return;
    
    const success = await updateRole(selectedRole.id, data);
    if (success) {
      setIsEditModalOpen(false);
      resetEditRoleForm();
    }
  };

  const handleDeleteRole = async (role: any) => {
    const success = await deleteRole(role.id);
    if (success) {
      setIsDeleteModalOpen(false);
      setSelectedRole(null);
    }
  };

  const handleDuplicateRole = async (role: any) => {
    await duplicateRole(role);
  };

  const resetNewRoleForm = () => {
    setNewRole({
      name: "",
      display_name: "",
      description: "",
      permissions: []
    });
  };

  const resetEditRoleForm = () => {
    setEditRole({
      name: "",
      display_name: "",
      description: "",
      permissions: []
    });
    setSelectedRole(null);
  };

  const openEditModal = (role: any) => {
    setSelectedRole(role);
    setEditRole({
      name: role.name,
      display_name: role.display_name,
      description: role.description || "",
      permissions: getRolePermissions(role.id).map(p => p.id)
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (role: any) => {
    setSelectedRole(role);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = (role: any) => {
    setSelectedRole(role);
    setIsDeleteModalOpen(true);
  };

  const openPermissionsModal = (role: any) => {
    setSelectedRole(role);
    setIsPermissionsModalOpen(true);
  };

  const columns = [
    {
      key: 'display_name',
      label: 'Nom du rôle',
      type: 'custom' as const,
      sortable: true,
      filterable: true,
      render: (value: any, row: any) => (
        <div>
          <div className="flex items-center space-x-2">
            <p className="font-medium">{row.display_name}</p>
            {row.is_system_role && (
              <Badge variant="secondary" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Système
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{row.name}</p>
          {row.description && (
            <p className="text-sm text-muted-foreground">{row.description}</p>
          )}
        </div>
      )
    },
    {
      key: 'permissions',
      label: 'Permissions',
      type: 'custom' as const,
      sortable: false,
      render: (value: any, row: any) => {
        const rolePermissions = getRolePermissions(row.id);
        return (
          <div className="space-y-1">
            <p className="text-sm font-medium">{rolePermissions.length} permissions</p>
            <div className="flex flex-wrap gap-1">
              {rolePermissions.slice(0, 3).map((permission) => (
                <Badge key={permission.id} variant="outline" className="text-xs">
                  {permission.display_name}
                </Badge>
              ))}
              {rolePermissions.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{rolePermissions.length - 3} autres
                </Badge>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: 'user_count',
      label: 'Utilisateurs',
      type: 'number' as const,
      sortable: true,
      render: (value: any, row: any) => (
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>0</span>
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Créé le',
      type: 'date' as const,
      sortable: true,
      render: (value: any, row: any) => new Date(row.created_at).toLocaleDateString()
    }
  ];

  const roleFields = [
    {
      key: 'name',
      label: 'Nom technique',
      type: 'text' as const,
      required: true,
      placeholder: 'admin, user, manager...',
      validation: {
        pattern: '^[a-z_]+$',
        message: 'Le nom technique ne doit contenir que des lettres minuscules et des underscores'
      }
    },
    {
      key: 'display_name',
      label: 'Nom d\'affichage',
      type: 'text' as const,
      required: true,
      placeholder: 'Administrateur, Utilisateur, Manager...'
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea' as const,
      placeholder: 'Description du rôle et de ses responsabilités...'
    }
  ];

  const stats = [
    {
      title: "Rôles totaux",
      value: totalRoles.toString(),
      icon: Shield,
      color: "text-blue-500"
    },
    {
      title: "Rôles système",
      value: systemRoles.length.toString(),
      icon: ShieldCheck,
      color: "text-green-500"
    },
    {
      title: "Rôles personnalisés",
      value: customRoles.length.toString(),
      icon: Settings,
      color: "text-purple-500"
    },
    {
      title: "Permissions disponibles",
      value: totalPermissions.toString(),
      icon: Lock,
      color: "text-orange-500"
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
        title="Gestion des rôles"
        description="Gérez les rôles et permissions de votre équipe"
        columns={columns}
        data={paginatedRoles}
        loading={loading}
        totalCount={totalCount}
        pageSize={pageSize}
        currentPage={currentPage}
        searchPlaceholder="Rechercher un rôle..."
        onSearch={setSearchTerm}
        onFilter={setFilters}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        onCreate={() => setIsCreateModalOpen(true)}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onView={openViewModal}
        onRefresh={refresh}
        selectable={true}
        onSelectionChange={setSelectedRoles}
        emptyState={{
          icon: Shield,
          title: "Aucun rôle",
          description: "Commencez par créer votre premier rôle",
          action: {
            label: "Créer un rôle",
            onClick: () => setIsCreateModalOpen(true)
          }
        }}
        actions={[
          {
            label: "Gérer les permissions",
            icon: Settings,
            onClick: openPermissionsModal,
            variant: "outline"
          },
          {
            label: "Dupliquer",
            icon: Copy,
            onClick: handleDuplicateRole,
            variant: "outline"
          }
        ]}
      />

      {/* Utiliser les nouveaux formulaires depuis les pages dédiées */}

      {/* Modal de visualisation */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Détails du rôle</DialogTitle>
            <DialogDescription>
              Informations complètes du rôle et ses permissions
            </DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nom d'affichage</Label>
                  <p className="font-medium">{selectedRole.display_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nom technique</Label>
                  <p className="font-mono text-sm">{selectedRole.name}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="text-sm">{selectedRole.description || 'Aucune description'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                  <div className="flex space-x-2">
                    {selectedRole.is_system_role && (
                      <Badge variant="secondary">
                        <Shield className="h-3 w-3 mr-1" />
                        Système
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Utilisateurs</Label>
                  <p className="font-medium">0</p>
                </div>
              </div>
              
              <div>
                {(() => {
                  const rolePermissions = getRolePermissions(selectedRole.id);
                  return (
                    <>
                      <Label className="text-sm font-medium text-muted-foreground">Permissions ({rolePermissions.length})</Label>
                      <div className="mt-2 space-y-2">
                        {getPermissionCategories().map(category => {
                          const categoryPermissions = getPermissionsByCategory(category);
                          const roleCategoryPermissions = categoryPermissions.filter(p => 
                            rolePermissions.some(rp => rp.id === p.id)
                          );
                          
                          if (roleCategoryPermissions.length === 0) return null;
                          
                          return (
                            <div key={category} className="border rounded-lg p-3">
                              <h4 className="font-medium text-sm mb-2">{category}</h4>
                              <div className="flex flex-wrap gap-1">
                                {roleCategoryPermissions.map(permission => (
                                  <Badge key={permission.id} variant="outline" className="text-xs">
                                    {permission.display_name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openEditModal(selectedRole);
                  }}
                >
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openPermissionsModal(selectedRole);
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Gérer les permissions
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
              Êtes-vous sûr de vouloir supprimer le rôle "{selectedRole?.display_name}" ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedRole && handleDeleteRole(selectedRole)}
              disabled={selectedRole?.is_system_role}
            >
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de gestion des permissions */}
      <Dialog open={isPermissionsModalOpen} onOpenChange={setIsPermissionsModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gérer les permissions</DialogTitle>
            <DialogDescription>
              Sélectionnez les permissions pour le rôle "{selectedRole?.display_name}"
            </DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-4">
              {getPermissionCategories().map(category => {
                const categoryPermissions = getPermissionsByCategory(category);
                
                return (
                  <div key={category} className="border rounded-lg p-4">
                    <h3 className="font-medium mb-3">{category}</h3>
                    <div className="space-y-2">
                      {categoryPermissions.map(permission => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission.id}
                            checked={getRolePermissions(selectedRole.id).some(p => p.id === permission.id)}
                            onCheckedChange={(checked) => {
                              const currentPermissions = getRolePermissions(selectedRole.id).map(p => p.id);
                              const newPermissions = checked
                                ? [...currentPermissions, permission.id]
                                : currentPermissions.filter(p => p !== permission.id);
                              
                              // Update the role's permissions immediately in local state
                              updateRolePermissions(selectedRole.id, newPermissions);
                            }}
                            disabled={selectedRole.is_system_role}
                          />
                          <Label htmlFor={permission.id} className="flex-1">
                            <div className="font-medium">{permission.display_name}</div>
                            <div className="text-sm text-muted-foreground">{permission.description}</div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsPermissionsModalOpen(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    setIsPermissionsModalOpen(false);
                    toast.success('Permissions mises à jour');
                  }}
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Roles; 