import { useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSecurityIncidents, SecurityIncident } from "@/hooks/useSecurityIncidents";
import { 
  PageHeader, 
  DataGrid,
  SearchAndFilters,
  DeleteDialog,
  EmptyState
} from "@/components/common";
import { IncidentAssignment } from "@/components/itsm/IncidentAssignment";
import { IncidentStatusUpdate } from "@/components/itsm/IncidentStatusUpdate";
import { SecurityIncidentForm } from "@/components/forms/SecurityIncidentForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ITSMBadge } from "@/components/itsm";
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
  Shield, 
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
  Bug,
  Wrench,
  Clock,
  AlertTriangle
} from "lucide-react";

const ITSMSecurityIncidents = () => {
  const { user, userProfile } = useAuth();
  const { 
    incidents, 
    loading, 
    createSecurityIncident, 
    updateSecurityIncident, 
    deleteSecurityIncident,
    assignSecurityIncident,
    updateStatus
  } = useSecurityIncidents();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const getRequesterDisplayName = useCallback((incident: SecurityIncident) => {
    const profile = incident.created_by_profile;
    if (!profile) return "N/A";
    
    if (profile.first_name || profile.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return profile.email;
  }, []);

  const openCreate = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  const openEdit = useCallback((incident: SecurityIncident) => {
    setSelectedIncident(incident);
    setIsEditOpen(true);
  }, []);

  const openDelete = useCallback((incident: SecurityIncident) => {
    setSelectedIncident(incident);
    setIsDeleteOpen(true);
  }, []);

  const closeAll = useCallback(() => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsDeleteOpen(false);
    setSelectedIncident(null);
  }, []);

  const handleCreate = useCallback(async (data: any): Promise<boolean> => {
    const success = await createSecurityIncident(data);
    if (success) {
      closeAll();
    }
    return success;
  }, [createSecurityIncident, closeAll]);

  const handleUpdate = useCallback(async (data: any): Promise<boolean> => {
    if (!selectedIncident) return false;
    const success = await updateSecurityIncident(selectedIncident.id, data);
    if (success) {
      closeAll();
    }
    return success;
  }, [selectedIncident, updateSecurityIncident, closeAll]);

  const handleDelete = useCallback(async () => {
    if (!selectedIncident) return false;
    const success = await deleteSecurityIncident(selectedIncident.id);
    if (success) {
      closeAll();
    }
    return success;
  }, [selectedIncident, deleteSecurityIncident, closeAll]);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case "critical": return "destructive";
      case "high": return "secondary";
      case "medium": return "default";
      case "low": return "outline";
      default: return "outline";
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

  const getSourceIcon = useCallback((source: string) => {
    switch (source) {
      case "vulnerability":
        return <Bug className="h-4 w-4" />;
      case "patch":
        return <Wrench className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  }, []);

  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      const matchesSearch = incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (incident.description && incident.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || incident.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || incident.priority === priorityFilter;
      const matchesSource = sourceFilter === "all" || incident.metadata?.created_source === sourceFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesSource;
    });
  }, [incidents, searchTerm, statusFilter, priorityFilter, sourceFilter]);

  const stats = useMemo(() => [
    {
      title: "Incidents sécurité ouverts",
      value: incidents.filter(i => i.status === 'open').length.toString(),
      icon: Shield,
      color: "text-red-500"
    },
    {
      title: "En cours de traitement",
      value: incidents.filter(i => i.status === 'in_progress').length.toString(),
      icon: Clock,
      color: "text-yellow-500"
    },
    {
      title: "Depuis vulnérabilités",
      value: incidents.filter(i => i.metadata?.created_source === 'vulnerability').length.toString(),
      icon: Bug,
      color: "text-orange-500"
    },
    {
      title: "Depuis patchs",
      value: incidents.filter(i => i.metadata?.created_source === 'patch').length.toString(),
      icon: Wrench,
      color: "text-blue-500"
    }
  ], [incidents]);

  // Si l'utilisateur n'est pas connecté
  if (!user || !userProfile) {
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
          <p className="text-muted-foreground">Vous n'avez pas les permissions nécessaires pour gérer les incidents de sécurité.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Incidents de Sécurité"
          description="Gestion des incidents ITSM de sécurité"
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
        title="Incidents de Sécurité"
        description="Gestion des incidents ITSM liés à la sécurité, vulnérabilités et patchs"
        action={{
          label: "Créer un incident de sécurité",
          icon: Plus,
          onClick: openCreate
        }}
      />

      {/* Statistiques */}
      <DataGrid columns={4}>
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

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des incidents de sécurité..."
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

              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes sources</SelectItem>
                  <SelectItem value="vulnerability">Vulnérabilité</SelectItem>
                  <SelectItem value="patch">Patch</SelectItem>
                  <SelectItem value="manual">Manuel</SelectItem>
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
                  <TableHead>Source</TableHead>
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
                    <TableCell colSpan={9} className="text-center py-8">
                      <EmptyState
                        icon={Shield}
                        title="Aucun incident de sécurité trouvé"
                        description={
                          searchTerm || statusFilter !== "all" || priorityFilter !== "all" || sourceFilter !== "all"
                            ? "Aucun incident ne correspond à vos critères de recherche"
                            : "Aucun incident de sécurité créé pour le moment"
                        }
                        action={{
                          label: "Créer un incident de sécurité",
                          onClick: openCreate
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIncidents.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell className="font-mono text-sm">
                        SEC-{incident.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{incident.title}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {incident.description}
                          </p>
                          {incident.metadata?.risk_assessment && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              Risque: {incident.metadata.risk_assessment}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSourceIcon(incident.metadata?.created_source || 'manual')}
                          <span className="text-sm capitalize">
                            {incident.metadata?.created_source === 'vulnerability' ? 'Vulnérabilité' :
                             incident.metadata?.created_source === 'patch' ? 'Patch' : 'Manuel'}
                          </span>
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
                        <ITSMBadge type="priority" value={incident.priority} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(incident.status)}
                          <ITSMBadge type="status" value={incident.status} category="incident" />
                        </div>
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

      {/* Dialog de création */}
      <Dialog open={isCreateOpen} onOpenChange={closeAll}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Créer un incident de sécurité</DialogTitle>
          </DialogHeader>
          <SecurityIncidentForm
            onSubmit={handleCreate}
            onCancel={closeAll}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition */}
      <Dialog open={isEditOpen} onOpenChange={closeAll}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'incident de sécurité</DialogTitle>
          </DialogHeader>
          {selectedIncident && (
            <SecurityIncidentForm
              onSubmit={handleUpdate}
              onCancel={closeAll}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
      <DeleteDialog
        isOpen={isDeleteOpen}
        onClose={closeAll}
        onDelete={handleDelete}
        title="Supprimer l'incident de sécurité"
        itemName={selectedIncident?.title || ""}
        confirmText="Cette action est irréversible et supprimera toutes les données associées à cet incident."
      />
    </div>
  );
};

export default ITSMSecurityIncidents;