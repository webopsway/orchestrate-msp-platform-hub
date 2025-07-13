import React, { useState } from 'react';
import { Clock, Plus, Building2, Network, Shield, AlertTriangle, CheckCircle, Edit, Trash2, Eye } from 'lucide-react';

import { PageHeader } from '@/components/common/PageHeader';
import { StatsCard } from '@/components/common/StatsCard';
import { CRUDTable } from '@/components/common/CRUDTable';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Types pour les politiques SLA
interface SLAPolicy {
  id: string;
  name: string;
  client_type: 'direct' | 'via_esn' | 'all';
  priority: 'low' | 'medium' | 'high' | 'critical';
  ticket_category?: string;
  response_time_hours: number;
  resolution_time_hours: number;
  escalation_time_hours?: number;
  escalation_to?: string;
  is_active: boolean;
  description?: string;
  team_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Types pour les templates SLA
interface SLATemplate {
  id: string;
  name: string;
  client_type: 'direct' | 'via_esn';
  description: string;
  policies: Omit<SLAPolicy, 'id' | 'team_id' | 'created_at' | 'updated_at' | 'created_by'>[];
}

// Données de démonstration
const mockSLAPolicies: SLAPolicy[] = [
  {
    id: '1',
    name: 'Client Direct - Critique',
    client_type: 'direct',
    priority: 'critical',
    response_time_hours: 1,
    resolution_time_hours: 4,
    escalation_time_hours: 2,
    is_active: true,
    description: 'SLA pour les incidents critiques des clients directs',
    team_id: 'team1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    created_by: 'user1'
  },
  {
    id: '2',
    name: 'Via ESN - Critique',
    client_type: 'via_esn',
    priority: 'critical',
    response_time_hours: 2,
    resolution_time_hours: 8,
    escalation_time_hours: 4,
    is_active: true,
    description: 'SLA pour les incidents critiques via ESN',
    team_id: 'team1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    created_by: 'user1'
  },
  {
    id: '3',
    name: 'Client Direct - Élevé',
    client_type: 'direct',
    priority: 'high',
    response_time_hours: 2,
    resolution_time_hours: 8,
    escalation_time_hours: 4,
    is_active: true,
    description: 'SLA pour les incidents élevés des clients directs',
    team_id: 'team1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    created_by: 'user1'
  },
  {
    id: '4',
    name: 'Via ESN - Élevé',
    client_type: 'via_esn',
    priority: 'high',
    response_time_hours: 4,
    resolution_time_hours: 24,
    escalation_time_hours: 8,
    is_active: true,
    description: 'SLA pour les incidents élevés via ESN',
    team_id: 'team1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    created_by: 'user1'
  }
];

const mockTemplates: SLATemplate[] = [
  {
    id: 'template1',
    name: 'Template Client Direct Standard',
    client_type: 'direct',
    description: 'Template standard pour les clients en gestion directe',
    policies: [
      {
        name: 'Critique',
        client_type: 'direct',
        priority: 'critical',
        response_time_hours: 1,
        resolution_time_hours: 4,
        escalation_time_hours: 2,
        is_active: true
      },
      {
        name: 'Élevé',
        client_type: 'direct',
        priority: 'high',
        response_time_hours: 2,
        resolution_time_hours: 8,
        escalation_time_hours: 4,
        is_active: true
      }
    ]
  },
  {
    id: 'template2',
    name: 'Template Via ESN Standard',
    client_type: 'via_esn',
    description: 'Template standard pour les clients via ESN',
    policies: [
      {
        name: 'Critique',
        client_type: 'via_esn',
        priority: 'critical',
        response_time_hours: 2,
        resolution_time_hours: 8,
        escalation_time_hours: 4,
        is_active: true
      },
      {
        name: 'Élevé',
        client_type: 'via_esn',
        priority: 'high',
        response_time_hours: 4,
        resolution_time_hours: 24,
        escalation_time_hours: 8,
        is_active: true
      }
    ]
  }
];

const SLAManagement = () => {
  const [slaList, setSlaList] = useState<SLAPolicy[]>(mockSLAPolicies);
  const [templates, setTemplates] = useState<SLATemplate[]>(mockTemplates);
  const [loading, setLoading] = useState(false);
  
  // États des modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedSLA, setSelectedSLA] = useState<SLAPolicy | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<SLATemplate | null>(null);

  // Filtres
  const [clientTypeFilter, setClientTypeFilter] = useState<'all' | 'direct' | 'via_esn'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Données filtrées
  const filteredSLAs = slaList.filter(sla => {
    const matchesClientType = clientTypeFilter === 'all' || sla.client_type === clientTypeFilter;
    const matchesPriority = priorityFilter === 'all' || sla.priority === priorityFilter;
    const matchesActive = activeFilter === 'all' || 
      (activeFilter === 'active' && sla.is_active) ||
      (activeFilter === 'inactive' && !sla.is_active);
    
    return matchesClientType && matchesPriority && matchesActive;
  });

  // Statistiques
  const activeSLAs = slaList.filter(sla => sla.is_active);
  const directSLAs = slaList.filter(sla => sla.client_type === 'direct');
  const esnSLAs = slaList.filter(sla => sla.client_type === 'via_esn');
  const criticalSLAs = slaList.filter(sla => sla.priority === 'critical');

  // Colonnes du tableau
  const columns = [
    {
      key: 'name',
      label: 'Nom',
      type: 'text' as const,
      sortable: true,
      render: (value: any, row: SLAPolicy) => (
        <div className="space-y-1">
          <div className="font-medium">{row.name}</div>
          {row.description && (
            <div className="text-xs text-muted-foreground line-clamp-2">
              {row.description}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'client_type',
      label: 'Type Client',
      type: 'custom' as const,
      sortable: true,
      render: (value: any, row: SLAPolicy) => (
        <Badge variant={row.client_type === 'direct' ? 'default' : 'secondary'}>
          {row.client_type === 'direct' ? (
            <div className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              Direct
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Network className="h-3 w-3" />
              Via ESN
            </div>
          )}
        </Badge>
      )
    },
    {
      key: 'priority',
      label: 'Priorité',
      type: 'custom' as const,
      sortable: true,
      render: (value: any, row: SLAPolicy) => {
        const variants = {
          low: 'secondary',
          medium: 'outline',
          high: 'default',
          critical: 'destructive'
        } as const;
        
        return (
          <Badge variant={variants[row.priority] || 'secondary'}>
            {row.priority === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
            {row.priority.charAt(0).toUpperCase() + row.priority.slice(1)}
          </Badge>
        );
      }
    },
    {
      key: 'response_time',
      label: 'Temps de réponse',
      type: 'custom' as const,
      sortable: true,
      render: (value: any, row: SLAPolicy) => (
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{row.response_time_hours}h</span>
        </div>
      )
    },
    {
      key: 'resolution_time',
      label: 'Temps de résolution',
      type: 'custom' as const,
      sortable: true,
      render: (value: any, row: SLAPolicy) => (
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{row.resolution_time_hours}h</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      type: 'custom' as const,
      sortable: true,
      render: (value: any, row: SLAPolicy) => (
        <Badge variant={row.is_active ? 'default' : 'secondary'}>
          {row.is_active ? 'Actif' : 'Inactif'}
        </Badge>
      )
    }
  ];

  const actions = [
    {
      label: 'Voir',
      icon: Eye,
      onClick: (sla: SLAPolicy) => {
        setSelectedSLA(sla);
        setIsViewModalOpen(true);
      },
      variant: 'ghost' as const
    },
    {
      label: 'Modifier',
      icon: Edit,
      onClick: (sla: SLAPolicy) => {
        setSelectedSLA(sla);
        setIsEditModalOpen(true);
      },
      variant: 'ghost' as const
    },
    {
      label: 'Supprimer',
      icon: Trash2,
      onClick: (sla: SLAPolicy) => {
        setSelectedSLA(sla);
        setIsDeleteModalOpen(true);
      },
      variant: 'destructive' as const
    }
  ];

  const emptyState = {
    icon: Clock,
    title: 'Aucune politique SLA',
    description: 'Créez des politiques SLA pour gérer les délais selon les types de clients.',
    action: {
      label: 'Créer une politique SLA',
      onClick: () => setIsCreateModalOpen(true)
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <PageHeader
        title="Gestion des SLA"
        description="Configurez les politiques de délais de service selon les types de clients"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsTemplateModalOpen(true)}>
              <Shield className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle politique
            </Button>
          </div>
        }
      />

      {/* Information sur les types de clients */}
      <Alert>
        <Building2 className="h-4 w-4" />
        <AlertDescription>
          <strong>Clients directs</strong> : SLA plus stricts avec MSP responsable direct. 
          <strong> Clients via ESN</strong> : SLA ajustés selon l'accord avec l'ESN intermédiaire.
        </AlertDescription>
      </Alert>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Politiques actives"
          value={activeSLAs.length.toString()}
          icon={CheckCircle}
          trend={`${Math.round((activeSLAs.length / slaList.length) * 100) || 0}% du total`}
        />
        <StatsCard
          title="Clients directs"
          value={directSLAs.length.toString()}
          icon={Building2}
          trend={`${Math.round((directSLAs.length / slaList.length) * 100) || 0}% des politiques`}
        />
        <StatsCard
          title="Via ESN"
          value={esnSLAs.length.toString()}
          icon={Network}
          trend={`${Math.round((esnSLAs.length / slaList.length) * 100) || 0}% des politiques`}
        />
        <StatsCard
          title="Priorité critique"
          value={criticalSLAs.length.toString()}
          icon={AlertTriangle}
          variant={criticalSLAs.length > 0 ? "destructive" : "default"}
        />
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Type de client</Label>
              <Select value={clientTypeFilter} onValueChange={(value: any) => setClientTypeFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="direct">Clients directs</SelectItem>
                  <SelectItem value="via_esn">Via ESN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Priorité</Label>
              <Select value={priorityFilter} onValueChange={(value: any) => setPriorityFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={activeFilter} onValueChange={(value: any) => setActiveFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actives</SelectItem>
                  <SelectItem value="inactive">Inactives</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparaison SLA par type de client */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comparaison des SLA par type de client</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Clients directs */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold">Clients directs</h3>
              </div>
              <div className="space-y-2">
                {directSLAs.map((sla) => (
                  <div key={sla.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{sla.priority.charAt(0).toUpperCase() + sla.priority.slice(1)}</div>
                      <div className="text-xs text-muted-foreground">
                        Réponse: {sla.response_time_hours}h • Résolution: {sla.resolution_time_hours}h
                      </div>
                    </div>
                    <Badge variant={sla.is_active ? 'default' : 'secondary'} className="text-xs">
                      {sla.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Via ESN */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Network className="h-5 w-5 text-purple-500" />
                <h3 className="font-semibold">Via ESN</h3>
              </div>
              <div className="space-y-2">
                {esnSLAs.map((sla) => (
                  <div key={sla.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{sla.priority.charAt(0).toUpperCase() + sla.priority.slice(1)}</div>
                      <div className="text-xs text-muted-foreground">
                        Réponse: {sla.response_time_hours}h • Résolution: {sla.resolution_time_hours}h
                      </div>
                    </div>
                    <Badge variant={sla.is_active ? 'default' : 'secondary'} className="text-xs">
                      {sla.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des politiques SLA */}
      <CRUDTable
        title="Politiques SLA"
        columns={columns}
        data={filteredSLAs}
        loading={loading}
        totalCount={filteredSLAs.length}
        pageSize={10}
        currentPage={1}
        searchPlaceholder="Rechercher une politique SLA..."
        onSearch={() => {}}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        onCreate={() => setIsCreateModalOpen(true)}
        onRefresh={() => {}}
        actions={actions}
        emptyState={emptyState}
        selectable={false}
      />

      {/* Modal de templates */}
      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Templates SLA</DialogTitle>
            <DialogDescription>
              Utilisez des templates prédéfinis pour créer rapidement des politiques SLA.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant={template.client_type === 'direct' ? 'default' : 'secondary'}>
                      {template.client_type === 'direct' ? 'Direct' : 'Via ESN'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {template.description}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Politiques incluses:</div>
                    {template.policies.map((policy, index) => (
                      <div key={index} className="text-xs bg-muted/50 p-2 rounded">
                        <div className="font-medium">{policy.priority.charAt(0).toUpperCase() + policy.priority.slice(1)}</div>
                        <div className="text-muted-foreground">
                          Réponse: {policy.response_time_hours}h • Résolution: {policy.resolution_time_hours}h
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    variant="outline"
                    onClick={() => {
                      // Ici on appliquerait le template
                      setIsTemplateModalOpen(false);
                    }}
                  >
                    Appliquer ce template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SLAManagement;