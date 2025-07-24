import { useState, useEffect } from "react";
import { useRBAC } from "@/hooks/useRBAC";
import { Role, UserRole } from "@/types/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Users,
  Shield,
  ShieldCheck,
  ShieldX,
  Save,
  RefreshCw,
  UserPlus,
  UserMinus,
  Calendar,
  Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface UserRoleManagerProps {
  userId: string;
  userName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRolesChange?: (roleIds: string[]) => void;
}

export const UserRoleManager = ({
  userId,
  userName,
  open,
  onOpenChange,
  onRolesChange
}: UserRoleManagerProps) => {
  const { 
    roles, 
    userRoles, 
    updateUserRoles, 
    loading, 
    error 
  } = useRBAC();

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Récupérer les rôles actuels de l'utilisateur
  useEffect(() => {
    if (userId && userRoles.length > 0) {
      const userRoleIds = userRoles
        .filter(ur => ur.user_id === userId && ur.is_active)
        .map(ur => ur.role_id);
      setSelectedRoles(userRoleIds);
    }
  }, [userId, userRoles]);

  // Filtrer les rôles selon la recherche
  const filteredRoles = roles.filter(role => 
    role.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Grouper les rôles par type (système vs personnalisé)
  const systemRoles = filteredRoles.filter(role => role.is_system);
  const customRoles = filteredRoles.filter(role => !role.is_system);

  // Gérer la sélection/désélection d'un rôle
  const handleRoleToggle = (roleId: string, checked: boolean) => {
    if (checked) {
      setSelectedRoles(prev => [...prev, roleId]);
    } else {
      setSelectedRoles(prev => prev.filter(id => id !== roleId));
    }
  };

  // Sauvegarder les rôles
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await updateUserRoles(userId, selectedRoles);
      if (success) {
        onRolesChange?.(selectedRoles);
        onOpenChange(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Réinitialiser les rôles
  const handleReset = () => {
    const currentUserRoleIds = userRoles
      .filter(ur => ur.user_id === userId && ur.is_active)
      .map(ur => ur.role_id);
    setSelectedRoles(currentUserRoleIds);
  };

  // Obtenir les informations d'un rôle utilisateur
  const getUserRoleInfo = (roleId: string) => {
    return userRoles.find(ur => ur.user_id === userId && ur.role_id === roleId);
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Gérer les rôles utilisateur</span>
          </DialogTitle>
          <DialogDescription>
            {userName ? `Rôles pour l'utilisateur "${userName}"` : "Sélectionnez les rôles"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Barre de recherche */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des rôles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Total</p>
                    <p className="text-2xl font-bold">{roles.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Sélectionnés</p>
                    <p className="text-2xl font-bold">{selectedRoles.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <ShieldX className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Non sélectionnés</p>
                    <p className="text-2xl font-bold">{roles.length - selectedRoles.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Système</p>
                    <p className="text-2xl font-bold">{systemRoles.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rôles système */}
          {systemRoles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Rôles système</span>
                  <Badge variant="secondary">{systemRoles.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {systemRoles.map(role => {
                    const userRoleInfo = getUserRoleInfo(role.id);
                    const isSelected = selectedRoles.includes(role.id);
                    
                    return (
                      <div key={role.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => 
                            handleRoleToggle(role.id, checked as boolean)
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <Label className="font-medium text-sm">
                              {role.display_name}
                            </Label>
                            <Badge variant="secondary" className="text-xs">
                              Système
                            </Badge>
                            {role.is_default && (
                              <Badge variant="outline" className="text-xs">
                                Par défaut
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {role.description || 'Aucune description'}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{role.user_count || 0} utilisateurs</span>
                            </div>
                            {userRoleInfo && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>Attribué le {formatDate(userRoleInfo.granted_at)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rôles personnalisés */}
          {customRoles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Rôles personnalisés</span>
                  <Badge variant="outline">{customRoles.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {customRoles.map(role => {
                    const userRoleInfo = getUserRoleInfo(role.id);
                    const isSelected = selectedRoles.includes(role.id);
                    
                    return (
                      <div key={role.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => 
                            handleRoleToggle(role.id, checked as boolean)
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <Label className="font-medium text-sm">
                              {role.display_name}
                            </Label>
                            <Badge variant="outline" className="text-xs">
                              Personnalisé
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {role.description || 'Aucune description'}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{role.user_count || 0} utilisateurs</span>
                            </div>
                            {userRoleInfo && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>Attribué le {formatDate(userRoleInfo.granted_at)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Aucun rôle trouvé */}
          {filteredRoles.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun rôle trouvé</h3>
                <p className="text-muted-foreground">
                  Aucun rôle ne correspond à votre recherche.
                </p>
              </CardContent>
            </Card>
          )}

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