import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CRUDTable } from "@/components/common/CRUDTable";
// import { CRUDForm } from "@/components/common/CRUDForm";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  Settings, 
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserPlus,
  Trash2
} from "lucide-react";
import { toast } from "sonner";

interface Team {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  user_count: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  metadata?: {
    department?: string;
    manager_id?: string;
    [key: string]: any;
  };
}

interface Organization {
  id: string;
  name: string;
  type: string;
}

const Teams = () => {
  const { sessionContext } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
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
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
    fetchOrganizations();
  }, [sessionContext, currentPage, pageSize, searchTerm, filters]);

  const fetchData = async () => {
    if (!sessionContext?.current_team_id) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('teams')
        .select(`
          *,
          organization:organizations(name, type)
        `, { count: 'exact' });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: teamsData, error: teamsError, count } = await query;

      if (teamsError) throw teamsError;
      
      const transformedTeams = (teamsData || []).map(team => ({
        ...team,
        user_count: 0,
        status: 'active' as const,
        description: team.description || '',
        metadata: (team.metadata as any) || {}
      }));
      
      setTeams(transformedTeams);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Erreur lors du chargement des équipes');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, type');

      if (orgsError) throw orgsError;
      
      setOrganizations(orgsData || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const createTeam = async (data: any) => {
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
      
      const { data: newTeam, error } = await supabase
        .from('teams')
        .insert([teamData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Équipe créée avec succès');
      setIsCreateModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const updateTeam = async (data: any) => {
    if (!selectedTeam) return;

    try {
      setLoading(true);
      
      const updateData = {
        organization_id: data.organization_id,
        name: data.name,
        description: data.description,
        updated_at: new Date().toISOString(),
        metadata: {
          department: data.department,
          manager_id: data.manager_id
        }
      };

      const { error } = await supabase
        .from('teams')
        .update(updateData)
        .eq('id', selectedTeam.id);

      if (error) throw error;

      toast.success('Équipe mise à jour avec succès');
      setIsEditModalOpen(false);
      setSelectedTeam(null);
      fetchData();
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const deleteTeam = async (team: Team) => {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', team.id);

      if (error) throw error;

      toast.success('Équipe supprimée');
      setIsDeleteModalOpen(false);
      setSelectedTeam(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const openEditModal = (team: Team) => {
    setSelectedTeam(team);
    setIsEditModalOpen(true);
  };

  const openViewModal = (team: Team) => {
    setSelectedTeam(team);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = (team: Team) => {
    setSelectedTeam(team);
    setIsDeleteModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "inactive": return "secondary";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4" />;
      case "inactive": return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Nom',
      type: 'custom' as const,
      sortable: true,
      filterable: true,
      render: (value: any, row: Team) => (
        <div>
          <p className="font-medium">{row.name}</p>
          {row.description && (
            <p className="text-sm text-muted-foreground">{row.description}</p>
          )}
        </div>
      )
    },
    {
      key: 'organization',
      label: 'Organisation',
      type: 'custom' as const,
      sortable: true,
      filterable: true,
      render: (value: any, row: any) => (
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span>{row.organization?.name || 'Non définie'}</span>
        </div>
      )
    },
    {
      key: 'user_count',
      label: 'Membres',
      type: 'custom' as const,
      sortable: true,
      render: (value: any, row: Team) => (
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{row.user_count || 0}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      type: 'custom' as const,
      sortable: true,
      filterable: true,
      render: (value: any, row: Team) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(row.status)}
          <Badge variant={getStatusColor(row.status)}>
            {row.status}
          </Badge>
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Créée le',
      type: 'date' as const,
      sortable: true,
      render: (value: any, row: Team) => new Date(row.created_at).toLocaleDateString()
    }
  ];

  const teamFields = [
    {
      key: 'name',
      label: 'Nom de l\'équipe',
      type: 'text' as const,
      required: true,
      placeholder: 'Équipe Développement'
    },
    {
      key: 'organization_id',
      label: 'Organisation',
      type: 'select' as const,
      required: true,
      options: organizations.map(org => ({
        value: org.id,
        label: org.name
      }))
    },
    {
      key: 'description',
      label: 'Description',
      type: 'textarea' as const,
      placeholder: 'Description de l\'équipe...'
    },
    {
      key: 'department',
      label: 'Département',
      type: 'text' as const,
      placeholder: 'IT, RH, Finance...'
    },
    {
      key: 'manager_id',
      label: 'ID Manager',
      type: 'text' as const,
      placeholder: 'ID du responsable d\'équipe'
    }
  ];

  const stats = [
    {
      title: "Équipes totales",
      value: totalCount.toString(),
      icon: Users,
      color: "text-blue-500"
    },
    {
      title: "Actives",
      value: teams.filter(t => t.status === 'active').length.toString(),
      icon: CheckCircle,
      color: "text-green-500"
    },
    {
      title: "Inactives",
      value: teams.filter(t => t.status === 'inactive').length.toString(),
      icon: XCircle,
      color: "text-red-500"
    },
    {
      title: "Membres totaux",
      value: teams.reduce((sum, team) => sum + (team.user_count || 0), 0).toString(),
      icon: UserPlus,
      color: "text-purple-500"
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
        title="Gestion des équipes"
        description="Gérez les équipes de votre organisation"
        columns={columns}
        data={teams}
        loading={loading}
        totalCount={totalCount}
        pageSize={pageSize}
        currentPage={currentPage}
        searchPlaceholder="Rechercher une équipe..."
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
        onSelectionChange={setSelectedTeams}
        emptyState={{
          icon: Users,
          title: "Aucune équipe",
          description: "Commencez par créer votre première équipe",
          action: {
            label: "Créer une équipe",
            onClick: () => setIsCreateModalOpen(true)
          }
        }}
        actions={[
          {
            label: "Gérer les membres",
            icon: Settings,
            onClick: (team) => toast.info(`Gestion des membres de ${team.name} en cours de développement`),
            variant: "outline"
          }
        ]}
      />

      {/* Utiliser les nouveaux formulaires depuis les pages dédiées */}

      {/* Modal de visualisation */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Détails de l'équipe</DialogTitle>
            <DialogDescription>
              Informations complètes de l'équipe
            </DialogDescription>
          </DialogHeader>
          {selectedTeam && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nom</label>
                  <p className="font-medium">{selectedTeam.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Statut</label>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedTeam.status)}
                    <Badge variant={getStatusColor(selectedTeam.status)}>
                      {selectedTeam.status}
                    </Badge>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm">{selectedTeam.description || 'Aucune description'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Département</label>
                  <p className="font-medium">{selectedTeam.metadata?.department || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Membres</label>
                  <p className="font-medium">{selectedTeam.user_count || 0}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de suppression */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l'équipe</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'équipe "{selectedTeam?.name}" ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedTeam && deleteTeam(selectedTeam)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Teams;