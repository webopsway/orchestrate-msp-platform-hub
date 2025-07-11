import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ITSMLayout } from "@/components/itsm/ITSMLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  HelpCircle, 
  Plus, 
  User,
  Calendar,
  Eye,
  Edit,
  Trash2,
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
}

const ITSMRequests = () => {
  const { sessionContext, user } = useAuth();
  const [requests, setRequests] = useState<ITSMRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

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
          <span className="text-sm">{request.requested_by}</span>
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

  return (
    <ITSMLayout
      title="Demandes de service"
      description="Gestion des demandes de service utilisateur"
      actionLabel="Créer une demande"
      actionIcon={Plus}
      onActionClick={() => console.log('Create request')}
      stats={stats}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Rechercher des demandes..."
      filters={filters}
      columns={columns}
      data={filteredRequests}
      loading={loading}
    />
  );
};

export default ITSMRequests;