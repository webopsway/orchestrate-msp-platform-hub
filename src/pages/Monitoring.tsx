import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Server, 
  Cpu,
  HardDrive,
  Wifi,
  AlertCircle,
  CheckCircle,
  Settings
} from "lucide-react";
import { 
  PageHeader, 
  StatsCard, 
  SearchAndFilters, 
  DataGrid, 
  ActionCard 
} from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Monitoring = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const stats = [
    {
      title: "Services surveillés",
      value: "342",
      description: "Infrastructure totale",
      icon: Server,
      trend: "+15 ce mois",
      trendColor: "green" as const
    },
    {
      title: "Alertes actives",
      value: "12",
      description: "À traiter",
      icon: AlertCircle,
      trend: "-5 aujourd'hui",
      trendColor: "green" as const
    },
    {
      title: "Uptime moyen",
      value: "99.8%",
      description: "30 derniers jours",
      icon: CheckCircle,
      trend: "+0.2% ce mois",
      trendColor: "green" as const
    },
    {
      title: "Métriques collectées",
      value: "1.2M",
      description: "Dernières 24h",
      icon: Activity,
      trend: "Stable",
      trendColor: "blue" as const
    }
  ];

  const services = [
    {
      id: 1,
      name: "prod-web-01.techcorp.com",
      type: "Serveur Web",
      status: "En ligne",
      uptime: "99.9%",
      cpu: "78%",
      memory: "64%",
      disk: "45%",
      client: "TechCorp Solutions",
      lastCheck: "Il y a 30s"
    },
    {
      id: 2,
      name: "db-primary.devpro.fr",
      type: "Base de données",
      status: "Critique",
      uptime: "98.2%",
      cpu: "92%",
      memory: "87%",
      disk: "89%",
      client: "DevPro ESN",
      lastCheck: "Il y a 1min"
    },
    {
      id: 3,
      name: "loadbalancer.cloudmax.net",
      type: "Load Balancer",
      status: "En ligne",
      uptime: "100%",
      cpu: "34%",
      memory: "52%",
      disk: "23%",
      client: "CloudMax MSP",
      lastCheck: "Il y a 15s"
    },
    {
      id: 4,
      name: "backup-server.startup.io",
      type: "Serveur Backup",
      status: "Attention",
      uptime: "97.5%",
      cpu: "45%",
      memory: "89%",
      disk: "95%",
      client: "StartupXYZ",
      lastCheck: "Il y a 2min"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "En ligne": return "default";
      case "Critique": return "destructive";
      case "Attention": return "secondary";
      case "Hors ligne": return "outline";
      default: return "outline";
    }
  };

  const getMetricClass = (value: string) => {
    const numValue = parseInt(value);
    if (numValue >= 90) return "text-red-600";
    if (numValue >= 75) return "text-orange-600";
    return "text-green-600";
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.client.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoring"
        description="Supervision de l'infrastructure et des services"
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
        placeholder="Rechercher un service..."
        onAdvancedFiltersClick={() => console.log("Filtres avancés")}
      />

      <DataGrid columns={2}>
        {filteredServices.map((service) => (
          <Card key={service.id} className="hover:shadow-md transition-shadow animate-fade-in">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-primary" />
                    <Badge variant={getStatusColor(service.status)}>{service.status}</Badge>
                  </div>
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{service.type}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className={`font-medium ${getMetricClass(service.cpu)}`}>{service.cpu}</p>
                      <p className="text-muted-foreground">CPU</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className={`font-medium ${getMetricClass(service.memory)}`}>{service.memory}</p>
                      <p className="text-muted-foreground">RAM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className={`font-medium ${getMetricClass(service.disk)}`}>{service.disk}</p>
                      <p className="text-muted-foreground">Disque</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">Uptime: {service.uptime}</p>
                      <p className="text-muted-foreground">{service.client}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Dernière vérification</p>
                      <p className="font-medium">{service.lastCheck}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </DataGrid>

      <div className="grid gap-4 md:grid-cols-2">
        <ActionCard
          title="Alertes récentes"
          description="Incidents détectés automatiquement"
          icon={AlertCircle}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">CPU supérieur à 90% sur prod-web-01</p>
                <p className="text-xs text-muted-foreground">Il y a 5 minutes</p>
              </div>
              <Badge variant="destructive">Critique</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Disque plein sur backup-server</p>
                <p className="text-xs text-muted-foreground">Il y a 15 minutes</p>
              </div>
              <Badge variant="secondary">Attention</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Connectivité réseau rétablie</p>
                <p className="text-xs text-muted-foreground">Il y a 1 heure</p>
              </div>
              <Badge variant="default">Résolu</Badge>
            </div>
          </div>
        </ActionCard>

        <ActionCard
          title="Actions de maintenance"
          description="Tâches programmées et en cours"
          icon={Settings}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Sauvegarde quotidienne</p>
                <p className="text-xs text-muted-foreground">Prochaine: 02:00</p>
              </div>
              <Badge variant="default">Planifiée</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Mise à jour sécurité</p>
                <p className="text-xs text-muted-foreground">Dimanche 22:00</p>
              </div>
              <Badge variant="secondary">En attente</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Nettoyage logs anciens</p>
                <p className="text-xs text-muted-foreground">Terminé à 03:30</p>
              </div>
              <Badge variant="outline">Terminé</Badge>
            </div>
          </div>
        </ActionCard>
      </div>
    </div>
  );
};

export default Monitoring;