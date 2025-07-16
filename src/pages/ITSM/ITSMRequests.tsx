import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useServiceRequests, ServiceRequestWithProfile } from "@/hooks/useServiceRequests";
import { 
  PageHeader, 
  DataGrid
} from "@/components/common";
import { RequestAssignment } from "@/components/itsm/RequestAssignment";
import { RequestStatusUpdate } from "@/components/itsm/RequestStatusUpdate";
import { ServiceRequestDetailView } from "@/components/itsm/ServiceRequestDetailView";
import { ServiceRequestForm } from "@/components/forms/ServiceRequestForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ITSMBadge } from "@/components/itsm";
import { SLAStatusBadge } from "@/components/itsm/SLAStatusBadge";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  HelpCircle, 
  Plus, 
  Search,
  User,
  Calendar,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Info,
  Shield
} from "lucide-react";
import { toast } from "sonner";

const ITSMRequests = () => {
  const { user, userProfile } = useAuth();
  const { 
    serviceRequests: requests, 
    loading, 
    createServiceRequest: createRequest, 
    updateServiceRequest: updateRequest, 
    deleteServiceRequest: deleteRequest 
  } = useServiceRequests();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequestWithProfile | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const getRequesterDisplayName = useCallback((request: ServiceRequestWithProfile) => {
    const profile = request.requested_by_profile;
    if (!profile) return "N/A";
    
    if (profile.first_name || profile.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return profile.email;
  }, []);

  const openDetail = useCallback((request: ServiceRequestWithProfile) => {
    setSelectedRequest(request);
    setIsDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedRequest(null);
    setIsDetailOpen(false);
  }, []);

  const openCreate = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  const openEdit = useCallback((request: ServiceRequestWithProfile) => {
    setSelectedRequest(request);
    setIsEditOpen(true);
  }, []);

  const openDelete = useCallback((request: ServiceRequestWithProfile) => {
    setSelectedRequest(request);
    setIsDeleteOpen(true);
  }, []);

  const closeAll = useCallback(() => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsDeleteOpen(false);
    setSelectedRequest(null);
  }, []);

  const handleCreate = useCallback(async (data: any) => {
    await createRequest(data);
    closeAll();
  }, [createRequest, closeAll]);

  const handleUpdate = useCallback(async (data: any) => {
    if (!selectedRequest) return;
    await updateRequest(selectedRequest.id, data);
    closeAll();
  }, [selectedRequest, updateRequest, closeAll]);

  const handleDelete = useCallback(async () => {
    if (!selectedRequest) return;
    await deleteRequest(selectedRequest.id);
    closeAll();
  }, [selectedRequest, deleteRequest, closeAll]);

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

  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (request.description && request.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || request.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [requests, searchTerm, statusFilter, priorityFilter]);

  const stats = useMemo(() => [
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
  ], [requests]);

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
          title="Demandes de service"
          description="Gestion des demandes de service utilisateur"
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Vérifier les permissions d'accès
  const canManageRequests = useMemo(() => {
    return userProfile?.is_msp_admin || userProfile?.default_team_id;
  }, [userProfile]);

  // Si l'utilisateur n'a pas les permissions
  if (!canManageRequests) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Permissions insuffisantes</h3>
          <p className="text-muted-foreground">Vous n'avez pas les permissions nécessaires pour gérer les demandes de service.</p>
        </div>
      </div>
    );
  }

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

      {/* Filtres et Tableau */}
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
                  <SelectItem value="cancelled">Annulé</SelectItem>
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
                  <TableHead>SLA</TableHead>
                  <TableHead>Assigné</TableHead>
                  <TableHead>Date création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Aucune demande de service trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
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
                        <ITSMBadge type="priority" value={request.priority} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(request.status)}
                          <ITSMBadge type="status" value={request.status} category="request" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <SLAStatusBadge 
                          tracking={undefined}
                          size="sm"
                        />
                      </TableCell>
                      <TableCell>
                        <RequestAssignment
                          requestId={request.id}
                          currentAssignee={request.assigned_to}
                          onAssigned={() => {}}
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
                            onClick={() => openDetail(request)}
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de création */}
      <Dialog open={isCreateOpen} onOpenChange={closeAll}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Créer une demande de service</DialogTitle>
          </DialogHeader>
          <ServiceRequestForm
            onSubmit={handleCreate}
            onCancel={closeAll}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition */}
      <Dialog open={isEditOpen} onOpenChange={closeAll}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Modifier la demande de service</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <ServiceRequestForm
              initialData={{
                title: selectedRequest.title,
                description: selectedRequest.description,
                priority: selectedRequest.priority as "critical" | "high" | "medium" | "low",
                service_category: selectedRequest.service_category,
                urgency: selectedRequest.urgency as "critical" | "high" | "medium" | "low",
                impact: selectedRequest.impact as "critical" | "high" | "medium" | "low",
                due_date: selectedRequest.due_date ? new Date(selectedRequest.due_date) : undefined
              }}
              onSubmit={handleUpdate}
              onCancel={closeAll}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
      <Dialog open={isDeleteOpen} onOpenChange={closeAll}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la demande de service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Êtes-vous sûr de vouloir supprimer la demande "{selectedRequest?.title}" ?
              Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={closeAll}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Supprimer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vue détaillée */}
      {selectedRequest && (
        <ServiceRequestDetailView
          requestId={selectedRequest.id}
          isOpen={isDetailOpen}
          onClose={closeDetail}
          onRequestUpdated={() => {}}
        />
      )}
    </div>
  );
};

export default ITSMRequests;