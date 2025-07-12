import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  PageHeader, 
  DataGrid,
  CreateDialog,
  EditDialog,
  DeleteDialog,
  ActionButtons
} from "@/components/common";
import { CommentsSection } from "@/components/itsm/CommentsSection";
import { IncidentDetailView } from "@/components/itsm/IncidentDetailView";
import { IncidentAssignment } from "@/components/itsm/IncidentAssignment";
import { QuickStatusUpdate } from "@/components/itsm/QuickStatusUpdate";
import { useITSMCrud } from "@/hooks/useITSMCrud";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  User,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Shield
} from "lucide-react";
import { toast } from "sonner";

interface ITSMIncident {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  metadata?: any;
  created_by_profile?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

const ITSMIncidents = () => {
  const { user, userProfile } = useAuth();
  const [incidents, setIncidents] = useState<ITSMIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const fetchIncidents = useCallback(async () => {
    if (!user) {
      console.log('No user available, skipping incidents load');
      setIncidents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      console.log('🔍 Debug ITSMIncidents.fetchIncidents:');
      console.log('User:', user.id);
      console.log('UserProfile:', userProfile);
      console.log('Is MSP Admin:', userProfile?.is_msp_admin);
      console.log('Default Team ID:', userProfile?.default_team_id);

      let query = supabase
        .from('itsm_incidents')
        .select(`
          *,
          created_by_profile:profiles!created_by (
            id,
            email,
            first_name,
            last_name
          )
        `);

      // Filter by team if not MSP admin
      if (!userProfile?.is_msp_admin && userProfile?.default_team_id) {
        console.log('🔍 Filtrage par équipe:', userProfile.default_team_id);
        query = query.eq('team_id', userProfile.default_team_id);
      } else if (userProfile?.is_msp_admin) {
        console.log('🔍 Admin MSP - pas de filtrage par équipe');
      } else {
        console.log('🔍 Pas d\'équipe par défaut et pas admin MSP');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      console.log('🔍 Résultat de la requête:');
      console.log('Data count:', data?.length || 0);
      console.log('Error:', error);
      console.log('Sample data:', data?.[0]);

      if (error) {
        console.error('Error fetching incidents:', error);
        toast.error('Erreur lors du chargement des incidents');
        setIncidents([]);
        return;
      }
      
      setIncidents((data || []) as ITSMIncident[]);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      toast.error('Erreur lors du chargement des incidents');
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile]);

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentsIncident, setCommentsIncident] = useState<ITSMIncident | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [detailIncident, setDetailIncident] = useState<ITSMIncident | null>(null);
  
  const {
    selectedItem: selectedIncident,
    isCreateOpen,
    isEditOpen,
    isDeleteOpen,
    openCreate,
    openEdit,
    openDelete,
    closeAll,
    handleCreate,
    handleUpdate,
    handleDelete
  } = useITSMCrud<ITSMIncident>({ onRefresh: fetchIncidents });

  const openDetailView = useCallback((incident: ITSMIncident) => {
    setDetailIncident(incident);
    setIsDetailViewOpen(true);
  }, []);

  const closeDetailView = useCallback(() => {
    setIsDetailViewOpen(false);
    setDetailIncident(null);
  }, []);

  useEffect(() => {
    if (user) {
      fetchIncidents();
    } else {
      setIncidents([]);
      setLoading(false);
    }
  }, [user, userProfile, fetchIncidents]);

  const updateIncidentStatus = useCallback(async (incidentId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('itsm_incidents')
        .update(updateData)
        .eq('id', incidentId);

      if (error) throw error;

      toast.success('Statut mis à jour');
      await fetchIncidents();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }, [fetchIncidents]);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case "critical": return "destructive";
      case "high": return "secondary";
      case "medium": return "default";
      case "low": return "outline";
      default: return "outline";
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "resolved":
      case "closed":
        return "default";
      case "in_progress":
        return "secondary";
      case "open":
        return "outline";
      default:
        return "outline";
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "resolved":
      case "closed":
        return <CheckCircle className="h-4 w-4" />;
      case "in_progress":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  }, []);

  const getRequesterDisplayName = useCallback((incident: ITSMIncident) => {
    const profile = incident.created_by_profile;
    if (!profile) return "N/A";
    
    if (profile.first_name || profile.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return profile.email;
  }, []);

  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      const matchesSearch = incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (incident.description && incident.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || incident.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || incident.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [incidents, searchTerm, statusFilter, priorityFilter]);

  const stats = useMemo(() => [
    {
      title: "Incidents ouverts",
      value: incidents.filter(i => i.status === 'open').length.toString(),
      icon: AlertTriangle,
      color: "text-red-500"
    },
    {
      title: "En cours",
      value: incidents.filter(i => i.status === 'in_progress').length.toString(),
      icon: AlertCircle,
      color: "text-yellow-500"
    },
    {
      title: "Résolus",
      value: incidents.filter(i => ['resolved', 'closed'].includes(i.status)).length.toString(),
      icon: CheckCircle,
      color: "text-green-500"
    }
  ], [incidents]);

  // Si l'utilisateur n'est pas connecté
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Accès non autorisé</h3>
          <p className="text-muted-foreground">Vous devez être connecté pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  // Si le profil utilisateur n'est pas encore chargé, afficher le loading
  if (!userProfile) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Incidents"
          description="Gestion des incidents de service"
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Vérifier les permissions d'accès
  const canManageIncidents = useMemo(() => {
    return userProfile?.is_msp_admin || userProfile?.default_team_id;
  }, [userProfile]);

  // Si l'utilisateur n'a pas les permissions
  if (!canManageIncidents) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Permissions insuffisantes</h3>
          <p className="text-muted-foreground">Vous n'avez pas les permissions nécessaires pour gérer les incidents.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Incidents"
          description="Gestion des incidents de service"
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incidents"
        description="Gestion des incidents de service"
        action={{
          label: "Créer un incident",
          icon: Plus,
          onClick: openCreate
        }}
      />

      {/* Statistiques */}
      <DataGrid columns={3}>
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
      </DataGrid>

      {/* Filtres et Tableau */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des incidents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="open">Ouvert</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="resolved">Résolu</SelectItem>
                  <SelectItem value="closed">Fermé</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Basse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tableau */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Créé par</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Assigné</TableHead>
                  <TableHead>Date création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncidents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucun incident trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIncidents.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell className="font-mono text-sm">
                        INC-{incident.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{incident.title}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {incident.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {getRequesterDisplayName(incident)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(incident.priority)}>
                          {incident.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <QuickStatusUpdate
                          incidentId={incident.id}
                          currentStatus={incident.status}
                          onStatusUpdated={() => {}}
                        />
                      </TableCell>
                      <TableCell>
                        <IncidentAssignment
                          incidentId={incident.id}
                          currentAssignee={incident.assigned_to}
                          onAssigned={() => {}}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">
                            {new Date(incident.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetailView(incident)}
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(incident)}
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDelete(incident)}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs CRUD */}
      <CreateDialog
        open={isCreateOpen}
        onOpenChange={closeAll}
        title="Créer un incident"
        description="Créer un nouvel incident de service"
      >
        {/* Formulaire de création */}
      </CreateDialog>

      <EditDialog
        open={isEditOpen}
        onOpenChange={closeAll}
        title="Modifier l'incident"
        description="Modifier les détails de l'incident"
      >
        {/* Formulaire d'édition */}
      </EditDialog>

      <DeleteDialog
        open={isDeleteOpen}
        onOpenChange={closeAll}
        title="Supprimer l'incident"
        description="Êtes-vous sûr de vouloir supprimer cet incident ?"
        onConfirm={handleDelete}
      />

      {/* Vue détaillée */}
      {detailIncident && (
        <IncidentDetailView
          incidentId={detailIncident.id}
          isOpen={isDetailViewOpen}
          onClose={closeDetailView}
          onIncidentUpdated={() => {}}
        />
      )}

      {/* Section commentaires */}
      {commentsIncident && (
        <CommentsSection
          isOpen={isCommentsOpen}
          onClose={() => setIsCommentsOpen(false)}
          entityId={commentsIncident.id}
          entityType="incident"
          title={`Commentaires - ${commentsIncident.title}`}
        />
      )}
    </div>
  );
};

export default ITSMIncidents;