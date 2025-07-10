import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Building2, 
  AlertTriangle, 
  CheckCircle, 
  Cloud, 
  Shield,
  Activity,
  Bell
} from "lucide-react";

const Dashboard = () => {
  const stats = [
    {
      title: "Organisations actives",
      value: "24",
      description: "Clients, ESN, MSP",
      icon: Building2,
      trend: "+2 ce mois"
    },
    {
      title: "Utilisateurs",
      value: "156",
      description: "Tous rôles confondus",
      icon: Users,
      trend: "+12 ce mois"
    },
    {
      title: "Incidents ouverts",
      value: "8",
      description: "À traiter",
      icon: AlertTriangle,
      trend: "-3 cette semaine"
    },
    {
      title: "Services surveillés",
      value: "342",
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tableau de bord</h2>
        <p className="text-muted-foreground">
          Vue d'ensemble de votre plateforme MSP
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Incidents */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Incidents récents
            </CardTitle>
            <CardDescription>
              Les derniers incidents ITSM à traiter
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Actions rapides
            </CardTitle>
            <CardDescription>
              Accès direct aux fonctions principales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <button className="flex items-center justify-start gap-3 p-3 text-left border rounded-lg hover:bg-accent transition-colors">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Créer un incident</p>
                  <p className="text-xs text-muted-foreground">Nouveau ticket ITSM</p>
                </div>
              </button>
              <button className="flex items-center justify-start gap-3 p-3 text-left border rounded-lg hover:bg-accent transition-colors">
                <Cloud className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Inventaire cloud</p>
                  <p className="text-xs text-muted-foreground">Scanner les ressources</p>
                </div>
              </button>
              <button className="flex items-center justify-start gap-3 p-3 text-left border rounded-lg hover:bg-accent transition-colors">
                <Shield className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Audit sécurité</p>
                  <p className="text-xs text-muted-foreground">CVE et vulnérabilités</p>
                </div>
              </button>
              <button className="flex items-center justify-start gap-3 p-3 text-left border rounded-lg hover:bg-accent transition-colors">
                <Bell className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Configurer alertes</p>
                  <p className="text-xs text-muted-foreground">Notifications & webhooks</p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;