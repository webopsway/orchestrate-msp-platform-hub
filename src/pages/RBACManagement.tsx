import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useRBAC } from "@/hooks/useRBAC";
import { RBACGuard, RoleGuard } from "@/components/rbac/RBACGuard";
import { PermissionManager } from "@/components/rbac/PermissionManager";
import { UserRoleManager } from "@/components/rbac/UserRoleManager";
import { CRUDTable } from "@/components/common/CRUDTable";
// import { CRUDForm } from "@/components/common/CRUDForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Users, 
  Lock, 
  Settings, 
  BarChart3,
  Eye,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { toast } from "sonner";
import { Role, Permission, SYSTEM_ROLES } from "@/types/rbac";

const RBACManagement = () => {
  const { sessionContext } = useAuth();
  const { 
    roles, 
    permissions, 
    userRoles, 
    rolePermissions,
    loading,
    error,
    checkPermission,
    hasRole,
    assignRole,
    revokeRole,
    updateRolePermissions,
    refresh
  } = useRBAC();

  // États pour les modals
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isUserRoleModalOpen, setIsUserRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // États pour les données
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

  // Statistiques RBAC
  const stats = [
    {
      title: "Rôles",
      value: roles.length.toString(),
      icon: Shield,
      color: "text-blue-500",
      description: "Total des rôles"
    },
    {
      title: "Permissions",
      value: permissions.length.toString(),
      icon: Lock,
      color: "text-green-500",
      description: "Total des permissions"
    },
    {
      title: "Utilisateurs avec rôles",
      value: new Set(userRoles.map(ur => ur.user_id)).size.toString(),
      icon: Users,
      color: "text-purple-500",
      description: "Utilisateurs actifs"
    },
    {
      title: "Attributions",
      value: userRoles.filter(ur => ur.is_active).length.toString(),
      icon: Settings,
      color: "text-orange-500",
      description: "Rôles attribués"
    }
  ];

  // Permissions par catégorie
  const permissionsByCategory = permissions.reduce((acc, permission) => {
    const category = permission.resource || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({
      ...permission,
      category: permission.resource || 'General',
      description: permission.description || '',
      is_system: permission.is_system || false,
      updated_at: permission.updated_at || permission.created_at
    });
    return acc;
  }, {} as Record<string, Permission[]>);

  // Rôles par type
  const systemRoles = roles.filter(role => role.is_system);
  const customRoles = roles.filter(role => !role.is_system);

  // Utilisateurs par rôle
  const usersByRole = roles.map(role => {
    const roleUsers = userRoles.filter(ur => ur.role_id === role.id && ur.is_active);
    return {
      ...role,
      userCount: roleUsers.length,
      users: roleUsers
    };
  });

  // Colonnes pour le tableau des rôles
  const roleColumns = [
    {
      key: 'display_name',
      label: 'Rôle',
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
      render: (value: any, row: Role) => {
        const rolePerms = rolePermissions.filter(rp => rp.role_id === row.id && rp.granted);
        const permissionNames = rolePerms.map(rp => {
          const perm = permissions.find(p => p.id === rp.permission_id);
          return perm?.display_name || rp.permission_id;
        });

        return (
          <div className="space-y-1">
            <p className="text-sm font-medium">{rolePerms.length} permissions</p>
            <div className="flex flex-wrap gap-1">
              {permissionNames.slice(0, 3).map((name, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {name}
                </Badge>
              ))}
              {permissionNames.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{permissionNames.length - 3} autres
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
      type: 'custom' as const,
      sortable: true,
      render: (value: any, row: Role) => {
        const roleUsers = userRoles.filter(ur => ur.role_id === row.id && ur.is_active);
        return (
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{roleUsers.length}</span>
          </div>
        );
      }
    },
    {
      key: 'created_at',
      label: 'Créé le',
      type: 'date' as const,
      sortable: true,
      render: (value: any, row: Role) => new Date(row.created_at).toLocaleDateString()
    }
  ];

  // Champs pour le formulaire de rôle
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

  // Ouvrir le modal de gestion des permissions
  const openPermissionModal = (role: Role) => {
    setSelectedRole(role);
    setIsPermissionModalOpen(true);
  };

  // Ouvrir le modal de gestion des rôles utilisateur
  const openUserRoleModal = (userId: string) => {
    setSelectedUserId(userId);
    setIsUserRoleModalOpen(true);
  };

  // Créer un nouveau rôle
  const createRole = async (data: any) => {
    if (!sessionContext?.current_team_id) return;

    try {
      const roleData = {
        team_id: sessionContext?.current_team_id,
        name: data.name.toLowerCase().replace(/\s+/g, '_'),
        display_name: data.display_name,
        description: data.description,
        is_system: false,
        is_default: false,
        permissions: []
      };

      const { data: newRole, error } = await supabase
        .from('roles')
        .insert([roleData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Rôle créé avec succès');
      refresh();
    } catch (error: any) {
      console.error('Error creating role:', error);
      toast.error('Erreur lors de la création');
    }
  };

  // Mettre à jour un rôle
  const updateRole = async (data: any) => {
    if (!selectedRole) return;

    try {
      const updateData = {
        display_name: data.display_name,
        description: data.description,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('roles')
        .update(updateData)
        .eq('id', selectedRole.id);

      if (error) throw error;

      toast.success('Rôle mis à jour avec succès');
      refresh();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Supprimer un rôle
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
      refresh();
    } catch (error: any) {
      console.error('Error deleting role:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec permissions */}
      <RBACGuard resource="roles" action="read">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestion RBAC</h1>
            <p className="text-muted-foreground">
              Gestion des rôles, permissions et attributions utilisateur
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={refresh} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <RBACGuard resource="roles" action="create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau rôle
              </Button>
            </RBACGuard>
          </div>
        </div>
      </RBACGuard>

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
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="roles">Rôles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="matrix">Matrice</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rôles système */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Rôles système</span>
                  <Badge variant="secondary">{systemRoles.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemRoles.map(role => (
                    <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{role.display_name}</p>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {userRoles.filter(ur => ur.role_id === role.id && ur.is_active).length} utilisateurs
                        </Badge>
                        <RBACGuard resource="roles" action="update">
                          <Button variant="ghost" size="sm" onClick={() => openPermissionModal({
                            ...role,
                            team_id: sessionContext?.current_team_id || '',
                            permissions: [],
                            is_system: role.is_system || false,
                            is_default: role.is_default || false,
                            user_count: userRoles.filter(ur => ur.role_id === role.id && ur.is_active).length
                          })}>
                            <Settings className="h-4 w-4" />
                          </Button>
                        </RBACGuard>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Permissions par catégorie */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5" />
                  <span>Permissions par catégorie</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(permissionsByCategory).map(([category, perms]) => (
                    <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{category}</p>
                        <p className="text-sm text-muted-foreground">{perms.length} permissions</p>
                      </div>
                      <Badge variant="outline">{perms.length}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Gestion des rôles */}
        <TabsContent value="roles" className="space-y-6">
          <RBACGuard resource="roles" action="read">
            <CRUDTable
              title="Gestion des rôles"
              description="Gérez les rôles et leurs permissions"
              columns={roleColumns}
              data={roles}
              loading={loading}
              searchPlaceholder="Rechercher un rôle..."
              onSearch={setSearchTerm}
              onRefresh={refresh}
              emptyState={{
                icon: Shield,
                title: "Aucun rôle",
                description: "Commencez par créer votre premier rôle",
                action: {
                  label: "Créer un rôle",
                  onClick: () => {/* Ouvrir modal création */}
                }
              }}
              actions={[
                {
                  label: "Gérer les permissions",
                  icon: Settings,
                  onClick: openPermissionModal,
                  variant: "outline"
                }
              ]}
            />
          </RBACGuard>
        </TabsContent>

        {/* Gestion des permissions */}
        <TabsContent value="permissions" className="space-y-6">
          <RBACGuard resource="permissions" action="read">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(permissionsByCategory).map(([category, perms]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{category}</span>
                      <Badge variant="outline">{perms.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {perms.map(permission => (
                        <div key={permission.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="text-sm font-medium">{permission.display_name}</p>
                            <p className="text-xs text-muted-foreground">{permission.description}</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Badge variant="outline" className="text-xs">
                              {permission.resource}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {permission.action}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </RBACGuard>
        </TabsContent>

        {/* Gestion des utilisateurs */}
        <TabsContent value="users" className="space-y-6">
          <RBACGuard resource="users" action="read">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Attributions de rôles</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usersByRole.map(role => (
                    <div key={role.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{role.display_name}</h3>
                          <Badge variant="outline">{role.userCount} utilisateurs</Badge>
                        </div>
                        <RBACGuard resource="users" action="update">
                          <Button variant="outline" size="sm">
                            <Users className="h-4 w-4 mr-2" />
                            Gérer les utilisateurs
                          </Button>
                        </RBACGuard>
                      </div>
                      {role.users.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {role.users.slice(0, 6).map(userRole => (
                            <div key={userRole.id} className="flex items-center space-x-2 p-2 bg-muted rounded">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Utilisateur {userRole.user_id}</span>
                            </div>
                          ))}
                          {role.users.length > 6 && (
                            <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                              <span className="text-sm text-muted-foreground">
                                +{role.users.length - 6} autres
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </RBACGuard>
        </TabsContent>

        {/* Matrice RBAC */}
        <TabsContent value="matrix" className="space-y-6">
          <RBACGuard resource="roles" action="read">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Matrice des permissions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border p-2 text-left">Rôle</th>
                        {Object.keys(permissionsByCategory).map(category => (
                          <th key={category} className="border p-2 text-center">
                            {category}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map(role => (
                        <tr key={role.id}>
                          <td className="border p-2 font-medium">{role.display_name}</td>
                          {Object.keys(permissionsByCategory).map(category => {
                            const categoryPermissions = permissionsByCategory[category];
                            const rolePerms = rolePermissions.filter(rp => 
                              rp.role_id === role.id && rp.granted
                            );
                            const hasCategoryPermissions = categoryPermissions.some(perm =>
                              rolePerms.some(rp => rp.permission_id === perm.id)
                            );
                            
                            return (
                              <td key={category} className="border p-2 text-center">
                                {hasCategoryPermissions ? (
                                  <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </RBACGuard>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {selectedRole && (
        <PermissionManager
          roleId={selectedRole.id}
          role={selectedRole}
          open={isPermissionModalOpen}
          onOpenChange={setIsPermissionModalOpen}
          onPermissionsChange={(permissionIds) => {
            toast.success('Permissions mises à jour');
            refresh();
          }}
        />
      )}

      <UserRoleManager
        userId={selectedUserId}
        open={isUserRoleModalOpen}
        onOpenChange={setIsUserRoleModalOpen}
        onRolesChange={(roleIds) => {
          toast.success('Rôles mis à jour');
          refresh();
        }}
      />
    </div>
  );
};

export default RBACManagement; 