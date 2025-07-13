import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  AlertTriangle, 
  Clock,
  Plus,
  Calendar,
  Wrench,
  Activity,
  Server
} from "lucide-react";
import { 
  PageHeader, 
  StatsCard, 
  SearchAndFilters, 
  DataGrid, 
  EmptyState 
} from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Security = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [patchSchedules, setPatchSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Load patch schedules
      const { data: patchData, error: patchError } = await supabase
        .from('patch_schedules')
        .select('*, cloud_asset(*)')
        .order('scheduled_at', { ascending: true });

      if (patchError) throw patchError;

      setPatchSchedules(patchData || []);
    } catch (error) {
      console.error('Error loading security data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de sécurité",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSchedulePatch = async () => {
    try {
      // Get first cloud asset for demo
      const { data: assets } = await supabase
        .from('cloud_asset')
        .select('*')
        .limit(1);

      if (!assets || assets.length === 0) {
        toast({
          title: "Aucun asset",
          description: "Aucun asset cloud trouvé pour planifier un patch",
          variant: "destructive",
        });
        return;
      }

      const asset = assets[0];
      const scheduledAt = new Date();
      scheduledAt.setHours(scheduledAt.getHours() + 2); // Schedule 2 hours from now

      const { data, error } = await supabase.functions.invoke('security-patch-scheduler', {
        body: {
          cloud_asset_id: asset.id,
          team_id: asset.team_id,
          scheduled_at: scheduledAt.toISOString(),
          description: 'Patch de sécurité automatique',
          patch_type: 'security'
        }
      });

      if (error) throw error;

      toast({
        title: "Patch planifié",
        description: `Patch planifié pour ${asset.asset_name} dans 2 heures`,
      });

      // Reload data
      loadSecurityData();
    } catch (error) {
      console.error('Error scheduling patch:', error);
      toast({
        title: "Erreur",
        description: "Impossible de planifier le patch",
        variant: "destructive",
      });
    }
  };

  const stats = [
    {
      title: "Patchs planifiés",
      value: patchSchedules.filter(p => p.status === 'scheduled').length.toString(),
      description: "À exécuter",
      icon: Clock,
      trend: "+2 aujourd'hui",
      trendColor: "blue" as const
    },
    {
      title: "Assets scannés",
      value: "12",
      description: "Dernières 24h",
      icon: Server,
      trend: "100% couverture",
      trendColor: "green" as const
    },
    {
      title: "Patchs exécutés",
      value: patchSchedules.filter(p => p.status === 'completed').length.toString(),
      description: "Ce mois",
      icon: Activity,
      trend: "+5 ce mois",
      trendColor: "green" as const
    },
    {
      title: "Temps moyen d'exécution",
      value: "45m",
      description: "Derniers patchs",
      icon: AlertTriangle,
      trend: "-10m ce mois",
      trendColor: "green" as const
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "secondary";
      case "medium": return "default";
      case "low": return "outline";
      default: return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "destructive";
      case "in_progress": return "secondary";
      case "resolved": return "default";
      case "closed": return "outline";
      case "scheduled": return "default";
      case "completed": return "default";
      case "failed": return "destructive";
      default: return "outline";
    }
  };

  const filteredPatchSchedules = patchSchedules.filter(patch =>
    patch.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patch.cloud_asset?.asset_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sécurité"
        description="Planification des patchs de sécurité"
        action={{
          label: "Planifier un patch",
          icon: Shield,
          onClick: handleSchedulePatch
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
        placeholder="Rechercher un patch..."
        onAdvancedFiltersClick={() => console.log("Filtres avancés")}
      />

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Patchs planifiés</h3>
          <Button onClick={handleSchedulePatch} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Planifier un patch
          </Button>
        </div>

        <DataGrid columns={2}>
          {filteredPatchSchedules.map((patch) => (
            <Card key={patch.id} className="hover:shadow-md transition-shadow animate-fade-in">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{patch.patch_type}</Badge>
                      <Badge variant={getStatusColor(patch.status)}>{patch.status}</Badge>
                    </div>
                    <CardTitle className="text-lg">
                      Patch pour {patch.cloud_asset?.asset_name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {patch.description || 'Aucune description'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {new Date(patch.scheduled_at).toLocaleString()}
                        </p>
                        <p className="text-muted-foreground">Planifié</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{patch.cloud_asset?.asset_type || 'Type inconnu'}</p>
                        <p className="text-muted-foreground">Type d'asset</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        ID: {patch.id.slice(0, 8)}...
                      </span>
                      <div className="flex gap-2">
                        {patch.status === 'scheduled' && (
                          <Button variant="outline" size="sm">
                            Exécuter maintenant
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          Voir détails
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </DataGrid>

        {filteredPatchSchedules.length === 0 && (
          <EmptyState
            icon={Wrench}
            title="Aucun patch planifié"
            description="Aucun patch ne correspond à vos critères de recherche"
            action={{
              label: "Planifier un patch",
              onClick: handleSchedulePatch
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Security;