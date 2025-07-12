import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Plus, Edit, Trash2, Clock, AlertTriangle, Users, Zap } from 'lucide-react';
import { useITSMConfig, useCreateITSMConfig, useUpdateITSMConfig, useSLAPolicies, useCreateSLAPolicy, ITSMConfigItem, SLAPolicy } from '@/hooks/useITSMConfig';
import { useToast } from '@/hooks/use-toast';
import { ITSM_CONFIG } from '@/modules/itsm/config';

interface ITSMConfigDialogProps {
  teamId: string;
}

interface ConfigForm {
  config_key: string;
  config_value: {
    label: string;
    color?: string;
    escalation_hours?: number;
    next_statuses?: string[];
  };
}

interface SLAForm {
  name: string;
  description: string;
  priority: string;
  ticket_category: string;
  response_time_hours: number;
  resolution_time_hours: number;
  escalation_time_hours?: number;
  escalation_to?: string;
}

export const ITSMConfigDialog: React.FC<ITSMConfigDialogProps> = ({ teamId }) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('priorities');
  const [editingConfig, setEditingConfig] = useState<ITSMConfigItem | null>(null);
  const [editingSLA, setEditingSLA] = useState<SLAPolicy | null>(null);
  const [configForm, setConfigForm] = useState<ConfigForm>({
    config_key: '',
    config_value: { label: '', color: '#6b7280' }
  });
  const [slaForm, setSLAForm] = useState<SLAForm>({
    name: '',
    description: '',
    priority: '',
    ticket_category: 'all',
    response_time_hours: 4,
    resolution_time_hours: 24
  });

  const { data: priorities = [] } = useITSMConfig(teamId, 'priorities');
  const { data: statuses = [] } = useITSMConfig(teamId, 'statuses');
  const { data: categories = [] } = useITSMConfig(teamId, 'categories');
  const { data: slaConfigs = [] } = useSLAPolicies(teamId);

  const createConfig = useCreateITSMConfig();
  const updateConfig = useUpdateITSMConfig();
  const createSLA = useCreateSLAPolicy();
  const { toast } = useToast();

  // Valeurs par défaut du module ITSM
  const getDefaultConfigs = (configType: string) => {
    switch (configType) {
      case 'priorities':
        return Object.entries(ITSM_CONFIG.incidentPriorities).map(([key, value]) => ({
          config_key: value,
          config_value: { 
            label: key.charAt(0).toUpperCase() + key.slice(1), 
            color: getPriorityColor(value) 
          }
        }));
      case 'statuses':
        return [
          ...Object.entries(ITSM_CONFIG.incidentStatuses).map(([key, value]) => ({
            config_key: value,
            config_value: { 
              label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
              color: getStatusColor(value) 
            }
          })),
          ...Object.entries(ITSM_CONFIG.changeStatuses).map(([key, value]) => ({
            config_key: value,
            config_value: { 
              label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
              color: getStatusColor(value) 
            }
          }))
        ];
      case 'categories':
        return [
          { config_key: 'hardware', config_value: { label: 'Hardware', color: '#10b981' }},
          { config_key: 'software', config_value: { label: 'Software', color: '#3b82f6' }},
          { config_key: 'network', config_value: { label: 'Network', color: '#f59e0b' }},
          { config_key: 'security', config_value: { label: 'Security', color: '#ef4444' }},
          { config_key: 'access', config_value: { label: 'Access', color: '#8b5cf6' }}
        ];
      default:
        return [];
    }
  };

  // Fonctions pour obtenir les couleurs par défaut
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'open': return '#ef4444';
      case 'in_progress': return '#f59e0b';
      case 'resolved': return '#10b981';
      case 'closed': return '#6b7280';
      case 'draft': return '#6b7280';
      case 'pending_approval': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'implemented': return '#10b981';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Fonction pour remplir le formulaire avec les valeurs par défaut
  const fillFormWithDefaults = (configType: string) => {
    const defaultConfigs = getDefaultConfigs(configType);
    const existingKeys = new Set((configType === 'priorities' ? priorities : 
                                  configType === 'statuses' ? statuses : categories)
                                  .map(item => item.config_key));

    // Trouver la première valeur par défaut qui n'existe pas encore
    const availableDefault = defaultConfigs.find(config => !existingKeys.has(config.config_key));
    
    if (availableDefault) {
      setConfigForm({
        config_key: availableDefault.config_key,
        config_value: availableDefault.config_value
      });
      
      toast({
        title: "Formulaire rempli",
        description: "Formulaire rempli avec une valeur par défaut"
      });
    } else {
      // Si toutes les valeurs par défaut existent, prendre la première pour exemple
      const firstDefault = defaultConfigs[0];
      if (firstDefault) {
        setConfigForm({
          config_key: '',
          config_value: firstDefault.config_value
        });
        
        toast({
          title: "Exemple chargé",
          description: "Toutes les valeurs par défaut existent déjà. Exemple chargé."
        });
      }
    }
  };

  const handleCreateConfig = async (configType: string) => {
    try {
      await createConfig.mutateAsync({
        team_id: teamId,
        config_type: configType as any,
        config_key: configForm.config_key,
        config_value: configForm.config_value as any,
        is_active: true,
        display_order: 0,
        created_by: '', // Will be set by RLS
      });
      
      setConfigForm({ config_key: '', config_value: { label: '', color: '#6b7280' } });
      toast({
        title: "Succès",
        description: "Configuration créée avec succès"
      });
    } catch (error) {
      console.error('Error creating config:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la création",
        variant: "destructive"
      });
    }
  };

  const handleUpdateConfig = async () => {
    if (!editingConfig) return;
    
    try {
      await updateConfig.mutateAsync({
        id: editingConfig.id,
        updates: {
          config_value: configForm.config_value as any,
        }
      });
      
      setEditingConfig(null);
      setConfigForm({ config_key: '', config_value: { label: '', color: '#6b7280' } });
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  const handleCreateSLA = async () => {
    try {
      await createSLA.mutateAsync({
        team_id: teamId,
        name: slaForm.name,
        description: slaForm.description,
        priority: slaForm.priority,
        ticket_category: slaForm.ticket_category === 'all' ? undefined : slaForm.ticket_category,
        response_time_hours: slaForm.response_time_hours,
        resolution_time_hours: slaForm.resolution_time_hours,
        escalation_time_hours: slaForm.escalation_time_hours || undefined,
        escalation_to: slaForm.escalation_to || undefined,
        is_active: true,
        created_by: '', // Will be set by RLS
      });
      
      setSLAForm({
        name: '',
        description: '',
        priority: '',
        ticket_category: 'all',
        response_time_hours: 4,
        resolution_time_hours: 24
      });
    } catch (error) {
      console.error('Error creating SLA:', error);
    }
  };

  const startEditingConfig = (config: ITSMConfigItem) => {
    setEditingConfig(config);
    setConfigForm({
      config_key: config.config_key,
      config_value: config.config_value as any
    });
  };

  const getConfigColor = (config: ITSMConfigItem) => {
    const value = config.config_value as any;
    return value?.color || '#6b7280';
  };

  const getConfigLabel = (config: ITSMConfigItem) => {
    const value = config.config_value as any;
    return value?.label || config.config_key;
  };

  const renderConfigSection = (configType: string, title: string, items: ITSMConfigItem[]) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => fillFormWithDefaults(configType)}
            >
              <Zap className="h-4 w-4 mr-1" />
              Valeurs par défaut
            </Button>
            <Button
              size="sm"
              onClick={() => handleCreateConfig(configType)}
              disabled={!configForm.config_key || !configForm.config_value.label}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Configurez les {title.toLowerCase()} disponibles pour vos tickets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`${configType}-key`}>Clé</Label>
            <Input
              id={`${configType}-key`}
              value={configForm.config_key}
              onChange={(e) => setConfigForm(prev => ({ ...prev, config_key: e.target.value }))}
              placeholder="ex: critical"
            />
          </div>
          <div>
            <Label htmlFor={`${configType}-label`}>Libellé</Label>
            <Input
              id={`${configType}-label`}
              value={configForm.config_value.label}
              onChange={(e) => setConfigForm(prev => ({ 
                ...prev, 
                config_value: { ...prev.config_value, label: e.target.value }
              }))}
              placeholder="ex: Critique"
            />
          </div>
        </div>
        
        {configType === 'priorities' && (
          <div>
            <Label htmlFor={`${configType}-color`}>Couleur</Label>
            <Input
              id={`${configType}-color`}
              type="color"
              value={configForm.config_value.color || '#6b7280'}
              onChange={(e) => setConfigForm(prev => ({ 
                ...prev, 
                config_value: { ...prev.config_value, color: e.target.value }
              }))}
            />
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-medium">Éléments configurés :</h4>
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <Badge 
                key={item.id} 
                variant="outline" 
                className="flex items-center gap-2 p-2"
                style={{ borderColor: getConfigColor(item) }}
              >
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getConfigColor(item) }}
                />
                {getConfigLabel(item)}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => startEditingConfig(item)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configuration ITSM
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuration du système ITSM</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="priorities">Priorités</TabsTrigger>
            <TabsTrigger value="statuses">Statuts</TabsTrigger>
            <TabsTrigger value="categories">Catégories</TabsTrigger>
            <TabsTrigger value="sla">Politiques SLA</TabsTrigger>
          </TabsList>

          <TabsContent value="priorities" className="space-y-4">
            {renderConfigSection('priorities', 'Priorités', priorities)}
          </TabsContent>

          <TabsContent value="statuses" className="space-y-4">
            {renderConfigSection('statuses', 'Statuts', statuses)}
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            {renderConfigSection('categories', 'Catégories', categories)}
          </TabsContent>

          <TabsContent value="sla" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Politiques SLA
                  <Button
                    size="sm"
                    onClick={handleCreateSLA}
                    disabled={!slaForm.name || !slaForm.priority}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardTitle>
              <CardDescription>
                Définissez les accords de niveau de service selon la priorité et la catégorie des tickets
              </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sla-name">Nom de la politique</Label>
                    <Input
                      id="sla-name"
                      value={slaForm.name}
                      onChange={(e) => setSLAForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="ex: SLA Critique"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sla-priority">Priorité *</Label>
                    <Select value={slaForm.priority} onValueChange={(value) => setSLAForm(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une priorité" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((priority) => (
                          <SelectItem key={priority.id} value={priority.config_key}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: getConfigColor(priority) }}
                              />
                              {getConfigLabel(priority)}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="sla-category">Catégorie de ticket (optionnel)</Label>
                    <Select value={slaForm.ticket_category} onValueChange={(value) => setSLAForm(prev => ({ ...prev, ticket_category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les catégories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les catégories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.config_key}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: getConfigColor(category) }}
                              />
                              {getConfigLabel(category)}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="sla-description">Description</Label>
                  <Textarea
                    id="sla-description"
                    value={slaForm.description}
                    onChange={(e) => setSLAForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Ex: SLA pour les incidents critiques de sécurité"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="sla-response">Temps de réponse (heures)</Label>
                    <Input
                      id="sla-response"
                      type="number"
                      value={slaForm.response_time_hours}
                      onChange={(e) => setSLAForm(prev => ({ ...prev, response_time_hours: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sla-resolution">Temps de résolution (heures)</Label>
                    <Input
                      id="sla-resolution"
                      type="number"
                      value={slaForm.resolution_time_hours}
                      onChange={(e) => setSLAForm(prev => ({ ...prev, resolution_time_hours: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sla-escalation">Temps d'escalade (heures)</Label>
                    <Input
                      id="sla-escalation"
                      type="number"
                      value={slaForm.escalation_time_hours || ''}
                      onChange={(e) => setSLAForm(prev => ({ ...prev, escalation_time_hours: e.target.value ? parseInt(e.target.value) : undefined }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Politiques SLA configurées :</h4>
                  <div className="space-y-2">
                    {slaConfigs.map((sla) => (
                      <Card key={sla.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium">{sla.name}</h5>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <strong>Priorité:</strong> {sla.priority}
                              </span>
                              {sla.ticket_category && sla.ticket_category !== 'all' && (
                                <span className="flex items-center gap-1">
                                  <strong>Catégorie:</strong> {sla.ticket_category}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span>Réponse: {sla.response_time_hours}h</span>
                              <span>Résolution: {sla.resolution_time_hours}h</span>
                              {sla.escalation_time_hours && <span>Escalade: {sla.escalation_time_hours}h</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {sla.escalation_time_hours && (
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                            )}
                            <Badge variant={sla.is_active ? "default" : "secondary"}>
                              {sla.is_active ? "Actif" : "Inactif"}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {editingConfig && (
          <Card className="mt-4 border-blue-200">
            <CardHeader>
              <CardTitle>Modifier la configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Libellé</Label>
                <Input
                  value={configForm.config_value.label}
                  onChange={(e) => setConfigForm(prev => ({ 
                    ...prev, 
                    config_value: { ...prev.config_value, label: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label>Couleur</Label>
                <Input
                  type="color"
                  value={configForm.config_value.color || '#6b7280'}
                  onChange={(e) => setConfigForm(prev => ({ 
                    ...prev, 
                    config_value: { ...prev.config_value, color: e.target.value }
                  }))}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateConfig}>
                  Mettre à jour
                </Button>
                <Button variant="outline" onClick={() => setEditingConfig(null)}>
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};