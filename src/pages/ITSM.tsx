import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  PageHeader, 
  DataGrid, 
  SearchAndFilters,
  EmptyState 
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertTriangle, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Eye,
  Edit,
  Trash2,
  UserPlus
} from "lucide-react";
import { RequestAssignment } from "@/components/itsm/RequestAssignment";
import { SLAStatusBadge } from "@/components/itsm/SLAStatusBadge";
import { useSLATracking } from "@/hooks/useITSMConfig";
import { toast } from "sonner";

interface ITSMItem {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'implemented' | 'failed';
  type: 'incident' | 'change' | 'request';
  assigned_to?: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  scheduled_date?: string;
  metadata?: any;
}

const ITSM = () => {
  const { userProfile, user } = useAuth();
  const [items, setItems] = useState<ITSMItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("incident");

  // Hook pour récupérer les données SLA
  const { data: slaTrackingData = [] } = useSLATracking(userProfile?.default_team_id || '');

  // État pour le modal de création
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
    type: "incident" as const,
    scheduled_date: ""
  });

  useEffect(() => {
    fetchITSMItems();
  }, [userProfile]);

  const fetchITSMItems = async () => {
    try {
      setLoading(true);
      console.log('Fetching ITSM items for team:', userProfile?.default_team_id);
      
      // Récupérer les incidents
      const { data: incidents, error: incidentsError } = await supabase
        .from('itsm_incidents')
        .select(`
          *,
          created_by_profile:profiles!itsm_incidents_created_by_fkey(first_name, last_name, email),
          assigned_to_profile:profiles!itsm_incidents_assigned_to_fkey(first_name, last_name, email)
        `);

      if (incidentsError) {
        console.error('Error fetching incidents:', incidentsError);
        throw incidentsError;
      }

      // Récupérer les changements
      const { data: changes, error: changesError } = await supabase
        .from('itsm_change_requests')
        .select(`
          *,
          requested_by_profile:profiles!itsm_change_requests_requested_by_fkey(first_name, last_name, email),
          approved_by_profile:profiles!itsm_change_requests_approved_by_fkey(first_name, last_name, email)
        `);

      if (changesError) {
        console.error('Error fetching changes:', changesError);
        throw changesError;
      }

      console.log('Fetched incidents:', incidents);
      console.log('Fetched changes:', changes);

      // Combiner et formater les données
      const formattedIncidents = (incidents || []).map(item => ({
        ...item,
        type: 'incident' as const,
        created_by_name: item.created_by_profile 
          ? `${item.created_by_profile.first_name || ''} ${item.created_by_profile.last_name || ''}`.trim() || item.created_by_profile.email
          : item.created_by
      }));

      const formattedChanges = (changes || []).map(item => ({
        ...item,
        type: 'change' as const,
        created_by_name: item.requested_by_profile 
          ? `${item.requested_by_profile.first_name || ''} ${item.requested_by_profile.last_name || ''}`.trim() || item.requested_by_profile.email
          : item.requested_by
      }));

      const allItems = [...formattedIncidents, ...formattedChanges] as ITSMItem[];
      console.log('All ITSM items:', allItems);
      setItems(allItems);
    } catch (error) {
      console.error('Error fetching ITSM items:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const createITSMItem = async () => {
    if (!userProfile?.default_team_id || !user?.id) return;

    try {
      setLoading(true);
      
      const itemData = {
        team_id: userProfile.default_team_id,
        title: newItem.title,
        description: newItem.description,
        priority: newItem.priority,
        created_by: user.id,
        requested_by: user.id, // Pour les changements
        ...((newItem.type as string) === 'change' ? { scheduled_date: newItem.scheduled_date } : {})
      };

      const table = (newItem.type as string) === 'incident' ? 'itsm_incidents' : 'itsm_change_requests';
      
      const { data, error } = await supabase
        .from(table)
        .insert([itemData])
        .select()
        .single();

      if (error) throw error;

      toast.success(`${(newItem.type as string) === 'incident' ? 'Incident' : 'Changement'} créé avec succès`);
      setIsCreateModalOpen(false);
      setNewItem({
        title: "",
        description: "",
        priority: "medium",
        type: "incident",
        scheduled_date: ""
      });
      fetchITSMItems();
    } catch (error) {
      console.error('Error creating ITSM item:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const updateItemStatus = async (itemId: string, newStatus: string, type: string) => {
    try {
      const table = (type as string) === 'incident' ? 'itsm_incidents' : 'itsm_change_requests';
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', itemId);

      if (error) throw error;

      toast.success('Statut mis à jour');
      fetchITSMItems();
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
      case "implemented":
        return "default";
      case "in_progress":
      case "approved":
        return "secondary";
      case "open":
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
      case "resolved":
      case "closed":
      case "implemented":
        return <CheckCircle className="h-4 w-4" />;
      case "failed":
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "in_progress":
      case "approved":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter;
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesTab = activeTab === "all" || (item.type as string) === activeTab;

    return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesTab;
  });

  const stats = [
    {
      title: "Incidents ouverts",
      value: items.filter(i => (i.type as string) === 'incident' && ['open', 'in_progress'].includes(i.status)).length.toString(),
      icon: AlertTriangle,
      color: "text-red-500"
    },
    {
      title: "Changements en cours",
      value: items.filter(i => (i.type as string) === 'change' && ['pending_approval', 'approved'].includes(i.status)).length.toString(),
      icon: FileText,
      color: "text-blue-500"
    },
    {
      title: "Résolus ce mois",
      value: items.filter(i => ['resolved', 'closed', 'implemented'].includes(i.status)).length.toString(),
      icon: CheckCircle,
      color: "text-green-500"
    }
  ];

  if (loading && items.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="ITSM"
          description="Gestion des incidents, changements et demandes de service"
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
        title="ITSM"
        description="Gestion des incidents, changements et demandes de service"
        action={{
          label: "Créer",
          icon: Plus,
          onClick: () => setIsCreateModalOpen(true)
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

      {/* Onglets et filtres */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Tous</TabsTrigger>
              <TabsTrigger value="incident">Incidents</TabsTrigger>
              <TabsTrigger value="change">Changements</TabsTrigger>
              <TabsTrigger value="request">Demandes</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
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
          {filteredItems.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="Aucun élément trouvé"
              description="Aucun incident ou changement ne correspond à vos critères"
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>ID</TableHead>
                     <TableHead>Titre</TableHead>
                     <TableHead>Créé par</TableHead>
                     <TableHead>Priorité</TableHead>
                     <TableHead>Statut</TableHead>
                     <TableHead>SLA</TableHead>
                     <TableHead>Assigné</TableHead>
                     <TableHead>Date création</TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">
                        {(item.type as string) === 'incident' ? 'INC' : 'CHG'}-{item.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {item.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {item.created_by_name || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(item.status)}
                          <Badge variant={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </div>
                       </TableCell>
                       <TableCell>
                         <SLAStatusBadge 
                           tracking={slaTrackingData.find(sla => 
                             (item.type === 'incident' && sla.incident_id === item.id) ||
                             (item.type === 'change' && sla.change_request_id === item.id) ||
                             (item.type === 'request' && sla.service_request_id === item.id)
                           )}
                           size="sm"
                         />
                       </TableCell>
                       <TableCell>
                         <RequestAssignment
                           requestId={item.id}
                           currentAssignee={item.assigned_to}
                           onAssigned={() => fetchITSMItems()}
                         />
                       </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
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
          )}
        </CardContent>
      </Card>

      {/* Section Statut séparée */}
      <Card>
        <CardHeader>
          <CardTitle>Changement de statut</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Badge variant="outline">
                    {(item.type as string) === 'incident' ? 'INC' : 'CHG'}-{item.id.slice(0, 8)}
                  </Badge>
                  <span className="font-medium">{item.title}</span>
                  <Badge variant={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                </div>
                <Select
                  value={item.status}
                  onValueChange={(value) => updateItemStatus(item.id, value, item.type)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(item.type as string) === 'incident' ? (
                      <>
                        <SelectItem value="open">Ouvert</SelectItem>
                        <SelectItem value="in_progress">En cours</SelectItem>
                        <SelectItem value="resolved">Résolu</SelectItem>
                        <SelectItem value="closed">Fermé</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="pending_approval">En attente</SelectItem>
                        <SelectItem value="approved">Approuvé</SelectItem>
                        <SelectItem value="implemented">Implémenté</SelectItem>
                        <SelectItem value="rejected">Rejeté</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de création */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Créer un nouvel élément ITSM</DialogTitle>
            <DialogDescription>
              Créez un incident, un changement ou une demande de service
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={newItem.type} onValueChange={(value: any) => setNewItem({...newItem, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incident">Incident</SelectItem>
                    <SelectItem value="change">Changement</SelectItem>
                    <SelectItem value="request">Demande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priorité</Label>
                <Select value={newItem.priority} onValueChange={(value: any) => setNewItem({...newItem, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Basse</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={newItem.title}
                onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                placeholder="Titre de l'incident ou du changement"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newItem.description}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                placeholder="Description détaillée..."
                rows={4}
              />
            </div>

            {(newItem.type as string) === 'change' ? (
              <div className="space-y-2">
                <Label htmlFor="scheduled_date">Date prévue</Label>
                <Input
                  id="scheduled_date"
                  type="datetime-local"
                  value={newItem.scheduled_date}
                  onChange={(e) => setNewItem({...newItem, scheduled_date: e.target.value})}
                />
              </div>
            ) : null}
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={createITSMItem} disabled={!newItem.title || !newItem.description}>
                Créer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ITSM;