import { useState, useEffect } from 'react';
import { UserRoleCatalogService } from '@/services/userRoleCatalogService';
import { OrganizationTypeService } from '@/services/organizationTypeService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

export const DynamicRoleTypeManager = () => {
  // User Roles
  const [userRoles, setUserRoles] = useState([]);
  const [showUserRoleModal, setShowUserRoleModal] = useState(false);
  const [editingUserRole, setEditingUserRole] = useState(null);
  const [userRoleForm, setUserRoleForm] = useState({ name: '', display_name: '', description: '' });

  // Organization Types
  const [orgTypes, setOrgTypes] = useState([]);
  const [showOrgTypeModal, setShowOrgTypeModal] = useState(false);
  const [editingOrgType, setEditingOrgType] = useState(null);
  const [orgTypeForm, setOrgTypeForm] = useState({ name: '', display_name: '', description: '' });

  useEffect(() => {
    UserRoleCatalogService.list().then(setUserRoles);
    OrganizationTypeService.list().then(setOrgTypes);
  }, []);

  // Handlers User Roles
  const handleEditUserRole = (role) => {
    setEditingUserRole(role);
    setUserRoleForm({ name: role.name, display_name: role.display_name, description: role.description || '' });
    setShowUserRoleModal(true);
  };
  const handleSaveUserRole = async () => {
    try {
      if (editingUserRole) {
        await UserRoleCatalogService.update(editingUserRole.id, userRoleForm);
        toast.success('Rôle utilisateur modifié');
      } else {
        await UserRoleCatalogService.create(userRoleForm);
        toast.success('Rôle utilisateur créé');
      }
      setShowUserRoleModal(false);
      setEditingUserRole(null);
      setUserRoleForm({ name: '', display_name: '', description: '' });
      setUserRoles(await UserRoleCatalogService.list());
    } catch (e) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };
  const handleDeleteUserRole = async (id) => {
    if (window.confirm('Supprimer ce rôle utilisateur ?')) {
      try {
        await UserRoleCatalogService.remove(id);
        setUserRoles(await UserRoleCatalogService.list());
        toast.success('Rôle utilisateur supprimé');
      } catch (e) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  // Handlers Org Types
  const handleEditOrgType = (type) => {
    setEditingOrgType(type);
    setOrgTypeForm({ name: type.name, display_name: type.display_name, description: type.description || '' });
    setShowOrgTypeModal(true);
  };
  const handleSaveOrgType = async () => {
    try {
      if (editingOrgType) {
        await OrganizationTypeService.update(editingOrgType.id, orgTypeForm);
        toast.success('Type d\'organisation modifié');
      } else {
        await OrganizationTypeService.create(orgTypeForm);
        toast.success('Type d\'organisation créé');
      }
      setShowOrgTypeModal(false);
      setEditingOrgType(null);
      setOrgTypeForm({ name: '', display_name: '', description: '' });
      setOrgTypes(await OrganizationTypeService.list());
    } catch (e) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };
  const handleDeleteOrgType = async (id) => {
    if (window.confirm('Supprimer ce type d\'organisation ?')) {
      try {
        await OrganizationTypeService.remove(id);
        setOrgTypes(await OrganizationTypeService.list());
        toast.success('Type d\'organisation supprimé');
      } catch (e) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* User Roles */}
      <div>
        <h2 className="text-xl font-bold mb-2">Rôles Utilisateur Dynamiques</h2>
        <Button onClick={() => { setEditingUserRole(null); setUserRoleForm({ name: '', display_name: '', description: '' }); setShowUserRoleModal(true); }}>
          Nouveau rôle utilisateur
        </Button>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Nom affiché</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userRoles.map(role => (
              <TableRow key={role.id}>
                <TableCell>{role.name}</TableCell>
                <TableCell>{role.display_name}</TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell className="flex gap-2">
                  <Button variant="outline" onClick={() => handleEditUserRole(role)}>Modifier</Button>
                  <Button variant="destructive" onClick={() => handleDeleteUserRole(role.id)}>Supprimer</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Dialog open={showUserRoleModal} onOpenChange={setShowUserRoleModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUserRole ? 'Modifier le rôle utilisateur' : 'Nouveau rôle utilisateur'}</DialogTitle>
            </DialogHeader>
            <Input placeholder="Nom" value={userRoleForm.name} onChange={e => setUserRoleForm({ ...userRoleForm, name: e.target.value })} className="mb-2" />
            <Input placeholder="Nom affiché" value={userRoleForm.display_name} onChange={e => setUserRoleForm({ ...userRoleForm, display_name: e.target.value })} className="mb-2" />
            <Input placeholder="Description" value={userRoleForm.description} onChange={e => setUserRoleForm({ ...userRoleForm, description: e.target.value })} className="mb-2" />
            <Button onClick={handleSaveUserRole}>{editingUserRole ? 'Enregistrer' : 'Créer'}</Button>
          </DialogContent>
        </Dialog>
      </div>
      {/* Organization Types */}
      <div>
        <h2 className="text-xl font-bold mb-2">Types d'organisation Dynamiques</h2>
        <Button onClick={() => { setEditingOrgType(null); setOrgTypeForm({ name: '', display_name: '', description: '' }); setShowOrgTypeModal(true); }}>
          Nouveau type d'organisation
        </Button>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Nom affiché</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orgTypes.map(type => (
              <TableRow key={type.id}>
                <TableCell>{type.name}</TableCell>
                <TableCell>{type.display_name}</TableCell>
                <TableCell>{type.description}</TableCell>
                <TableCell className="flex gap-2">
                  <Button variant="outline" onClick={() => handleEditOrgType(type)}>Modifier</Button>
                  <Button variant="destructive" onClick={() => handleDeleteOrgType(type.id)}>Supprimer</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Dialog open={showOrgTypeModal} onOpenChange={setShowOrgTypeModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingOrgType ? 'Modifier le type d\'organisation' : 'Nouveau type d\'organisation'}</DialogTitle>
            </DialogHeader>
            <Input placeholder="Nom" value={orgTypeForm.name} onChange={e => setOrgTypeForm({ ...orgTypeForm, name: e.target.value })} className="mb-2" />
            <Input placeholder="Nom affiché" value={orgTypeForm.display_name} onChange={e => setOrgTypeForm({ ...orgTypeForm, display_name: e.target.value })} className="mb-2" />
            <Input placeholder="Description" value={orgTypeForm.description} onChange={e => setOrgTypeForm({ ...orgTypeForm, description: e.target.value })} className="mb-2" />
            <Button onClick={handleSaveOrgType}>{editingOrgType ? 'Enregistrer' : 'Créer'}</Button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}; 