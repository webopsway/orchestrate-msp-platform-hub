import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Server,
  Code,
  Package,
  GitBranch,
  FileText,
  Globe,
  Users,
  Calendar,
  ExternalLink,
  BarChart3,
  Activity,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DeploymentManager } from './DeploymentManager';
import type { ApplicationWithDetails, BusinessServiceSummary } from '@/types/application';

interface ApplicationDetailViewProps {
  application: ApplicationWithDetails;
  onEdit?: () => void;
  onClose?: () => void;
}

export const ApplicationDetailView: React.FC<ApplicationDetailViewProps> = ({
  application,
  onEdit,
  onClose
}) => {
  const getApplicationTypeIcon = (type: string) => {
    switch (type) {
      case 'web': return <Globe className="h-4 w-4" />;
      case 'api': return <Server className="h-4 w-4" />;
      case 'mobile': return <Package className="h-4 w-4" />;
      case 'database': return <FileText className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

  const getApplicationTypeBadge = (type: string) => {
    const colors = {
      web: 'bg-blue-100 text-blue-800',
      api: 'bg-green-100 text-green-800',
      mobile: 'bg-purple-100 text-purple-800',
      database: 'bg-orange-100 text-orange-800',
      microservice: 'bg-cyan-100 text-cyan-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthStatus = (score: number) => {
    if (score >= 90) return { icon: CheckCircle, color: 'text-green-600', label: 'Excellent' };
    if (score >= 75) return { icon: TrendingUp, color: 'text-blue-600', label: 'Bon' };
    if (score >= 50) return { icon: AlertTriangle, color: 'text-yellow-600', label: 'Attention' };
    return { icon: AlertTriangle, color: 'text-red-600', label: 'Critique' };
  };

  const healthStatus = getHealthStatus(application.metrics?.health_score || 0);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {getApplicationTypeIcon(application.application_type)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{application.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getApplicationTypeBadge(application.application_type)}>
                  {application.application_type}
                </Badge>
                {application.version && (
                  <Badge variant="outline">v{application.version}</Badge>
                )}
                <Badge variant="secondary" className={`flex items-center gap-1 ${healthStatus.color}`}>
                  <healthStatus.icon className="h-3 w-3" />
                  {healthStatus.label}
                </Badge>
              </div>
            </div>
          </div>
          {application.description && (
            <p className="text-muted-foreground max-w-2xl">{application.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              Modifier
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              Fermer
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="services">Services métiers</TabsTrigger>
          <TabsTrigger value="deployments">Déploiements</TabsTrigger>
          <TabsTrigger value="metrics">Métriques</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Type</h4>
                    <Badge className={getApplicationTypeBadge(application.application_type)}>
                      {application.application_type}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Version</h4>
                    <span className="font-mono">{application.version || 'Non définie'}</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Équipe</h4>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{application.team?.name || 'Non assignée'}</span>
                  </div>
                  {application.team?.organization && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>Organisation: {application.team.organization.name}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Dates</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Créée le {format(new Date(application.created_at), 'dd MMMM yyyy', { locale: fr })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Modifiée le {format(new Date(application.updated_at), 'dd MMMM yyyy', { locale: fr })}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Liens et accès */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Liens et accès
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {application.repository_url && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <GitBranch className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">Repository</div>
                        <div className="text-sm text-muted-foreground">Code source</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={application.repository_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                )}

                {application.documentation_url && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <FileText className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">Documentation</div>
                        <div className="text-sm text-muted-foreground">Guide utilisateur</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={application.documentation_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                )}

                {!application.repository_url && !application.documentation_url && (
                  <div className="text-center py-4 text-muted-foreground">
                    <ExternalLink className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun lien configuré</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stack technique */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Stack technique
              </CardTitle>
            </CardHeader>
            <CardContent>
              {application.technology_stack && application.technology_stack.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {application.technology_stack.map((tech, index) => (
                    <Badge key={index} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune technologie définie</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Services métiers liés ({application.business_services_details?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {application.business_services_details && application.business_services_details.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Criticité</TableHead>
                      <TableHead>Niveau</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {application.business_services_details.map((service: BusinessServiceSummary) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div className="font-medium">{service.name}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCriticalityColor(service.criticality)}>
                            {service.criticality}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {service.service_level?.toUpperCase() || 'N/A'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun service métier lié</p>
                  <Button variant="outline" className="mt-4">
                    Lier un service métier
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployments" className="space-y-6">
          {/* Intégrer le composant DeploymentManager */}
          <DeploymentManager 
            applicationId={application.id} 
            showApplicationColumn={false}
            compact={true}
          />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Métriques de performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Disponibilité</span>
                    <span className="font-medium text-green-600">
                      {application.metrics?.uptime || 99.5}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Temps de réponse</span>
                    <span className="font-medium">
                      {application.metrics?.response_time || 245}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Taux d'erreur</span>
                    <span className="font-medium text-orange-600">
                      {application.metrics?.error_rate || 0.1}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Score de santé</span>
                    <span className={`font-medium ${healthStatus.color}`}>
                      {application.metrics?.health_score || 95}/100
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Métriques de déploiement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Déploiements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Fréquence</span>
                    <span className="font-medium">
                      {application.metrics?.deployment_frequency || 12}/mois
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Dernier déploiement</span>
                    <span className="font-medium">
                      {application.metrics?.last_deployment 
                        ? format(new Date(application.metrics.last_deployment), 'dd/MM/yyyy', { locale: fr })
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Environnements actifs</span>
                    <span className="font-medium">
                      {application.deployments?.filter(d => d.status === 'active').length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 