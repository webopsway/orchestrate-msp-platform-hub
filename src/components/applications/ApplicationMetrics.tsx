import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Minus,
  Server,
  Code,
  Package
} from 'lucide-react';
import type { ApplicationStats } from '@/types/application';

interface ApplicationMetricsProps {
  stats: ApplicationStats;
  className?: string;
}

export const ApplicationMetrics: React.FC<ApplicationMetricsProps> = ({
  stats,
  className
}) => {
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getApplicationTypeColor = (type: string) => {
    switch (type) {
      case 'web': return 'bg-blue-500';
      case 'api': return 'bg-green-500';
      case 'mobile': return 'bg-purple-500';
      case 'database': return 'bg-orange-500';
      case 'microservice': return 'bg-cyan-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthStatusColor = (status: 'healthy' | 'warning' | 'critical' | 'unknown') => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthStatusLabel = (status: 'healthy' | 'warning' | 'critical' | 'unknown') => {
    switch (status) {
      case 'healthy': return 'Sain';
      case 'warning': return 'Attention';
      case 'critical': return 'Critique';
      default: return 'Inconnu';
    }
  };

  const businessServicesCoveragePercentage = Math.round(
    (stats.business_services_coverage.with_services / (stats.total || 1)) * 100
  );

  const healthyPercentage = Math.round(
    (stats.health_metrics.healthy / (stats.total || 1)) * 100
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Applications totales</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Server className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              {getTrendIcon('up')}
              <span className="text-muted-foreground">+3 ce mois</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Déploiements actifs</p>
                <p className="text-2xl font-bold text-green-600">{stats.deployment_stats.active_environments}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              {getTrendIcon('up')}
              <span className="text-muted-foreground">{stats.deployment_stats.recent_deployments} récents</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Services métiers</p>
                <p className="text-2xl font-bold text-purple-600">{businessServicesCoveragePercentage}%</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2">
              <Progress value={businessServicesCoveragePercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Santé globale</p>
                <p className="text-2xl font-bold text-blue-600">{healthyPercentage}%</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2">
              <Progress value={healthyPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Répartition par type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Répartition par type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.by_type).map(([type, count]) => (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getApplicationTypeColor(type)}`} />
                      <span className="text-sm font-medium capitalize">{type}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{count}</div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round((count / (stats.total || 1)) * 100)}%
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={(count / (stats.total || 1)) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Technologies populaires */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Technologies populaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.by_technology.slice(0, 8).map((tech) => (
                <div key={tech.technology} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">
                      {tech.technology}
                    </span>
                    <div className="text-right">
                      <div className="font-medium">{tech.count}</div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round((tech.count / (stats.total || 1)) * 100)}%
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={(tech.count / (stats.total || 1)) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
              {stats.by_technology.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  Aucune technologie enregistrée
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métriques de santé et déploiements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* État de santé des applications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              État de santé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.health_metrics).map(([status, count]) => (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getHealthStatusColor(status as any)}`} />
                      <span className="text-sm font-medium">
                        {getHealthStatusLabel(status as any)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{count}</div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round((count / (stats.total || 1)) * 100)}%
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={(count / (stats.total || 1)) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Statistiques de déploiement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activité de déploiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Déploiements totaux</span>
                <div className="text-right">
                  <div className="font-medium text-blue-600">
                    {stats.deployment_stats.total_deployments}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Ce mois
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Environnements actifs</span>
                <div className="text-right">
                  <div className="font-medium text-green-600">
                    {stats.deployment_stats.active_environments}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    En ligne
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Déploiements récents</span>
                <div className="text-right">
                  <div className="font-medium text-orange-600">
                    {stats.deployment_stats.recent_deployments}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    7 derniers jours
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicateurs de couverture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Couverture des services métiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Applications avec services métiers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Applications liées</span>
                <span className="text-sm text-muted-foreground">
                  {stats.business_services_coverage.with_services} / {stats.total}
                </span>
              </div>
              <Progress value={businessServicesCoveragePercentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Objectif: 90%</span>
                <span className={businessServicesCoveragePercentage >= 90 ? 'text-green-600' : 'text-orange-600'}>
                  {businessServicesCoveragePercentage >= 90 ? 'Atteint' : 'En cours'}
                </span>
              </div>
            </div>

            {/* Applications sans services métiers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Applications non liées</span>
                <span className="text-sm text-muted-foreground">
                  {stats.business_services_coverage.without_services}
                </span>
              </div>
              <Progress 
                value={((stats.business_services_coverage.without_services) / (stats.total || 1)) * 100} 
                className="h-2" 
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>À traiter</span>
                <span className="text-orange-600">
                  {stats.business_services_coverage.without_services} restantes
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 