import { CRUDTable } from "@/components/common/CRUDTable";
import { PageHeader } from "@/components/common/PageHeader";
import { UserForm } from "@/components/forms/UserForm";
import { Button } from "@/components/ui/button";
import { useUsers } from "@/hooks/useUsers";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@/types/user";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

interface Role {
  id: string;
  name: string;
  display_name: string;
}

const NewUsers = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);

  const {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    refresh
  } = useUsers();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleSubmit = async (data: any) => {
    const userData = {
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      role: data.role,
      organization_id: data.organization_id,
      team_id: data.team_id,
      department: data.department,
      position: data.position,
      status: data.status || 'active'
    };

    if (editingUser) {
      await updateUser(editingUser.id, userData);
    } else {
      await createUser({
        ...userData,
        id: crypto.randomUUID(),
      });
    }
    handleCloseForm();
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = async (user: User) => {
    await deleteUser(user.id);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingUser(null);
  };

  const getDefaultValues = () => {
    if (editingUser) {
      return {
        email: editingUser.email,
        first_name: editingUser.first_name || '',
        last_name: editingUser.last_name || '',
        phone: editingUser.metadata?.phone || '',
        role: editingUser.metadata?.role || '',
        organization_id: editingUser.default_organization_id || '',
        team_id: editingUser.default_team_id || '',
        department: editingUser.metadata?.department || '',
        position: editingUser.metadata?.position || '',
        status: (editingUser.metadata?.status as "active" | "inactive" | "pending" | "suspended") || 'active'
      };
    }
    return {};
  };

  // Configuration des colonnes pour l'affichage
  const columns = [
    {
      key: 'name',
      label: 'Utilisateur',
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
      type: 'text' as const,
      sortable: true,
      render: (value: any, row: User) => {
        const roleValue = row.metadata?.role;
        const role = roles.find(r => r.name === roleValue);
        return role ? role.display_name : roleValue || "—";
      }
    },
    {
      key: 'department',
      label: 'Département',
      type: 'text' as const,
      sortable: true,
      render: (value: any, row: User) => {
        return row.metadata?.department || "—";
      }
    },
    {
      key: 'status',
      label: 'Statut',
      type: 'custom' as const,
      sortable: true,
      render: (value: any, row: User) => {
        const status = row.metadata?.status || 'active';
        const statusColors = {
          active: 'bg-green-100 text-green-800',
          inactive: 'bg-gray-100 text-gray-800',
          pending: 'bg-yellow-100 text-yellow-800',
          suspended: 'bg-red-100 text-red-800'
        };
        const statusLabels = {
          active: 'Actif',
          inactive: 'Inactif',
          pending: 'En attente',
          suspended: 'Suspendu'
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
            {statusLabels[status as keyof typeof statusLabels]}
          </span>
        );
      }
    },
    {
      key: 'is_msp_admin',
      label: 'Admin MSP',
      type: 'text' as const,
      sortable: true,
      render: (value: any, row: User) => row.is_msp_admin ? "Oui" : "Non"
    }
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Utilisateurs"
          description="Gérez les utilisateurs de votre organisation"
        />
        <div className="text-center text-red-600">
          Erreur: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilisateurs"
        description="Gérez les utilisateurs de votre organisation"
        action={
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel utilisateur
          </Button>
        }
      />

      <CRUDTable
        title="Liste des utilisateurs"
        description="Tous les utilisateurs de votre organisation"
        columns={columns}
        data={users}
        loading={loading}
        onCreate={() => setIsFormOpen(true)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={refresh}
        searchPlaceholder="Rechercher un utilisateur..."
      />

      <UserForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        defaultValues={getDefaultValues()}
        loading={loading}
        title={editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
        roles={roles}
        isEdit={!!editingUser}
      />
    </div>
  );
};

export default NewUsers;
