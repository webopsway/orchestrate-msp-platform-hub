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
  Minus
} from 'lucide-react';
import type { BusinessServiceStats } from '@/types/businessService';

interface BusinessServiceMetricsProps {
  stats: BusinessServiceStats;
  className?: string;
}

export const BusinessServiceMetrics: React.FC<BusinessServiceMetricsProps> = ({
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

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCriticalityLabel = (criticality: string) => {
    switch (criticality) {
      case 'low': return 'Faible';
      case 'medium': return 'Moyenne';
      case 'high': return 'Élevée';
      case 'critical': return 'Critique';
      default: return criticality;
    }
  };

  const slaCompliancePercentage = stats.sla_compliance.average;
  const appCoveragePercentage = Math.round(
    (stats.applications_coverage.with_apps / (stats.total || 1)) * 100
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Services totaux</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              {getTrendIcon('up')}
              <span className="text-muted-foreground">+12% ce mois</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Services critiques</p>
                <p className="text-2xl font-bold text-red-600">{stats.by_criticality.critical}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              {getTrendIcon('stable')}
              <span className="text-muted-foreground">Stable</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Couverture apps</p>
                <p className="text-2xl font-bold text-green-600">{appCoveragePercentage}%</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2">
              <Progress value={appCoveragePercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conformité SLA</p>
                <p className="text-2xl font-bold text-blue-600">{slaCompliancePercentage}%</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2">
              <Progress value={slaCompliancePercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Répartition par criticité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Répartition par criticité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.by_criticality).map(([level, count]) => (
                <div key={level} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getCriticalityColor(level)}`} />
                      <span className="text-sm font-medium">
                        {getCriticalityLabel(level)}
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

        {/* Répartition par équipe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Répartition par équipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.by_team.slice(0, 5).map((team) => (
                <div key={team.team_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">
                      {team.team_name}
                    </span>
                    <div className="text-right">
                      <div className="font-medium">{team.count}</div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round((team.count / (stats.total || 1)) * 100)}%
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={(team.count / (stats.total || 1)) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
              {stats.by_team.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  Aucune donnée d'équipe disponible
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métriques de santé */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Indicateurs de santé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Applications liées */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Services avec applications</span>
                <span className="text-sm text-muted-foreground">
                  {stats.applications_coverage.with_apps} / {stats.total}
                </span>
              </div>
              <Progress value={appCoveragePercentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Objectif: 80%</span>
                <span className={appCoveragePercentage >= 80 ? 'text-green-600' : 'text-orange-600'}>
                  {appCoveragePercentage >= 80 ? 'Atteint' : 'En cours'}
                </span>
              </div>
            </div>

            {/* Conformité SLA */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Conformité SLA</span>
                <span className="text-sm text-muted-foreground">
                  {stats.sla_compliance.compliant} / {stats.total}
                </span>
              </div>
              <Progress value={slaCompliancePercentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Objectif: 95%</span>
                <span className={slaCompliancePercentage >= 95 ? 'text-green-600' : 'text-orange-600'}>
                  {slaCompliancePercentage >= 95 ? 'Atteint' : 'En cours'}
                </span>
              </div>
            </div>

            {/* Services critiques */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Services critiques</span>
                <span className="text-sm text-muted-foreground">
                  {stats.by_criticality.critical + stats.by_criticality.high} / {stats.total}
                </span>
              </div>
              <Progress 
                value={((stats.by_criticality.critical + stats.by_criticality.high) / (stats.total || 1)) * 100} 
                className="h-2" 
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Surveillance renforcée</span>
                <span className="text-red-600">
                  {stats.by_criticality.critical} critiques
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 