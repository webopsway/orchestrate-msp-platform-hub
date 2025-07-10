import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CRUDTable } from "@/components/common/CRUDTable";
import { CRUDForm } from "@/components/common/CRUDForm";
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

interface Role {
  id: string;
  team_id: string;
  name: string;
  display_name: string;
  description?: string;
  permissions: string[];
  is_system: boolean;
  is_default: boolean;
  user_count: number;
  created_at: string;
  updated_at: string;
}

interface Permission {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category: string;
  is_system: boolean;
}

const Roles = () => {
  const { sessionContext } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
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
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
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

  useEffect(() => {
    fetchData();
  }, [sessionContext, currentPage, pageSize, searchTerm, filters]);

  const fetchData = async () => {
    if (!sessionContext?.current_team_id) return;

    try {
      setLoading(true);
      
      // Récupérer les rôles avec pagination
      let query = supabase
        .from('roles')
        .select('*', { count: 'exact' });

      // Appliquer les filtres
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`);
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

      const { data: rolesData, error: rolesError, count } = await query;

      if (rolesError) throw rolesError;
      
      // Transform data to match interface
      const transformedRoles = (rolesData || []).map(role => ({
        ...role,
        team_id: sessionContext.current_team_id,
        permissions: [],
        is_system: role.is_system_role || false,
        is_default: false,
        user_count: 0
      }));
      
      setRoles(transformedRoles);
      setTotalCount(count || 0);

      // Récupérer les permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permissions')
        .select('*')
        .order('category', { ascending: true })
        .order('display_name', { ascending: true });

      if (permissionsError) throw permissionsError;
      
      // Transform data to match interface
      const transformedPermissions = (permissionsData || []).map(permission => ({
        ...permission,
        category: permission.resource || 'General',
        description: permission.description || '',
        is_system: false
      }));
      
      setPermissions(transformedPermissions);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Erreur lors du chargement des rôles');
    } finally {
      setLoading(false);
    }
  };

  const createRole = async (data: any) => {
    if (!sessionContext?.current_team_id) return;

    try {
      setLoading(true);
      
      const roleData = {
        team_id: sessionContext.current_team_id,
        name: data.name.toLowerCase().replace(/\s+/g, '_'),
        display_name: data.display_name,
        description: data.description,
        permissions: data.permissions || [],
        is_system: false,
        is_default: false
      };
      
      const { data: newRole, error } = await supabase
        .from('roles')
        .insert([roleData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Rôle créé avec succès');
      setIsCreateModalOpen(false);
      resetNewRoleForm();
      fetchData();
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (data: any) => {
    if (!selectedRole) return;

    try {
      setLoading(true);
      
      const updateData = {
        display_name: data.display_name,
        description: data.description,
        permissions: data.permissions || [],
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('roles')
        .update(updateData)
        .eq('id', selectedRole.id);

      if (error) throw error;

      toast.success('Rôle mis à jour avec succès');
      setIsEditModalOpen(false);
      resetEditRoleForm();
      fetchData();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const deleteRole = async (role: Role) => {
    if (role.is_system) {
      toast.error('Impossible de supprimer un rôle système');
      return;
    }

    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', role.id);

      if (error) throw error;

      toast.success('Rôle supprimé');
      setIsDeleteModalOpen(false);
      setSelectedRole(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const duplicateRole = async (role: Role) => {
    if (!sessionContext?.current_team_id) return;

    try {
      setLoading(true);
      
      const newRoleData = {
        team_id: sessionContext.current_team_id,
        name: `${role.name}_copy`,
        display_name: `${role.display_name} (Copie)`,
        description: role.description,
        permissions: role.permissions,
        is_system: false,
        is_default: false
      };
      
      const { data: newRole, error } = await supabase
        .from('roles')
        .insert([newRoleData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Rôle dupliqué avec succès');
      fetchData();
    } catch (error) {
      console.error('Error duplicating role:', error);
      toast.error('Erreur lors de la duplication');
    } finally {
      setLoading(false);
    }
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

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setEditRole({
      name: role.name,
      display_name: role.display_name,
      description: role.description || "",
      permissions: role.permissions || []
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (role: Role) => {
    setSelectedRole(role);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteModalOpen(true);
  };

  const openPermissionsModal = (role: Role) => {
    setSelectedRole(role);
    setIsPermissionsModalOpen(true);
  };

  const getPermissionCategories = () => {
    const categories = [...new Set(permissions.map(p => p.category))];
    return categories.sort();
  };

  const getPermissionsByCategory = (category: string) => {
    return permissions.filter(p => p.category === category);
  };

  const columns = [
    {
      key: 'display_name',
      label: 'Nom du rôle',
      type: 'custom' as const,
      sortable: true,
      filterable: true,
      render: (value: any, row: Role) => (
        <div>
          <div className="flex items-center space-x-2">
            <p className="font-medium">{row.display_name}</p>
            {row.is_system && (
              <Badge variant="secondary" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Système
              </Badge>
            )}
            {row.is_default && (
              <Badge variant="outline" className="text-xs">
                Par défaut
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
      render: (value: any, row: Role) => (
        <div className="space-y-1">
          <p className="text-sm font-medium">{row.permissions?.length || 0} permissions</p>
          <div className="flex flex-wrap gap-1">
            {row.permissions?.slice(0, 3).map((perm: string) => {
              const permission = permissions.find(p => p.name === perm);
              return (
                <Badge key={perm} variant="outline" className="text-xs">
                  {permission?.display_name || perm}
                </Badge>
              );
            })}
            {row.permissions?.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{row.permissions.length - 3} autres
              </Badge>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'user_count',
      label: 'Utilisateurs',
      type: 'number' as const,
      sortable: true,
      render: (value: any, row: Role) => (
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{row.user_count || 0}</span>
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Créé le',
      type: 'date' as const,
      sortable: true,
      render: (value: any, row: Role) => new Date(row.created_at).toLocaleDateString()
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
      value: totalCount.toString(),
      icon: Shield,
      color: "text-blue-500"
    },
    {
      title: "Rôles système",
      value: roles.filter(r => r.is_system).length.toString(),
      icon: ShieldCheck,
      color: "text-green-500"
    },
    {
      title: "Rôles personnalisés",
      value: roles.filter(r => !r.is_system).length.toString(),
      icon: Settings,
      color: "text-purple-500"
    },
    {
      title: "Permissions disponibles",
      value: permissions.length.toString(),
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
        data={roles}
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
        onRefresh={fetchData}
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
            onClick: duplicateRole,
            variant: "outline"
          }
        ]}
      />

      {/* Modal de création */}
      <CRUDForm
        title="Nouveau rôle"
        description="Créez un nouveau rôle avec des permissions spécifiques"
        fields={roleFields}
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={createRole}
        mode="create"
        validation={(data) => {
          const errors: Record<string, string> = {};
          
          if (data.name && !/^[a-z_]+$/.test(data.name)) {
            errors.name = 'Le nom technique ne doit contenir que des lettres minuscules et des underscores';
          }
          
          if (data.name && roles.some(r => r.name === data.name)) {
            errors.name = 'Ce nom technique existe déjà';
          }
          
          return {
            isValid: Object.keys(errors).length === 0,
            errors
          };
        }}
      />

      {/* Modal d'édition */}
      <CRUDForm
        title="Modifier le rôle"
        description="Modifiez les informations du rôle"
        fields={roleFields}
        data={editRole}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSubmit={updateRole}
        mode="edit"
      />

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
                    {selectedRole.is_system && (
                      <Badge variant="secondary">
                        <Shield className="h-3 w-3 mr-1" />
                        Système
                      </Badge>
                    )}
                    {selectedRole.is_default && (
                      <Badge variant="outline">
                        Par défaut
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Utilisateurs</Label>
                  <p className="font-medium">{selectedRole.user_count || 0}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Permissions ({selectedRole.permissions?.length || 0})</Label>
                <div className="mt-2 space-y-2">
                  {getPermissionCategories().map(category => {
                    const categoryPermissions = getPermissionsByCategory(category);
                    const rolePermissions = categoryPermissions.filter(p => 
                      selectedRole.permissions?.includes(p.name)
                    );
                    
                    if (rolePermissions.length === 0) return null;
                    
                    return (
                      <div key={category} className="border rounded-lg p-3">
                        <h4 className="font-medium text-sm mb-2">{category}</h4>
                        <div className="flex flex-wrap gap-1">
                          {rolePermissions.map(permission => (
                            <Badge key={permission.name} variant="outline" className="text-xs">
                              {permission.display_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
              {selectedRole?.user_count > 0 && (
                <span className="block mt-2 text-red-600">
                  Attention : {selectedRole.user_count} utilisateur(s) utilisent ce rôle.
                </span>
              )}
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedRole && deleteRole(selectedRole)}
              disabled={selectedRole?.is_system}
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
                        <div key={permission.name} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission.name}
                            checked={selectedRole.permissions?.includes(permission.name)}
                            onCheckedChange={(checked) => {
                              const newPermissions = checked
                                ? [...(selectedRole.permissions || []), permission.name]
                                : (selectedRole.permissions || []).filter(p => p !== permission.name);
                              
                              setSelectedRole({
                                ...selectedRole,
                                permissions: newPermissions
                              });
                            }}
                            disabled={selectedRole.is_system}
                          />
                          <Label htmlFor={permission.name} className="flex-1">
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
                  onClick={async () => {
                    try {
                      const { error } = await supabase
                        .from('roles')
                        .update({
                          permissions: selectedRole.permissions,
                          updated_at: new Date().toISOString()
                        })
                        .eq('id', selectedRole.id);

                      if (error) throw error;

                      toast.success('Permissions mises à jour');
                      setIsPermissionsModalOpen(false);
                      fetchData();
                    } catch (error) {
                      console.error('Error updating permissions:', error);
                      toast.error('Erreur lors de la mise à jour des permissions');
                    }
                  }}
                >
                  Sauvegarder
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