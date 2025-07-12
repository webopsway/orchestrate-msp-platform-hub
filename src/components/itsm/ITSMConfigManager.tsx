import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  AlertTriangle, 
  Settings2,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  useITSMDynamicConfig,
  useCreateITSMDynamicConfig,
  useUpdateITSMDynamicConfig,
  useDeleteITSMDynamicConfig,
  getConfigLabel,
  getConfigColor,
  getConfigCategory,
  getConfigDescription,
  type ITSMConfigItem,
  type CreateConfigData,
  type UpdateConfigData
} from '@/hooks/useITSMDynamicConfig';

interface ConfigFormData {
  config_key: string;
  label: string;
  color: string;
  category?: string;
  description?: string;
}

const defaultColors = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'
];

const statusCategories = [
  { value: 'incident', label: 'Incident' },
  { value: 'service_request', label: 'Demande de service' },
  { value: 'change_request', label: 'Demande de changement' },
  { value: 'problem', label: 'Problème' },
];

export const ITSMConfigManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'priorities' | 'statuses' | 'categories'>('priorities');
  const [editingConfig, setEditingConfig] = useState<ITSMConfigItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<ConfigFormData>({
    config_key: '',
    label: '',
    color: defaultColors[0],
    category: '',
    description: ''
  });

  // Charger les configurations pour tous les types
  const { data: priorities = [], isLoading: prioritiesLoading } = useITSMDynamicConfig('priorities');
  const { data: statuses = [], isLoading: statusesLoading } = useITSMDynamicConfig('statuses');
  const { data: categories = [], isLoading: categoriesLoading } = useITSMDynamicConfig('categories');

  // Déterminer les données actuelles en fonction de l'onglet actif
  const getCurrentConfigs = () => {
    switch (activeTab) {
      case 'priorities': return priorities;
      case 'statuses': return statuses;
      case 'categories': return categories;
      default: return [];
    }
  };

  const isLoading = prioritiesLoading || statusesLoading || categoriesLoading;
  const configs = getCurrentConfigs();
  const createConfig = useCreateITSMDynamicConfig();
  const updateConfig = useUpdateITSMDynamicConfig();
  const deleteConfig = useDeleteITSMDynamicConfig();

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      config_key: '',
      label: '',
      color: defaultColors[0],
      category: '',
      description: ''
    });
    setEditingConfig(null);
    setIsCreating(false);
  };

  // Démarrer la création
  const startCreating = () => {
    resetForm();
    setIsCreating(true);
  };

  // Démarrer l'édition
  const startEditing = (config: ITSMConfigItem) => {
    setFormData({
      config_key: config.config_key,
      label: getConfigLabel(config),
      color: getConfigColor(config),
      category: getConfigCategory(config) || '',
      description: getConfigDescription(config) || ''
    });
    setEditingConfig(config);
    setIsCreating(false);
  };

  // Créer une nouvelle configuration
  const handleCreate = async () => {
    if (!formData.config_key || !formData.label) return;

    const configData: CreateConfigData = {
      config_type: activeTab,
      config_key: formData.config_key,
      label: formData.label,
      color: formData.color,
      category: activeTab === 'statuses' ? formData.category : undefined,
      description: formData.description
    };

    try {
      await createConfig.mutateAsync(configData);
      resetForm();
    } catch (error) {
      console.error('Error creating config:', error);
    }
  };

  // Mettre à jour une configuration
  const handleUpdate = async () => {
    if (!editingConfig) return;

    const updates: UpdateConfigData = {
      label: formData.label,
      color: formData.color,
      category: activeTab === 'statuses' ? formData.category : undefined,
      description: formData.description
    };

    try {
      await updateConfig.mutateAsync({ id: editingConfig.id, updates });
      resetForm();
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  // Basculer l'état actif/inactif
  const toggleActive = async (config: ITSMConfigItem) => {
    try {
      await updateConfig.mutateAsync({
        id: config.id,
        updates: { is_active: !config.is_active }
      });
    } catch (error) {
      console.error('Error toggling config:', error);
    }
  };

  // Supprimer une configuration
  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette configuration ?')) {
      try {
        await deleteConfig.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting config:', error);
      }
    }
  };

  // Rendu d'un élément de configuration
  const renderConfigItem = (config: ITSMConfigItem) => (
    <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <div 
          className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
          style={{ backgroundColor: getConfigColor(config) }}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{getConfigLabel(config)}</span>
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{config.config_key}</code>
          </div>
          {getConfigDescription(config) && (
            <p className="text-sm text-muted-foreground mt-1">{getConfigDescription(config)}</p>
          )}
          {getConfigCategory(config) && (
            <Badge variant="outline" className="mt-1 text-xs">
              {statusCategories.find(cat => cat.value === getConfigCategory(config))?.label || getConfigCategory(config)}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => toggleActive(config)}
          className="h-8 w-8 p-0"
        >
          {config.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => startEditing(config)}
          className="h-8 w-8 p-0"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleDelete(config.id)}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Rendu du formulaire
  const renderForm = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          {isCreating ? 'Nouvelle configuration' : 'Modifier la configuration'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="config_key">Clé de configuration *</Label>
            <Input
              id="config_key"
              value={formData.config_key}
              onChange={(e) => setFormData(prev => ({ ...prev, config_key: e.target.value }))}
              placeholder="ex: high, in_progress, hardware"
              disabled={!!editingConfig}
            />
            {editingConfig && (
              <p className="text-xs text-muted-foreground">La clé ne peut pas être modifiée</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="label">Libellé *</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              placeholder="ex: Élevée, En cours, Matériel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Couleur</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-16 h-10"
              />
              <div className="flex gap-1">
                {defaultColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-8 h-8 rounded border-2 border-white shadow-sm hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
          </div>

          {activeTab === 'statuses' && (
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {statusCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description optionnelle de cette configuration"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={resetForm}>
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button 
            onClick={isCreating ? handleCreate : handleUpdate}
            disabled={!formData.config_key || !formData.label}
          >
            <Save className="h-4 w-4 mr-2" />
            {isCreating ? 'Créer' : 'Mettre à jour'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const getTabConfig = (tab: string) => {
    switch (tab) {
      case 'priorities':
        return { title: 'Priorités', description: 'Gérez les niveaux de priorité pour vos tickets ITSM' };
      case 'statuses':
        return { title: 'Statuts', description: 'Configurez les statuts disponibles pour chaque type de ticket' };
      case 'categories':
        return { title: 'Catégories', description: 'Organisez vos tickets par catégories métier' };
      default:
        return { title: '', description: '' };
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configuration ITSM Dynamique</h2>
        <p className="text-muted-foreground">
          Gérez les priorités, statuts et catégories utilisés dans vos tickets ITSM
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="priorities">Priorités</TabsTrigger>
          <TabsTrigger value="statuses">Statuts</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
        </TabsList>

        {(['priorities', 'statuses', 'categories'] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{getTabConfig(tab).title}</h3>
                <p className="text-sm text-muted-foreground">{getTabConfig(tab).description}</p>
              </div>
              <Button onClick={startCreating}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>

            {(isCreating || editingConfig) && renderForm()}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Configurations existantes</CardTitle>
                  <Badge variant="outline">
                    {configs.length} élément{configs.length > 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {configs.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucune configuration</h3>
                    <p className="text-muted-foreground mb-4">
                      Commencez par créer votre première configuration {getTabConfig(tab).title.toLowerCase()}.
                    </p>
                    <Button onClick={startCreating}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer la première configuration
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {configs.map(renderConfigItem)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};