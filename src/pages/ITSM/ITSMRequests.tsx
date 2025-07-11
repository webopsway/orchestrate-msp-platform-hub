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
import { RequestAssignment } from "@/components/itsm/RequestAssignment";
import { RequestStatusUpdate } from "@/components/itsm/RequestStatusUpdate";
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
  HelpCircle, 
  Plus, 
  Search,
  User,
  Calendar,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";
import { toast } from "sonner";

interface ITSMRequest {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  requested_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
  requested_by_profile?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

const ITSMRequests = () => {
  const { sessionContext, user } = useAuth();
  const [requests, setRequests] = useState<ITSMRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentsRequest, setCommentsRequest] = useState<ITSMRequest | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // Pour l'instant, on simule des données vides car la table n'existe pas encore
      setRequests([]);
      toast.error('Module en cours de développement');
    } catch (error) {
      console.error('Error fetching requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const {
    selectedItem: selectedRequest,
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
  } = useITSMCrud<ITSMRequest>({ onRefresh: fetchRequests });

  const getRequesterDisplayName = (request: ITSMRequest) => {
    const profile = request.requested_by_profile;
    if (!profile) return "N/A";
    
    if (profile.first_name || profile.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return profile.email;
  };

  useEffect(() => {
    fetchRequests();
  }, [sessionContext]);

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

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || request.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = [
    {
      title: "Demandes ouvertes",
      value: requests.filter(r => r.status === 'open').length.toString(),
      icon: HelpCircle,
      color: "text-blue-500"
    },
    {
      title: "En cours",
      value: requests.filter(r => r.status === 'in_progress').length.toString(),
      icon: AlertCircle,
      color: "text-yellow-500"
    },
    {
      title: "Résolues",
      value: requests.filter(r => ['resolved', 'closed'].includes(r.status)).length.toString(),
      icon: CheckCircle,
      color: "text-green-500"
    }
  ];

  const filters = (
    <>
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
    </>
  );

  const columns = [
    {
      key: "id",
      label: "ID",
      render: (request: ITSMRequest) => (
        <span className="font-mono text-sm">REQ-{request.id.slice(0, 8)}</span>
      )
    },
    {
      key: "title",
      label: "Titre",
      render: (request: ITSMRequest) => (
        <div>
          <p className="font-medium">{request.title}</p>
          <p className="text-sm text-muted-foreground truncate max-w-xs">
            {request.description}
          </p>
        </div>
      )
    },
    {
      key: "requester",
      label: "Demandeur",
      render: (request: ITSMRequest) => (
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {getRequesterDisplayName(request)}
          </span>
        </div>
      )
    },
    {
      key: "priority",
      label: "Priorité",
      render: (request: ITSMRequest) => (
        <Badge variant={getPriorityColor(request.priority)}>
          {request.priority}
        </Badge>
      )
    },
    {
      key: "status",
      label: "Statut",
      render: (request: ITSMRequest) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(request.status)}
          <Badge variant={getStatusColor(request.status)}>
            {request.status}
          </Badge>
        </div>
      )
    },
    {
      key: "assigned_to",
      label: "Assigné",
      render: (request: ITSMRequest) => (
        <span className="text-sm text-muted-foreground">Non assigné</span>
      )
    },
    {
      key: "created_at",
      label: "Date création",
      render: (request: ITSMRequest) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">
            {new Date(request.created_at).toLocaleDateString()}
          </span>
        </div>
      )
    },
    {
      key: "actions",
      label: "Actions",
      render: (request: ITSMRequest) => (
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log('View details')}
            title="Voir les détails"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log('Edit')}
            title="Modifier"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log('Delete')}
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Demandes de service"
          description="Gestion des demandes de service utilisateur"
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
        title="Demandes de service"
        description="Gestion des demandes de service utilisateur"
        action={{
          label: "Créer une demande",
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
                  placeholder="Rechercher des demandes..."
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
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono text-sm">
                      REQ-{request.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.title}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {request.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {getRequesterDisplayName(request)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(request.priority)}>
                        {request.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <RequestStatusUpdate
                        requestId={request.id}
                        currentStatus={request.status}
                        onStatusUpdated={() => fetchRequests()}
                      />
                    </TableCell>
                    <TableCell>
                      <RequestAssignment
                        requestId={request.id}
                        currentAssignee={request.assigned_to}
                        onAssigned={() => fetchRequests()}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCommentsRequest(request);
                            setIsCommentsOpen(true);
                          }}
                          title="Voir les commentaires"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(request)}
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDelete(request)}
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
          toast.info('Module en cours de développement');
          return true;
        }}
        title="Créer une demande de service"
        sections={[
          {
            title: "Informations générales",
            fields: [
              {
                key: "title",
                label: "Titre",
                type: "text",
                required: true,
                placeholder: "Titre de la demande"
              },
              {
                key: "description",
                label: "Description",
                type: "textarea",
                placeholder: "Description détaillée de la demande"
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
          toast.info('Module en cours de développement');
          return true;
        }}
        title="Modifier la demande de service"
        data={selectedRequest}
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
          toast.info('Module en cours de développement');
          return true;
        }}
        title="Supprimer la demande de service"
        itemName={selectedRequest?.title || ""}
      />
      
      {/* Commentaires */}
      {isCommentsOpen && commentsRequest && (
        <CommentsSection
          ticketId={commentsRequest.id}
          ticketType="incident"
        />
      )}
    </div>
  );
};

export default ITSMRequests;