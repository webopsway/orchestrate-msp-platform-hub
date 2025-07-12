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
import { Settings, Plus, Edit, Trash2, Clock, AlertTriangle, Users } from 'lucide-react';
import { useITSMConfig, useCreateITSMConfig, useUpdateITSMConfig, useSLAPolicies, useCreateSLAPolicy, ITSMConfigItem, SLAPolicy } from '@/hooks/useITSMConfig';
import { useToast } from '@/hooks/use-toast';

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
    ticket_category: '',
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
    } catch (error) {
      console.error('Error creating config:', error);
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
        ticket_category: slaForm.ticket_category || undefined,
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
        ticket_category: '',
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
          <Button
            size="sm"
            onClick={() => handleCreateConfig(configType)}
            disabled={!configForm.config_key || !configForm.config_value.label}
          >
            <Plus className="h-4 w-4" />
          </Button>
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
                  Définissez les accords de niveau de service pour vos tickets
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
                    <Label htmlFor="sla-priority">Priorité</Label>
                    <Select value={slaForm.priority} onValueChange={(value) => setSLAForm(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une priorité" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((priority) => (
                          <SelectItem key={priority.id} value={priority.config_key}>
                            {getConfigLabel(priority)}
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
                    placeholder="Description de la politique SLA"
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
                            <p className="text-sm text-muted-foreground">
                              Priorité: {sla.priority} | 
                              Réponse: {sla.response_time_hours}h | 
                              Résolution: {sla.resolution_time_hours}h
                              {sla.escalation_time_hours && ` | Escalade: ${sla.escalation_time_hours}h`}
                            </p>
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