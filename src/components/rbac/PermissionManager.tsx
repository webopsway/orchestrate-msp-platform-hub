import { useState, useEffect } from "react";
import { useRBAC } from "@/hooks/useRBAC";
import { Permission, Role } from "@/types/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Search,
  Shield,
  ShieldCheck,
  ShieldX,
  Save,
  RefreshCw,
  Filter,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface PermissionManagerProps {
  roleId?: string;
  role?: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPermissionsChange?: (permissionIds: string[]) => void;
}

export const PermissionManager = ({
  roleId,
  role,
  open,
  onOpenChange,
  onPermissionsChange
}: PermissionManagerProps) => {
  const { 
    permissions, 
    rolePermissions, 
    updateRolePermissions, 
    loading, 
    error 
  } = useRBAC();

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isSaving, setIsSaving] = useState(false);

  // Récupérer les permissions actuelles du rôle
  useEffect(() => {
    if (roleId && rolePermissions.length > 0) {
      const rolePerms = rolePermissions
        .filter(rp => rp.role_id === roleId && rp.granted)
        .map(rp => rp.permission_id);
      setSelectedPermissions(rolePerms);
    } else if (role?.permissions) {
      setSelectedPermissions(role.permissions);
    }
  }, [roleId, role, rolePermissions]);

  // Grouper les permissions par catégorie
  const permissionsByCategory = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Filtrer les permissions selon la recherche et la catégorie
  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = permission.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || permission.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Gérer la sélection/désélection d'une permission
  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId]);
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== permissionId));
    }
  };

  // Gérer la sélection/désélection de toutes les permissions d'une catégorie
  const handleCategoryToggle = (category: string, checked: boolean) => {
    const categoryPermissions = permissionsByCategory[category] || [];
    const categoryPermissionIds = categoryPermissions.map(p => p.id);
    
    if (checked) {
      setSelectedPermissions(prev => [
        ...prev.filter(id => !categoryPermissionIds.includes(id)),
        ...categoryPermissionIds
      ]);
    } else {
      setSelectedPermissions(prev => 
        prev.filter(id => !categoryPermissionIds.includes(id))
      );
    }
  };

  // Sauvegarder les permissions
  const handleSave = async () => {
    if (!roleId) return;

    setIsSaving(true);
    try {
      const success = await updateRolePermissions(roleId, selectedPermissions);
      if (success) {
        onPermissionsChange?.(selectedPermissions);
        onOpenChange(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Réinitialiser les permissions
  const handleReset = () => {
    if (role?.permissions) {
      setSelectedPermissions(role.permissions);
    }
  };

  // Vérifier si toutes les permissions d'une catégorie sont sélectionnées
  const isCategoryFullySelected = (category: string) => {
    const categoryPermissions = permissionsByCategory[category] || [];
    const categoryPermissionIds = categoryPermissions.map(p => p.id);
    return categoryPermissionIds.every(id => selectedPermissions.includes(id));
  };

  // Vérifier si certaines permissions d'une catégorie sont sélectionnées
  const isCategoryPartiallySelected = (category: string) => {
    const categoryPermissions = permissionsByCategory[category] || [];
    const categoryPermissionIds = categoryPermissions.map(p => p.id);
    const selectedInCategory = categoryPermissionIds.filter(id => selectedPermissions.includes(id));
    return selectedInCategory.length > 0 && selectedInCategory.length < categoryPermissionIds.length;
  };

  const categories = Object.keys(permissionsByCategory).sort();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Gérer les permissions</span>
          </DialogTitle>
          <DialogDescription>
            {role ? `Permissions pour le rôle "${role.display_name}"` : "Sélectionnez les permissions"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Barre de recherche et filtres */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des permissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">Toutes les catégories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Total</p>
                    <p className="text-2xl font-bold">{permissions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Sélectionnées</p>
                    <p className="text-2xl font-bold">{selectedPermissions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <ShieldX className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Non sélectionnées</p>
                    <p className="text-2xl font-bold">{permissions.length - selectedPermissions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Permissions par catégorie */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">Toutes</TabsTrigger>
              {categories.slice(0, 5).map(category => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              {categories.map(category => (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={isCategoryFullySelected(category)}
                          ref={(el) => {
                            if (el) {
                              const input = el.querySelector('input');
                              if (input) {
                                input.indeterminate = isCategoryPartiallySelected(category);
                              }
                            }
                          }}
                          onCheckedChange={(checked) => 
                            handleCategoryToggle(category, checked as boolean)
                          }
                        />
                        <Label className="font-medium">{category}</Label>
                        <Badge variant="outline">
                          {permissionsByCategory[category].length}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {permissionsByCategory[category]
                        .filter(permission => 
                          searchTerm === "" || 
                          permission.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          permission.description.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map(permission => (
                          <div key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                            <Checkbox
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={(checked) => 
                                handlePermissionToggle(permission.id, checked as boolean)
                              }
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <Label className="font-medium text-sm">
                                  {permission.display_name}
                                </Label>
                                {permission.is_system && (
                                  <Badge variant="secondary" className="text-xs">
                                    Système
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {permission.description}
                              </p>
                              <div className="flex items-center space-x-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {permission.resource}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {permission.action}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            
            {categories.slice(0, 5).map(category => (
              <TabsContent key={category} value={category} className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={isCategoryFullySelected(category)}
                          ref={(el) => {
                            if (el) {
                              const input = el.querySelector('input');
                              if (input) {
                                input.indeterminate = isCategoryPartiallySelected(category);
                              }
                            }
                          }}
                          onCheckedChange={(checked) => 
                            handleCategoryToggle(category, checked as boolean)
                          }
                        />
                        <Label className="font-medium">{category}</Label>
                        <Badge variant="outline">
                          {permissionsByCategory[category].length}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {permissionsByCategory[category]
                        .filter(permission => 
                          searchTerm === "" || 
                          permission.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          permission.description.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map(permission => (
                          <div key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                            <Checkbox
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={(checked) => 
                                handlePermissionToggle(permission.id, checked as boolean)
                              }
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <Label className="font-medium text-sm">
                                  {permission.display_name}
                                </Label>
                                {permission.is_system && (
                                  <Badge variant="secondary" className="text-xs">
                                    Système
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {permission.description}
                              </p>
                              <div className="flex items-center space-x-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {permission.resource}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {permission.action}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleReset} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving || loading}
                className="min-w-[120px]"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 