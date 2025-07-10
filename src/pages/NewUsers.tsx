import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useUsers } from "@/hooks/useCRUD";
import { CRUDTable } from "@/components/common/CRUDTable";
import { UserForm } from "@/components/forms/UserForm";
import { PageHeader } from "@/components/common/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type User = Tables<"profiles">;
type Role = Tables<"roles">;

const NewUsers = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);

  const {
    data: users,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
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
      metadata: {
        phone: data.phone,
        role: data.role,
        department: data.department,
        position: data.position,
        status: data.status || 'active'
      }
    };

    if (editingUser) {
      await updateItem(editingUser.id, userData);
      toast.success("Utilisateur mis à jour");
    } else {
      await createItem({
        ...userData,
        id: crypto.randomUUID(),
      });
      toast.success("Utilisateur créé");
    }
    handleCloseForm();
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = async (user: User) => {
    await deleteItem(user.id);
    toast.success("Utilisateur supprimé");
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingUser(null);
  };

  const getDefaultValues = () => {
    if (editingUser) {
      const metadata = editingUser.metadata as any || {};
      return {
        email: editingUser.email,
        first_name: editingUser.first_name || "",
        last_name: editingUser.last_name || "",
        phone: metadata.phone || "",
        role: metadata.role || "",
        department: metadata.department || "",
        position: metadata.position || "",
        status: metadata.status || "active",
      };
    }
    return {};
  };

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
        const metadata = row.metadata as any || {};
        return metadata.role || '-';
      }
    },
    {
      key: 'department',
      label: 'Département',
      type: 'text' as const,
      sortable: true,
      render: (value: any, row: User) => {
        const metadata = row.metadata as any || {};
        return metadata.department || '-';
      }
    },
    {
      key: 'created_at',
      label: 'Créé le',
      type: 'date' as const,
      sortable: true,
    }
  ];

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