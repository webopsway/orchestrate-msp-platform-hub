import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Settings, 
  Clock,
  Plus,
  User,
  Calendar
} from "lucide-react";
import { 
  PageHeader, 
  StatsCard, 
  SearchAndFilters, 
  DataGrid, 
  EmptyState 
} from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ITSM = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const stats = [
    {
      title: "Incidents ouverts",
      value: "8",
      description: "En cours de traitement",
      icon: AlertTriangle,
      trend: "-2 cette semaine",
      trendColor: "green" as const
    },
    {
      title: "Demandes en attente",
      value: "15",
      description: "À assigner",
      icon: Clock,
      trend: "+3 aujourd'hui",
      trendColor: "orange" as const
    },
    {
      title: "Changements planifiés",
      value: "4",
      description: "Cette semaine",
      icon: Settings,
      trend: "Stable",
      trendColor: "blue" as const
    },
    {
      title: "Temps de résolution moyen",
      value: "2.5h",
      description: "SLA respecté",
      icon: Clock,
      trend: "-30min ce mois",
      trendColor: "green" as const
    }
  ];

  const tickets = [
    {
      id: "INC-2024-001",
      title: "Panne serveur principal client ABC",
      type: "Incident",
      priority: "Critique",
      status: "En cours",
      assignee: "Jean Dupont",
      created: "Il y a 2h",
      client: "TechCorp Solutions"
    },
    {
      id: "REQ-2024-045", 
      title: "Demande d'accès nouvelle application",
      type: "Demande",
      priority: "Normale",
      status: "Attribué",
      assignee: "Marie Martin",
      created: "Il y a 4h",
      client: "DevPro ESN"
    },
    {
      id: "CHG-2024-012",
      title: "Mise à jour sécurité serveurs web",
      type: "Changement",
      priority: "Majeure",
      status: "Planifié",
      assignee: "Pierre Leblanc",
      created: "Il y a 1 jour",
      client: "CloudMax MSP"
    },
    {
      id: "INC-2024-002",
      title: "Lenteur réseau site Paris",
      type: "Incident",
      priority: "Mineure",
      status: "Résolu",
      assignee: "Sophie Durand",
      created: "Il y a 2 jours",
      client: "StartupXYZ"
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Incident": return "destructive";
      case "Demande": return "default";
      case "Changement": return "secondary";
      default: return "outline";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critique": return "destructive";
      case "Majeure": return "secondary";
      case "Normale": return "default";
      case "Mineure": return "outline";
      default: return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Résolu": return "default";
      case "En cours": return "secondary";
      case "Attribué": return "outline";
      case "Planifié": return "default";
      default: return "outline";
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.client.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="ITSM"
        description="Gestion des incidents, demandes et changements"
        action={{
          label: "Nouveau ticket",
          icon: Plus,
          onClick: () => console.log("Nouveau ticket")
        }}
      />

      <DataGrid columns={4}>
        {stats.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            trend={stat.trend}
            trendColor={stat.trendColor}
          />
        ))}
      </DataGrid>

      <SearchAndFilters
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Rechercher un ticket..."
        onAdvancedFiltersClick={() => console.log("Filtres avancés")}
      />

      <DataGrid columns={2}>
        {filteredTickets.map((ticket) => (
          <Card key={ticket.id} className="hover:shadow-md transition-shadow animate-fade-in">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={getTypeColor(ticket.type)}>{ticket.type}</Badge>
                    <Badge variant={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                    <Badge variant={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                  </div>
                  <CardTitle className="text-lg">{ticket.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{ticket.id}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{ticket.assignee}</p>
                      <p className="text-muted-foreground">Assigné à</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{ticket.created}</p>
                      <p className="text-muted-foreground">Créé</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Client: {ticket.client}
                    </span>
                    <Button variant="outline" size="sm">
                      Voir détails
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </DataGrid>

      {filteredTickets.length === 0 && (
        <EmptyState
          icon={AlertTriangle}
          title="Aucun ticket trouvé"
          description="Essayez de modifier vos critères de recherche"
          action={{
            label: "Créer un nouveau ticket",
            onClick: () => console.log("Créer ticket")
          }}
        />
      )}
    </div>
  );
};

export default ITSM;