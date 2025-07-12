import { useState, useEffect } from "react";
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
  MessageSquare
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
  const { sessionContext, user } = useAuth();
  const [incidents, setIncidents] = useState<ITSMIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const fetchIncidents = async () => {
    if (!user) {
      console.log('No user available, skipping incidents load');
      setIncidents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Check if user is MSP admin directly from auth context
      const { data: profile } = await supabase.from('profiles')
        .select('is_msp_admin, default_organization_id, default_team_id')
        .eq('id', user.id)
        .single();
      
      // For MSP admins, create a minimal session context if none exists
      let workingSessionContext = sessionContext;
      if (!workingSessionContext && profile?.is_msp_admin) {
        console.log('Creating temporary MSP session context for incidents loading');
        workingSessionContext = {
          current_organization_id: profile.default_organization_id,
          current_team_id: profile.default_team_id,
          is_msp: true
        };
      }

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
      const teamId = workingSessionContext?.current_team_id;
      if (teamId && !workingSessionContext?.is_msp) {
        query = query.eq('team_id', teamId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setIncidents((data || []) as ITSMIncident[]);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      toast.error('Erreur lors du chargement des incidents');
    } finally {
      setLoading(false);
    }
  };

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

  const openDetailView = (incident: ITSMIncident) => {
    setDetailIncident(incident);
    setIsDetailViewOpen(true);
  };

  const closeDetailView = () => {
    setIsDetailViewOpen(false);
    setDetailIncident(null);
  };

  useEffect(() => {
    if (user) {
      fetchIncidents();
    }
  }, [user, sessionContext]);

  const updateIncidentStatus = async (incidentId: string, newStatus: string) => {
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
      fetchIncidents();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "destructive";
      case "high": return "secondary";
      case "medium": return "default";
      case "low": return "outline";
      default: return "outline";
    }
  };

  const getStatusColor = (status: string) => {
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
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
      case "closed":
        return <CheckCircle className="h-4 w-4" />;
      case "in_progress":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getRequesterDisplayName = (incident: ITSMIncident) => {
    const profile = incident.created_by_profile;
    if (!profile) return "N/A";
    
    if (profile.first_name || profile.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return profile.email;
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || incident.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || incident.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = [
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
  ];

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

      {/* Filtres */}
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
                   <TableHead>Demandeur</TableHead>
                   <TableHead>Priorité</TableHead>
                   <TableHead>Statut</TableHead>
                   <TableHead>Assigné</TableHead>
                   <TableHead>Date création</TableHead>
                   <TableHead className="text-right">Actions</TableHead>
                 </TableRow>
               </TableHeader>
              <TableBody>
                {filteredIncidents.map((incident) => (
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
                        onStatusUpdated={() => fetchIncidents()}
                      />
                    </TableCell>
                    <TableCell>
                      <IncidentAssignment
                        incidentId={incident.id}
                        currentAssignee={incident.assigned_to}
                        onAssigned={() => fetchIncidents()}
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
                          onClick={() => {
                            setCommentsIncident(incident);
                            setIsCommentsOpen(true);
                          }}
                          title="Voir les commentaires"
                        >
                          <MessageSquare className="h-4 w-4" />
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
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Formulaires CRUD */}
      <CreateDialog
        isOpen={isCreateOpen}
        onClose={closeAll}
        onCreate={async (data) => {
          const success = await handleCreate(async (formData) => {
            const { error } = await supabase
              .from('itsm_incidents')
              .insert([{
                ...formData,
                created_by: user?.id,
                team_id: sessionContext?.current_team_id
              }]);
            
            if (error) throw error;
            fetchIncidents();
            return true;
          }, data);
          
          return success;
        }}
        title="Créer un incident"
        sections={[
          {
            title: "Informations générales",
            fields: [
              {
                key: "title",
                label: "Titre",
                type: "text",
                required: true,
                placeholder: "Titre de l'incident"
              },
              {
                key: "description",
                label: "Description",
                type: "textarea",
                placeholder: "Description détaillée de l'incident"
              }
            ]
          },
          {
            title: "Classification",
            fields: [
              {
                key: "priority",
                label: "Priorité",
                type: "select",
                required: true,
                options: [
                  { value: "low", label: "Basse" },
                  { value: "medium", label: "Moyenne" },
                  { value: "high", label: "Haute" },
                  { value: "critical", label: "Critique" }
                ]
              },
              {
                key: "status",
                label: "Statut",
                type: "select",
                required: true,
                options: [
                  { value: "open", label: "Ouvert" },
                  { value: "in_progress", label: "En cours" },
                  { value: "resolved", label: "Résolu" },
                  { value: "closed", label: "Fermé" }
                ]
              }
            ]
          }
        ]}
      />

      <EditDialog
        isOpen={isEditOpen}
        onClose={closeAll}
        onSave={async (data) => {
          const success = await handleUpdate(async (formData) => {
            const { error } = await supabase
              .from('itsm_incidents')
              .update(formData)
              .eq('id', selectedIncident?.id);
            
            if (error) throw error;
            fetchIncidents();
            return true;
          }, data);
          
          return success;
        }}
        title="Modifier l'incident"
        data={selectedIncident}
        sections={[
          {
            title: "Informations générales",
            fields: [
              {
                key: "title",
                label: "Titre",
                type: "text",
                required: true
              },
              {
                key: "description",
                label: "Description",
                type: "textarea"
              }
            ]
          },
          {
            title: "Classification",
            fields: [
              {
                key: "priority",
                label: "Priorité",
                type: "select",
                required: true,
                options: [
                  { value: "low", label: "Basse" },
                  { value: "medium", label: "Moyenne" },
                  { value: "high", label: "Haute" },
                  { value: "critical", label: "Critique" }
                ]
              },
              {
                key: "status",
                label: "Statut",
                type: "select",
                required: true,
                options: [
                  { value: "open", label: "Ouvert" },
                  { value: "in_progress", label: "En cours" },
                  { value: "resolved", label: "Résolu" },
                  { value: "closed", label: "Fermé" }
                ]
              }
            ]
          }
        ]}
      />

      <DeleteDialog
        isOpen={isDeleteOpen}
        onClose={closeAll}
        onDelete={async () => {
          return await handleDelete(async () => {
            const { error } = await supabase
              .from('itsm_incidents')
              .delete()
              .eq('id', selectedIncident?.id);
            
            if (error) throw error;
            fetchIncidents();
            return true;
          });
        }}
        title="Supprimer l'incident"
        itemName={selectedIncident?.title || ""}
        displayFields={[
          { key: "title", label: "Titre" },
          { key: "priority", label: "Priorité" },
          { key: "status", label: "Statut" },
          { key: "created_at", label: "Créé le", render: (value) => new Date(value).toLocaleDateString() }
        ]}
        data={selectedIncident}
      />

      {/* Vue détaillée */}
      <IncidentDetailView
        incident={detailIncident}
        isOpen={isDetailViewOpen}
        onClose={closeDetailView}
        onIncidentUpdated={fetchIncidents}
      />

      {/* Dialog des commentaires (version standalone) */}
      {isCommentsOpen && commentsIncident && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                Commentaires - INC-{commentsIncident.id.slice(0, 8)}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCommentsOpen(false)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              <CommentsSection 
                ticketId={commentsIncident.id} 
                ticketType="incident" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ITSMIncidents;