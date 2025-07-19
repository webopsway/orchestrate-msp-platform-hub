import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Building2, 
  AlertTriangle, 
  Cloud, 
  Shield,
  Activity,
  Bell,
  TrendingUp,
  Server,
  Database
} from "lucide-react";
import { 
  PageHeader, 
  StatsCard, 
  DataGrid, 
  ActionCard, 
  QuickActionButton 
} from "@/components/common";
import { useDashboardStats } from "@/hooks/useDashboardStats";

const Dashboard = () => {
  const { stats, loading } = useDashboardStats();

  const defaultStats = [
    {
      title: "Organisations actives",
      value: loading ? "..." : stats.organizations.toString(),
      description: "Clients, ESN, MSP",
      icon: Building2,
      trend: "+2 ce mois"
    },
    {
      title: "Utilisateurs",
      value: loading ? "..." : stats.users.toString(),
      description: "Tous rôles confondus",
      icon: Users,
      trend: "+12 ce mois"
    },
    {
      title: "Incidents ouverts",
      value: loading ? "..." : stats.incidents.toString(),
      description: "À traiter",
      icon: AlertTriangle,
      trend: "-3 cette semaine"
    },
    {
      title: "Services surveillés",
      value: loading ? "..." : stats.services.toString(),
      description: "Infrastructure cloud",
      icon: Cloud,
      trend: "+15 ce mois"
    }
  ];

  const recentIncidents = [
    {
      id: "INC-2024-001",
      title: "Panne serveur principal client ABC",
      priority: "Critique",
      status: "En cours",
      assignee: "Jean Dupont"
    },
    {
      id: "INC-2024-002", 
      title: "Lenteur réseau site Paris",
      priority: "Majeure",
      status: "Attribué",
      assignee: "Marie Martin"
    },
    {
      id: "INC-2024-003",
      title: "Erreur sauvegarde base données",
      priority: "Mineure",
      status: "Résolu",
      assignee: "Pierre Leblanc"
    }
  ];

  const systemHealth = [
    { name: "Serveurs", status: "Opérationnel", count: 47, icon: Server },
    { name: "Bases de données", status: "Opérationnel", count: 12, icon: Database },
    { name: "Monitoring", status: "Actif", count: 156, icon: Activity },
    { name: "Alertes", status: "2 Actives", count: 2, icon: Bell }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critique": return "destructive";
      case "Majeure": return "secondary";
      case "Mineure": return "outline";
      default: return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Résolu": return "default";
      case "En cours": return "secondary";
      case "Attribué": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord MSP"
        description="Vue d'ensemble de votre plateforme de services managés"
      />

      {/* Statistics Cards */}
      <DataGrid columns={4}>
        {defaultStats.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            trend={stat.trend}
          />
        ))}
      </DataGrid>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Incidents */}
        <div className="lg:col-span-2">
          <ActionCard
            title="Incidents critiques"
            description="Tickets ITSM nécessitant une attention immédiate"
            icon={AlertTriangle}
            action={{
              label: "Voir tous",
              onClick: () => window.location.href = "/itsm/incidents"
            }}
          >
            <div className="space-y-3">
              {recentIncidents.map((incident) => (
                <div key={incident.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{incident.title}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(incident.priority)} className="text-xs">
                        {incident.priority}
                      </Badge>
                      <Badge variant={getStatusColor(incident.status)} className="text-xs">
                        {incident.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {incident.id}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Assigné à</p>
                    <p className="text-sm font-medium">{incident.assignee}</p>
                  </div>
                </div>
              ))}
            </div>
          </ActionCard>
        </div>

        {/* System Health */}
        <div className="space-y-6">
          <ActionCard
            title="État du système"
            description="Santé de l'infrastructure managée"
            icon={TrendingUp}
          >
            <div className="space-y-3">
              {systemHealth.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.count} éléments</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </ActionCard>

          {/* Quick Actions */}
          <ActionCard
            title="Actions rapides"
            description="Accès direct aux fonctions principales"
            icon={Activity}
          >
            <div className="space-y-2">
              <QuickActionButton
                title="Créer un incident"
                description="Nouveau ticket ITSM"
                icon={AlertTriangle}
                iconColor="text-red-500"
                onClick={() => window.location.href = "/itsm/incidents"}
              />
              <QuickActionButton
                title="Inventaire cloud"
                description="Scanner les ressources"
                icon={Cloud}
                iconColor="text-blue-500"
                onClick={() => window.location.href = "/cloud/inventory"}
              />
              <QuickActionButton
                title="Audit sécurité"
                description="CVE et vulnérabilités"
                icon={Shield}
                iconColor="text-green-500"
                onClick={() => window.location.href = "/security/vulnerabilities"}
              />
              <QuickActionButton
                title="Gestion des clients"
                description="Relations MSP-Client"
                icon={Building2}
                iconColor="text-purple-500"
                onClick={() => window.location.href = "/msp-client-relations"}
              />
            </div>
          </ActionCard>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;