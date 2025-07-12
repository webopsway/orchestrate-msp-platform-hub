import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useChanges, Change } from "@/hooks/useChanges";
import { 
  PageHeader, 
  DataGrid
} from "@/components/common";
import { ChangeAssignment } from "@/components/itsm/ChangeAssignment";
import { ChangeStatusUpdate } from "@/components/itsm/ChangeStatusUpdate";
import { ChangeDetailView } from "@/components/itsm/ChangeDetailView";
import { ChangeForm } from "@/components/forms/ChangeForm";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Settings,
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

const ITSMChanges = () => {
  const { user, userProfile } = useAuth();
  const { 
    changes, 
    loading, 
    createChange, 
    updateChange, 
    deleteChange 
  } = useChanges();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedChange, setSelectedChange] = useState<Change | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const getRequesterDisplayName = useCallback((change: Change) => {
    const profile = change.requested_by_profile;
    if (!profile) return "N/A";
    
    if (profile.first_name || profile.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return profile.email;
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "approved":
      case "implemented":
        return "default";
      case "pending_approval":
        return "secondary";
      case "draft":
        return "outline";
      case "rejected":
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "approved":
      case "implemented":
        return <CheckCircle className="h-4 w-4" />;
      case "pending_approval":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  }, []);

  const getTypeColor = useCallback((type: string) => {
    switch (type) {
      case "emergency": return "destructive";
      case "urgent": return "secondary";
      case "normal": return "default";
      case "standard": return "outline";
      default: return "outline";
    }
  }, []);

  const openDetail = useCallback((change: Change) => {
    setSelectedChange(change);
    setIsDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedChange(null);
    setIsDetailOpen(false);
  }, []);

  const openCreate = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  const openEdit = useCallback((change: Change) => {
    setSelectedChange(change);
    setIsEditOpen(true);
  }, []);

  const openDelete = useCallback((change: Change) => {
    setSelectedChange(change);
    setIsDeleteOpen(true);
  }, []);

  const closeAll = useCallback(() => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsDeleteOpen(false);
    setSelectedChange(null);
  }, []);

  const handleCreate = useCallback(async (data: any): Promise<boolean> => {
    const success = await createChange(data);
    if (success) {
      closeAll();
    }
    return success;
  }, [createChange, closeAll]);

  const handleUpdate = useCallback(async (data: any): Promise<boolean> => {
    if (!selectedChange) return false;
    const success = await updateChange(selectedChange.id, data);
    if (success) {
      closeAll();
    }
    return success;
  }, [selectedChange, updateChange, closeAll]);

  const handleDelete = useCallback(async () => {
    if (!selectedChange) return;
    const success = await deleteChange(selectedChange.id);
    if (success) {
      closeAll();
    }
  }, [selectedChange, deleteChange, closeAll]);


  const filteredChanges = useMemo(() => {
    return changes.filter(change => {
      const matchesSearch = change.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (change.description && change.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || change.status === statusFilter;
      const matchesType = typeFilter === "all" || change.change_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [changes, searchTerm, statusFilter, typeFilter]);

  const stats = useMemo(() => [
    {
      title: "En attente",
      value: changes.filter(c => c.status === 'pending_approval').length.toString(),
      icon: Settings,
      color: "text-blue-500"
    },
    {
      title: "Approuvés",
      value: changes.filter(c => c.status === 'approved').length.toString(),
      icon: AlertCircle,
      color: "text-yellow-500"
    },
    {
      title: "Implémentés",
      value: changes.filter(c => c.status === 'implemented').length.toString(),
      icon: CheckCircle,
      color: "text-green-500"
    }
  ], [changes]);

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
          title="Changements"
          description="Gestion des demandes de changement"
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Vérifier les permissions d'accès
  const canManageChanges = useMemo(() => {
    return userProfile?.is_msp_admin || userProfile?.default_team_id;
  }, [userProfile]);

  // Si l'utilisateur n'a pas les permissions
  if (!canManageChanges) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Permissions insuffisantes</h3>
          <p className="text-muted-foreground">Vous n'avez pas les permissions nécessaires pour gérer les changements.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Changements"
          description="Gestion des demandes de changement"
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
        title="Changements"
        description="Gestion des demandes de changement"
        action={{
          label: "Créer un changement",
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
                  placeholder="Rechercher des changements..."
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
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="pending_approval">En attente</SelectItem>
                  <SelectItem value="approved">Approuvé</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                  <SelectItem value="implemented">Implémenté</SelectItem>
                  <SelectItem value="failed">Échoué</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="emergency">Urgence</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
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
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Assigné</TableHead>
                  <TableHead>Date création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChanges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucun changement trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredChanges.map((change) => (
                    <TableRow key={change.id}>
                      <TableCell className="font-mono text-sm">
                        CHG-{change.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{change.title}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {change.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {getRequesterDisplayName(change)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {change.change_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ChangeStatusUpdate
                          changeId={change.id}
                          currentStatus={change.status}
                          onStatusUpdated={() => {}}
                        />
                      </TableCell>
                      <TableCell>
                        <ChangeAssignment
                          changeId={change.id}
                          currentAssignee={change.assigned_to}
                          onAssigned={() => {}}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">
                            {new Date(change.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetail(change)}
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(change)}
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDelete(change)}
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
            <DialogTitle>Créer un changement</DialogTitle>
          </DialogHeader>
          <ChangeForm
            onSubmit={handleCreate}
            onCancel={closeAll}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition */}
      <Dialog open={isEditOpen} onOpenChange={closeAll}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Modifier le changement</DialogTitle>
          </DialogHeader>
          {selectedChange && (
            <ChangeForm
              initialData={selectedChange}
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
            <DialogTitle>Supprimer le changement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Êtes-vous sûr de vouloir supprimer le changement "{selectedChange?.title}" ?
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
      {selectedChange && (
        <ChangeDetailView
          change={selectedChange}
        />
      )}
    </div>
  );
};

export default ITSMChanges;