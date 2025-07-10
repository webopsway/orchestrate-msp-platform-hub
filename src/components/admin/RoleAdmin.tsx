import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useRoleManagement } from '@/hooks/useRoleManagement';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Shield, Users, Settings, Trash2, Calendar, Building, Users2 } from 'lucide-react';
import { toast } from 'sonner';

export const RoleAdmin = () => {
  const { sessionContext } = useAuth();
  const { roles, permissions, userRoles, rolePermissions, loading, error, assignRole, revokeRole, refreshData } = useRoleManagement();
  
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  
  const [assignForm, setAssignForm] = useState({
    userId: '',
    roleId: '',
    teamId: '',
    organizationId: '',
    expiresAt: ''
  });

  // Check if user is MSP admin
  const isMspAdmin = sessionContext?.is_msp || false;

  useEffect(() => {
    fetchUsers();
    fetchTeams();
    fetchOrganizations();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .order('email');
    
    if (error) {
      console.error('Failed to fetch users:', error);
    } else {
      setUsers(data || []);
    }
  };

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, organization_id')
      .order('name');
    
    if (error) {
      console.error('Failed to fetch teams:', error);
    } else {
      setTeams(data || []);
    }
  };

  const fetchOrganizations = async () => {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name')
      .order('name');
    
    if (error) {
      console.error('Failed to fetch organizations:', error);
    } else {
      setOrganizations(data || []);
    }
  };

  const handleAssignRole = async () => {
    if (!assignForm.userId || !assignForm.roleId) {
      toast.error('Utilisateur et rôle requis');
      return;
    }

    const success = await assignRole(
      assignForm.userId,
      assignForm.roleId,
      assignForm.teamId || undefined,
      assignForm.organizationId || undefined,
      assignForm.expiresAt || undefined
    );

    if (success) {
      setShowAssignDialog(false);
      setAssignForm({
        userId: '',
        roleId: '',
        teamId: '',
        organizationId: '',
        expiresAt: ''
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getRolePermissionCount = (roleId: string) => {
    return rolePermissions[roleId]?.length || 0;
  };

  if (!isMspAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Administration des Rôles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Accès réservé aux administrateurs MSP. Contactez votre administrateur pour gérer les rôles.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Administration des Rôles et Permissions
          </CardTitle>
          <CardDescription>
            Gérez les rôles utilisateur et leurs permissions dans le système
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="user-roles" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="user-roles" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Rôles Utilisateur
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Rôles Système
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="mapping" className="flex items-center gap-2">
            <Users2 className="h-4 w-4" />
            Mapping
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user-roles">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Rôles Utilisateur Assignés</CardTitle>
                <CardDescription>
                  Gérez les rôles assignés aux utilisateurs
                </CardDescription>
              </div>
              <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Assigner un Rôle
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Assigner un Rôle</DialogTitle>
                    <DialogDescription>
                      Assignez un rôle à un utilisateur avec un contexte optionnel
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="user">Utilisateur</Label>
                      <Select value={assignForm.userId} onValueChange={(value) => setAssignForm({...assignForm, userId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un utilisateur" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.email} {user.first_name && user.last_name && `(${user.first_name} ${user.last_name})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="role">Rôle</Label>
                      <Select value={assignForm.roleId} onValueChange={(value) => setAssignForm({...assignForm, roleId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.display_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="organization">Organisation (optionnel)</Label>
                      <Select value={assignForm.organizationId} onValueChange={(value) => setAssignForm({...assignForm, organizationId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une organisation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Aucune organisation</SelectItem>
                          {organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="team">Équipe (optionnel)</Label>
                      <Select value={assignForm.teamId} onValueChange={(value) => setAssignForm({...assignForm, teamId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une équipe" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Aucune équipe</SelectItem>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="expires">Date d'expiration (optionnel)</Label>
                      <Input
                        id="expires"
                        type="datetime-local"
                        value={assignForm.expiresAt}
                        onChange={(e) => setAssignForm({...assignForm, expiresAt: e.target.value})}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button onClick={handleAssignRole} disabled={loading} className="flex-1">
                        Assigner
                      </Button>
                      <Button variant="outline" onClick={() => setShowAssignDialog(false)} className="flex-1">
                        Annuler
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Contexte</TableHead>
                    <TableHead>Assigné le</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userRoles.map((userRole) => (
                    <TableRow key={userRole.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{userRole.user.email}</div>
                          {userRole.user.first_name && userRole.user.last_name && (
                            <div className="text-sm text-muted-foreground">
                              {userRole.user.first_name} {userRole.user.last_name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={userRole.role.is_system_role ? 'default' : 'secondary'}>
                          {userRole.role.display_name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {userRole.organization && (
                            <div className="flex items-center gap-1 text-sm">
                              <Building className="h-3 w-3" />
                              {userRole.organization.name}
                            </div>
                          )}
                          {userRole.team && (
                            <div className="flex items-center gap-1 text-sm">
                              <Users2 className="h-3 w-3" />
                              {userRole.team.name}
                            </div>
                          )}
                          {!userRole.organization && !userRole.team && (
                            <span className="text-sm text-muted-foreground">Global</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(userRole.granted_at)}</TableCell>
                      <TableCell>
                        {userRole.expires_at ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {formatDate(userRole.expires_at)}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Permanent</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revokeRole(userRole.id)}
                          disabled={loading}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Révoquer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Rôles Système</CardTitle>
              <CardDescription>
                Liste des rôles disponibles dans le système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Permissions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.display_name}</TableCell>
                      <TableCell>{role.description}</TableCell>
                      <TableCell>
                        <Badge variant={role.is_system_role ? 'default' : 'secondary'}>
                          {role.is_system_role ? 'Système' : 'Personnalisé'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getRolePermissionCount(role.id)} permissions
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Permissions Système</CardTitle>
              <CardDescription>
                Permissions organisées par ressource
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(permissions).map(([resource, perms]) => (
                  <div key={resource}>
                    <h3 className="text-lg font-semibold mb-3 capitalize">{resource}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {perms.map((permission) => (
                        <Card key={permission.id}>
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {permission.action}
                                </Badge>
                                <span className="font-medium text-sm">{permission.display_name}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{permission.description}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapping">
          <Card>
            <CardHeader>
              <CardTitle>Mapping Rôles → Permissions</CardTitle>
              <CardDescription>
                Vue d'ensemble des permissions par rôle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {roles.map((role) => (
                  <div key={role.id}>
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant={role.is_system_role ? 'default' : 'secondary'}>
                        {role.display_name}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {getRolePermissionCount(role.id)} permissions
                      </span>
                    </div>
                    
                    {rolePermissions[role.id] && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
                        {rolePermissions[role.id].map((permission) => (
                          <Badge key={permission.id} variant="outline" className="text-xs">
                            {permission.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <Separator />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};