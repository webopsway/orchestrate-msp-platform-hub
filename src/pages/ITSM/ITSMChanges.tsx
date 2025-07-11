import { useState, useEffect } from "react";
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
  Trash2
} from "lucide-react";
import { useITSMCrud } from "@/hooks/useITSMCrud";
import { 
  MessageSquare
} from "lucide-react";
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
  const { sessionContext, user } = useAuth();
  const [changes, setChanges] = useState<ITSMChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const fetchChanges = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('itsm_change_requests')
        .select(`
          *,
          requested_by_profile:profiles!requested_by (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChanges((data || []) as ITSMChange[]);
    } catch (error) {
      console.error('Error fetching changes:', error);
      toast.error('Erreur lors du chargement des changements');
    } finally {
      setLoading(false);
    }
  };

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
    fetchChanges();
  }, [sessionContext]);

  const updateChangeStatus = async (changeId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('itsm_change_requests')
        .update({ status: newStatus })
        .eq('id', changeId);

      if (error) throw error;

      toast.success('Statut mis à jour');
      fetchChanges();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getStatusColor = (status: string) => {
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
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "implemented":
        return <CheckCircle className="h-4 w-4" />;
      case "failed":
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "approved":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getRequesterDisplayName = (change: ITSMChange) => {
    const profile = change.requested_by_profile;
    if (!profile) return "N/A";
    
    if (profile.first_name || profile.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return profile.email;
  };

  const filteredChanges = changes.filter(change => {
    const matchesSearch = change.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         change.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || change.status === statusFilter;
    const matchesType = typeFilter === "all" || change.change_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = [
    {
      title: "En attente d'approbation",
      value: changes.filter(c => c.status === 'pending_approval').length.toString(),
      icon: FileText,
      color: "text-yellow-500"
    },
    {
      title: "Approuvés",
      value: changes.filter(c => c.status === 'approved').length.toString(),
      icon: CheckCircle,
      color: "text-blue-500"
    },
    {
      title: "Implémentés",
      value: changes.filter(c => c.status === 'implemented').length.toString(),
      icon: CheckCircle,
      color: "text-green-500"
    }
  ];

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

      {/* Filtres */}
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
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="pending_approval">En attente</SelectItem>
                  <SelectItem value="approved">Approuvé</SelectItem>
                  <SelectItem value="implemented">Implémenté</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                  <SelectItem value="failed">Échoué</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="emergency">Urgence</SelectItem>
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
                {filteredChanges.map((change) => (
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
                        {change.change_type || 'Standard'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ChangeStatusUpdate
                        changeId={change.id}
                        currentStatus={change.status}
                        onStatusUpdated={() => fetchChanges()}
                      />
                    </TableCell>
                    <TableCell>
                      <ChangeAssignment
                        changeId={change.id}
                        currentAssignee={change.assigned_to}
                        onAssigned={() => fetchChanges()}
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
                          onClick={() => {
                            setCommentsChange(change);
                            setIsCommentsOpen(true);
                          }}
                          title="Voir les commentaires"
                        >
                          <MessageSquare className="h-4 w-4" />
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
              .from('itsm_change_requests')
              .insert([{
                ...formData,
                requested_by: user?.id,
                team_id: sessionContext?.current_team_id
              }]);
            
            if (error) throw error;
            return true;
          }, data);
          
          return success;
        }}
        title="Créer une demande de changement"
        sections={[
          {
            title: "Informations générales",
            fields: [
              {
                key: "title",
                label: "Titre",
                type: "text",
                required: true,
                placeholder: "Titre du changement"
              },
              {
                key: "description",
                label: "Description",
                type: "textarea",
                placeholder: "Description détaillée du changement"
              }
            ]
          },
          {
            title: "Classification",
            fields: [
              {
                key: "change_type",
                label: "Type de changement",
                type: "select",
                required: true,
                options: [
                  { value: "standard", label: "Standard" },
                  { value: "normal", label: "Normal" },
                  { value: "emergency", label: "Urgence" }
                ]
              },
              {
                key: "status",
                label: "Statut",
                type: "select",
                required: true,
                options: [
                  { value: "draft", label: "Brouillon" },
                  { value: "pending_approval", label: "En attente" },
                  { value: "approved", label: "Approuvé" },
                  { value: "implemented", label: "Implémenté" },
                  { value: "rejected", label: "Rejeté" },
                  { value: "failed", label: "Échoué" }
                ]
              },
              {
                key: "scheduled_date",
                label: "Date prévue",
                type: "date",
                placeholder: "Date d'implémentation prévue"
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
              .from('itsm_change_requests')
              .update(formData)
              .eq('id', selectedChange?.id);
            
            if (error) throw error;
            return true;
          }, data);
          
          return success;
        }}
        title="Modifier la demande de changement"
        data={selectedChange}
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
                key: "change_type",
                label: "Type de changement",
                type: "select",
                required: true,
                options: [
                  { value: "standard", label: "Standard" },
                  { value: "normal", label: "Normal" },
                  { value: "emergency", label: "Urgence" }
                ]
              },
              {
                key: "status",
                label: "Statut",
                type: "select",
                required: true,
                options: [
                  { value: "draft", label: "Brouillon" },
                  { value: "pending_approval", label: "En attente" },
                  { value: "approved", label: "Approuvé" },
                  { value: "implemented", label: "Implémenté" },
                  { value: "rejected", label: "Rejeté" },
                  { value: "failed", label: "Échoué" }
                ]
              },
              {
                key: "scheduled_date",
                label: "Date prévue",
                type: "date"
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
              .from('itsm_change_requests')
              .delete()
              .eq('id', selectedChange?.id);
            
            if (error) throw error;
            return true;
          });
        }}
        title="Supprimer la demande de changement"
        itemName={selectedChange?.title || ""}
        displayFields={[
          { key: "title", label: "Titre" },
          { key: "change_type", label: "Type" },
          { key: "status", label: "Statut" },
          { key: "created_at", label: "Créé le", render: (value) => new Date(value).toLocaleDateString() }
        ]}
        data={selectedChange}
      />

      
      {/* Commentaires */}
      {isCommentsOpen && commentsChange && (
        <CommentsSection
          ticketId={commentsChange.id}
          ticketType="change_request"
        />
      )}
    </div>
  );
};

export default ITSMChanges;