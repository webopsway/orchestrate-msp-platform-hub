import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useOrganizations } from "@/hooks/useOrganizations";
import { CRUDTable } from "@/components/common/CRUDTable";
import { OrganizationForm } from "@/components/forms/OrganizationForm";
import { PageHeader } from "@/components/common/PageHeader";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

import type { Organization } from "@/hooks/useOrganizations";

const NewOrganizations = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);

  const {
    organizations,
    loading,
    error,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    refresh
  } = useOrganizations();

  const handleSubmit = async (data: any) => {
    const orgData = {
      name: data.name,
      type: data.type,
      is_msp: data.is_msp || false,
      metadata: {
        description: data.description,
        website: data.website,
        email: data.email,
        phone: data.phone,
      }
    };

    if (editingOrganization) {
      await updateOrganization(editingOrganization.id, orgData);
    } else {
      await createOrganization(orgData);
    }
    handleCloseForm();
  };

  const handleEdit = (org: Organization) => {
    setEditingOrganization(org);
    setIsFormOpen(true);
  };

  const handleDelete = async (org: Organization) => {
    await deleteOrganization(org.id);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingOrganization(null);
  };

  const getDefaultValues = () => {
    if (editingOrganization) {
      const metadata = editingOrganization.metadata as any || {};
      return {
        name: editingOrganization.name,
        type: editingOrganization.type,
        is_msp: editingOrganization.is_msp,
        description: metadata.description || "",
        website: metadata.website || "",
        email: metadata.email || "",
        phone: metadata.phone || "",
      };
    }
    return {};
  };

  const columns = [
    {
      key: 'name',
      label: 'Nom',
      type: 'text' as const,
      sortable: true,
      filterable: true,
    },
    {
      key: 'type',
      label: 'Type',
      type: 'badge' as const,
      sortable: true,
      filterable: true,
    },
    {
      key: 'is_msp',
      label: 'MSP',
      type: 'custom' as const,
      sortable: true,
      render: (value: any, row: any) => row.is_msp ? 'Oui' : 'Non'
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
        title="Organisations"
        description="Gérez les organisations de votre MSP"
        action={
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle organisation
          </Button>
        }
      />

      <CRUDTable
        title="Liste des organisations"
        description="Toutes les organisations de votre MSP"
        columns={columns}
        data={organizations}
        loading={loading}
        onCreate={() => setIsFormOpen(true)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={refresh}
        searchPlaceholder="Rechercher une organisation..."
      />

      <OrganizationForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        defaultValues={getDefaultValues()}
        loading={loading}
        title={editingOrganization ? "Modifier l'organisation" : "Nouvelle organisation"}
      />
    </div>
  );
};

export default NewOrganizations;