import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Building2, 
  AlertTriangle, 
  Cloud, 
  Shield,
  Activity,
  Bell
} from "lucide-react";
import { 
  PageHeader, 
  StatsCard, 
  DataGrid, 
  ActionCard, 
  QuickActionButton 
} from "@/components/common";
import { useDashboardConfigurations } from "@/hooks/useDashboardConfigurations";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardManager } from "@/components/dashboard/DashboardManager";

const Dashboard = () => {
  const { userProfile } = useAuth();
  const { getCurrentDashboard } = useDashboardConfigurations();
  const { stats } = useDashboardStats();
  
  const isMspAdmin = userProfile?.is_msp_admin || false;
  const currentDashboard = getCurrentDashboard();
  // Si l'utilisateur est admin MSP et qu'il n'y a pas de dashboard configuré, 
  // afficher l'interface de gestion
  if (isMspAdmin && !currentDashboard) {
    return <DashboardManager />;
  }

  const defaultStats = [
    {
      title: "Organisations actives",
      value: stats.organizations.toString(),
      description: "Clients, ESN, MSP",
      icon: Building2,
      trend: "+2 ce mois"
    },
    {
      title: "Utilisateurs",
      value: stats.users.toString(),
      description: "Tous rôles confondus",
      icon: Users,
      trend: "+12 ce mois"
    },
    {
      title: "Incidents ouverts",
      value: stats.incidents.toString(),
      description: "À traiter",
      icon: AlertTriangle,
      trend: "-3 cette semaine"
    },
    {
      title: "Services surveillés",
      value: stats.services.toString(),
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
        title="Tableau de bord"
        description="Vue d'ensemble de votre plateforme MSP"
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Incidents */}
        <div className="col-span-4">
          <ActionCard
            title="Incidents récents"
            description="Les derniers incidents ITSM à traiter"
            icon={AlertTriangle}
            action={{
              label: "Voir tous",
              onClick: () => console.log("Voir tous les incidents")
            }}
          >
            <div className="space-y-4">
              {recentIncidents.map((incident) => (
                <div key={incident.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{incident.title}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(incident.priority)}>
                        {incident.priority}
                      </Badge>
                      <Badge variant={getStatusColor(incident.status)}>
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

        {/* Quick Actions */}
        <div className="col-span-3">
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
                onClick={() => console.log("Créer incident")}
              />
              <QuickActionButton
                title="Inventaire cloud"
                description="Scanner les ressources"
                icon={Cloud}
                iconColor="text-blue-500"
                onClick={() => console.log("Inventaire cloud")}
              />
              <QuickActionButton
                title="Audit sécurité"
                description="CVE et vulnérabilités"
                icon={Shield}
                iconColor="text-green-500"
                onClick={() => console.log("Audit sécurité")}
              />
              <QuickActionButton
                title="Configurer alertes"
                description="Notifications & webhooks"
                icon={Bell}
                iconColor="text-orange-500"
                onClick={() => console.log("Configurer alertes")}
              />
            </div>
          </ActionCard>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;