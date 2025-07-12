import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CRUDTable } from "@/components/common/CRUDTable";
import { TeamForm } from "@/components/forms/TeamForm";
import { PageHeader } from "@/components/common/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Team = Tables<"teams">;
type Organization = Tables<"organizations">;

interface TeamWithOrg extends Team {
  organization?: { name: string };
}

interface SimpleOrganization {
  id: string;
  name: string;
}

const NewTeams = () => {
  const { userProfile } = useAuth();
  const [teams, setTeams] = useState<TeamWithOrg[]>([]);
  const [organizations, setOrganizations] = useState<SimpleOrganization[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamWithOrg | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTeams();
    fetchOrganizations();
  }, [userProfile]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          organization:organizations(name)
        `);
      
      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Erreur lors du chargement des équipes');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name');
      
      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      
      const teamData = {
        organization_id: data.organization_id,
        name: data.name,
        description: data.description,
        metadata: {
          department: data.department,
          manager_id: data.manager_id
        }
      };

      if (editingTeam) {
        const { error } = await supabase
          .from('teams')
          .update(teamData)
          .eq('id', editingTeam.id);
        
        if (error) throw error;
        toast.success("Équipe mise à jour");
      } else {
        const { error } = await supabase
          .from('teams')
          .insert([teamData]);
        
        if (error) throw error;
        toast.success("Équipe créée");
      }
      
      handleCloseForm();
      fetchTeams();
    } catch (error) {
      console.error('Error submitting team:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (team: TeamWithOrg) => {
    setEditingTeam(team);
    setIsFormOpen(true);
  };

  const handleDelete = async (team: TeamWithOrg) => {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', team.id);
      
      if (error) throw error;
      toast.success("Équipe supprimée");
      fetchTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTeam(null);
  };

  const getDefaultValues = () => {
    if (editingTeam) {
      const metadata = editingTeam.metadata as any || {};
      return {
        name: editingTeam.name,
        organization_id: editingTeam.organization_id,
        description: editingTeam.description || "",
        department: metadata.department || "",
        manager_id: metadata.manager_id || "",
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
      key: 'organization',
      label: 'Organisation',
      type: 'custom' as const,
      sortable: true,
      render: (value: any, row: any) => row.organization?.name || 'Non définie'
    },
    {
      key: 'description',
      label: 'Description',
      type: 'text' as const,
      sortable: false,
    },
    {
      key: 'created_at',
      label: 'Créée le',
      type: 'date' as const,
      sortable: true,
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Équipes"
        description="Gérez les équipes de votre organisation"
        action={
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle équipe
          </Button>
        }
      />

      <CRUDTable
        title="Liste des équipes"
        description="Toutes les équipes de votre organisation"
        columns={columns}
        data={teams}
        loading={loading}
        onCreate={() => setIsFormOpen(true)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={fetchTeams}
        searchPlaceholder="Rechercher une équipe..."
      />

      <TeamForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        defaultValues={getDefaultValues()}
        loading={loading}
        title={editingTeam ? "Modifier l'équipe" : "Nouvelle équipe"}
        organizations={organizations}
      />
    </div>
  );
};

export default NewTeams;