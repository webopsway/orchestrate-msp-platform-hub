import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  PageHeader, 
  DataGrid,
  CreateDialog,
  EditDialog,
  DeleteDialog,
  DetailDialog
} from "@/components/common";
import { CommentsSection } from "@/components/itsm/CommentsSection";
import { ChangeAssignment } from "@/components/itsm/ChangeAssignment";
import { ChangeStatusUpdate } from "@/components/itsm/ChangeStatusUpdate";
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
  FileText, 
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
import { useITSMCrud } from "@/hooks/useITSMCrud";
import { toast } from "sonner";

interface ITSMChange {
  id: string;
  title: string;
  description: string;
  change_type: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'implemented' | 'failed';
  requested_by: string;
  approved_by?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  scheduled_date?: string;
  metadata?: any;
  requested_by_profile?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

const ITSMChanges = () => {
  const { user, userProfile } = useAuth();
  const [changes, setChanges] = useState<ITSMChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const fetchChanges = useCallback(async () => {
    if (!user) {
      console.log('No user available, skipping changes load');
      setChanges([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      console.log('🔍 Debug ITSMChanges.fetchChanges:');
      console.log('User:', user.id);
      console.log('UserProfile:', userProfile);
      console.log('Is MSP Admin:', userProfile?.is_msp_admin);
      console.log('Default Team ID:', userProfile?.default_team_id);

      let query = supabase
        .from('itsm_change_requests')
        .select(`
          *,
          requested_by_profile:profiles!requested_by (
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
        console.error('Error fetching changes:', error);
        toast.error('Erreur lors du chargement des changements');
        setChanges([]);
        return;
      }
      
      setChanges((data || []) as ITSMChange[]);
    } catch (error) {
      console.error('Error fetching changes:', error);
      toast.error('Erreur lors du chargement des changements');
      setChanges([]);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile]);

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentsChange, setCommentsChange] = useState<ITSMChange | null>(null);

  const {
    selectedItem: selectedChange,
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
  } = useITSMCrud<ITSMChange>({ onRefresh: fetchChanges });

  useEffect(() => {
    if (user) {
      fetchChanges();
    } else {
      setChanges([]);
      setLoading(false);
    }
  }, [user, userProfile, fetchChanges]);

  const updateChangeStatus = useCallback(async (changeId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('itsm_change_requests')
        .update({ status: newStatus })
        .eq('id', changeId);

      if (error) throw error;

      toast.success('Statut mis à jour');
      await fetchChanges();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }, [fetchChanges]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "implemented":
        return "default";
      case "approved":
        return "secondary";
      case "pending_approval":
        return "outline";
      case "draft":
        return "outline";
      case "failed":
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "implemented":
        return <CheckCircle className="h-4 w-4" />;
      case "failed":
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "pending_approval":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  }, []);

  const getRequesterDisplayName = useCallback((change: ITSMChange) => {
    const profile = change.requested_by_profile;
    if (!profile) return "N/A";
    
    if (profile.first_name || profile.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return profile.email;
  }, []);

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
      title: "Changements en attente",
      value: changes.filter(c => c.status === 'pending_approval').length.toString(),
      icon: AlertCircle,
      color: "text-yellow-500"
    },
    {
      title: "Approuvés",
      value: changes.filter(c => c.status === 'approved').length.toString(),
      icon: CheckCircle,
      color: "text-green-500"
    },
    {
      title: "Implémentés",
      value: changes.filter(c => c.status === 'implemented').length.toString(),
      icon: FileText,
      color: "text-blue-500"
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

      {/* Dialogs CRUD */}
      <CreateDialog
        open={isCreateOpen}
        onOpenChange={closeAll}
        title="Créer un changement"
        description="Créer une nouvelle demande de changement"
      >
        {/* Formulaire de création */}
      </CreateDialog>

      <EditDialog
        open={isEditOpen}
        onOpenChange={closeAll}
        title="Modifier le changement"
        description="Modifier les détails du changement"
      >
        {/* Formulaire d'édition */}
      </EditDialog>

      <DeleteDialog
        open={isDeleteOpen}
        onOpenChange={closeAll}
        title="Supprimer le changement"
        description="Êtes-vous sûr de vouloir supprimer ce changement ?"
        onConfirm={handleDelete}
      />

      {/* Section commentaires */}
      {commentsChange && (
        <CommentsSection
          isOpen={isCommentsOpen}
          onClose={() => setIsCommentsOpen(false)}
          entityId={commentsChange.id}
          entityType="change"
          title={`Commentaires - ${commentsChange.title}`}
        />
      )}
    </div>
  );
};

export default ITSMChanges;