import { useState, useEffect } from 'react';
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
  Layers,
  Users,
  Server,
  Package,
  Shield,
  AlertTriangle,
  Calendar,
  User,
  Mail,
  Link,
  ExternalLink,
  Code,
  Database,
  GitBranch,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { BusinessServiceWithDetails, Application } from '@/types/businessService';

interface BusinessServiceDetailViewProps {
  service: BusinessServiceWithDetails;
  onEdit?: () => void;
  onClose?: () => void;
}

export const BusinessServiceDetailView: React.FC<BusinessServiceDetailViewProps> = ({
  service,
  onEdit,
  onClose
}) => {
  const getCriticalityConfig = (criticality: string) => {
    const configs = {
      low: { label: 'Faible', color: 'bg-green-100 text-green-800', icon: Shield },
      medium: { label: 'Moyenne', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      high: { label: 'Élevée', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
      critical: { label: 'Critique', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    };
    return configs[criticality as keyof typeof configs] || configs.medium;
  };

  const getServiceLevelColor = (level: string) => {
    const colors = {
      bronze: 'bg-amber-100 text-amber-800',
      silver: 'bg-gray-100 text-gray-800',
      gold: 'bg-yellow-100 text-yellow-800',
      platinum: 'bg-purple-100 text-purple-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const criticalityConfig = getCriticalityConfig(service.criticality);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{service.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={criticalityConfig.color}>
                  <criticalityConfig.icon className="h-3 w-3 mr-1" />
                  {criticalityConfig.label}
                </Badge>
                <Badge className={getServiceLevelColor(service.service_level || '')}>
                  {service.service_level?.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
          {service.description && (
            <p className="text-muted-foreground max-w-2xl">{service.description}</p>
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
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="stack">Stack technique</TabsTrigger>
          <TabsTrigger value="metadata">Métadonnées</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Criticité</h4>
                    <Badge className={criticalityConfig.color}>
                      <criticalityConfig.icon className="h-3 w-3 mr-1" />
                      {criticalityConfig.label}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Niveau de service</h4>
                    <Badge className={getServiceLevelColor(service.service_level || '')}>
                      {service.service_level?.toUpperCase() || 'Non défini'}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Équipe</h4>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{service.team?.name || 'Non assignée'}</span>
                  </div>
                  {service.team?.organization && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>Organisation: {service.team.organization.name}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Dates</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Créé le {format(new Date(service.created_at), 'dd MMMM yyyy', { locale: fr })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Modifié le {format(new Date(service.updated_at), 'dd MMMM yyyy', { locale: fr })}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Propriétaires */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Propriétaires
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Propriétaire métier */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Propriétaire métier</h4>
                  {service.business_owner_profile ? (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {service.business_owner_profile.first_name} {service.business_owner_profile.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {service.business_owner_profile.email}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Non assigné</div>
                  )}
                </div>

                {/* Propriétaire technique */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Propriétaire technique</h4>
                  {service.technical_owner_profile ? (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="p-2 bg-green-100 rounded-full">
                        <Server className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {service.technical_owner_profile.first_name} {service.technical_owner_profile.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {service.technical_owner_profile.email}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Non assigné</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Métriques (placeholder) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Métriques et performances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">99.9%</div>
                  <div className="text-sm text-muted-foreground">Disponibilité</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">245ms</div>
                  <div className="text-sm text-muted-foreground">Temps de réponse</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">0.1%</div>
                  <div className="text-sm text-muted-foreground">Taux d'erreur</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">98%</div>
                  <div className="text-sm text-muted-foreground">SLA</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Applications liées ({service.applications?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {service.applications && service.applications.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Stack technique</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {service.applications.map((app: Application) => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{app.name}</div>
                            {app.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {app.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{app.application_type}</Badge>
                        </TableCell>
                        <TableCell>{app.version || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {app.technology_stack?.slice(0, 3).map((tech, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tech}
                              </Badge>
                            ))}
                            {(app.technology_stack?.length || 0) > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{(app.technology_stack?.length || 0) - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {app.repository_url && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={app.repository_url} target="_blank" rel="noopener noreferrer">
                                  <GitBranch className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            {app.documentation_url && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={app.documentation_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune application liée à ce service</p>
                  <Button variant="outline" className="mt-4">
                    <Link className="h-4 w-4 mr-2" />
                    Lier une application
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stack" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stack technique */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Stack technique
                </CardTitle>
              </CardHeader>
              <CardContent>
                {service.technical_stack && service.technical_stack.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {service.technical_stack.map((tech, index) => (
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

            {/* Stack applicative */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Stack applicative
                </CardTitle>
              </CardHeader>
              <CardContent>
                {service.application_stack && service.application_stack.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {service.application_stack.map((app, index) => (
                      <Badge key={index} variant="secondary">
                        {app}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun composant défini</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metadata" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Métadonnées
              </CardTitle>
            </CardHeader>
            <CardContent>
              {service.metadata && Object.keys(service.metadata).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(service.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="font-medium">{key}</span>
                      <span className="text-sm text-muted-foreground">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune métadonnée définie</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 