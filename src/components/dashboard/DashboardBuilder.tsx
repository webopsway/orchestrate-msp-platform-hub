import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layout, Plus, Eye, Settings } from 'lucide-react';
import { DashboardGridLayout } from './DashboardGridLayout';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useTeams } from '@/hooks/useTeams';
import type { DashboardConfiguration, DashboardWidget } from '@/types/dashboard';

interface DashboardBuilderProps {
  widgets: DashboardWidget[];
  onSave: (config: Partial<DashboardConfiguration>) => Promise<void>;
  onCancel?: () => void;
  initialData?: DashboardConfiguration;
}

export function DashboardBuilder({ widgets, onSave, onCancel, initialData }: DashboardBuilderProps) {
  const { organizations = [] } = useOrganizations();
  const { teams = [] } = useTeams();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    team_id: initialData?.team_id || 'all',
    organization_id: initialData?.organization_id || 'all',
    is_default: initialData?.is_default || false,
    selected_widgets: initialData?.widgets?.map(w => w.id) || []
  });
  
  const [currentConfig, setCurrentConfig] = useState<DashboardConfiguration | undefined>(
    initialData ? {
      ...initialData,
      widgets: initialData.widgets || []
    } : undefined
  );

  const handleWidgetToggle = (widgetId: string, checked: boolean) => {
    const newSelected = checked 
      ? [...formData.selected_widgets, widgetId]
      : formData.selected_widgets.filter(id => id !== widgetId);
    
    setFormData({ ...formData, selected_widgets: newSelected });
    
    // Créer une configuration temporaire pour la prévisualisation
    const newWidgets = newSelected.map((id, index) => ({
      id,
      position: {
        x: (index * 3) % 12,
        y: Math.floor((index * 3) / 12) * 3,
        w: 3,
        h: 3
      }
    }));
    
    setCurrentConfig({
      id: initialData?.id || 'temp',
      name: formData.name || 'Nouveau Dashboard',
      description: formData.description,
      team_id: formData.team_id === 'all' ? null : formData.team_id,
      organization_id: formData.organization_id === 'all' ? null : formData.organization_id,
      is_default: formData.is_default,
      is_active: true,
      layout_config: {},
      widgets: newWidgets,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'current-user'
    });
  };

  const handleLayoutChange = (layout: any[], allLayouts: any) => {
    if (!currentConfig) return;
    
    const updatedWidgets = currentConfig.widgets.map((widget) => {
      const layoutItem = layout.find((item) => item.i === widget.id);
      if (!layoutItem) return widget;
      
      return {
        ...widget,
        position: {
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h
        }
      };
    });

    setCurrentConfig({
      ...currentConfig,
      widgets: updatedWidgets
    });
  };

  const handleSave = async () => {
    if (!currentConfig) return;
    
    const configData = {
      name: formData.name,
      description: formData.description,
      team_id: formData.team_id === 'all' ? null : formData.team_id,
      organization_id: formData.organization_id === 'all' ? null : formData.organization_id,
      is_default: formData.is_default,
      widgets: currentConfig.widgets
    };
    
    await onSave(configData);
    setIsEditing(false);
  };

  const selectedWidgets = widgets.filter(w => formData.selected_widgets.includes(w.name));

  return (
    <div className="space-y-6">
      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            Configuration du Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nom du dashboard</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Mon Dashboard"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du dashboard"
                rows={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="organization">Organisation cible</Label>
              <Select 
                value={formData.organization_id} 
                onValueChange={(value) => setFormData({ ...formData, organization_id: value === 'all' ? 'all' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les organisations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les organisations</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="team">Équipe cible</Label>
              <Select 
                value={formData.team_id} 
                onValueChange={(value) => setFormData({ ...formData, team_id: value === 'all' ? 'all' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les équipes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les équipes</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_default"
              checked={formData.is_default}
              onCheckedChange={(checked) => setFormData({ ...formData, is_default: !!checked })}
            />
            <Label htmlFor="is_default">Dashboard par défaut</Label>
          </div>
        </CardContent>
      </Card>

      {/* Widget Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Sélection des widgets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`widget-${widget.id}`}
                    checked={formData.selected_widgets.includes(widget.name)}
                    onCheckedChange={(checked) => handleWidgetToggle(widget.name, !!checked)}
                  />
                  <Label 
                    htmlFor={`widget-${widget.id}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {widget.display_name}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {widget.widget_type}
                  </Badge>
                </div>
                {widget.description && (
                  <p className="text-xs text-muted-foreground">{widget.description}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview/Layout */}
      {currentConfig && formData.selected_widgets.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Aperçu du Dashboard</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={isPreview ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setIsPreview(!isPreview);
                    setIsEditing(false);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {isPreview ? "Mode aperçu" : "Aperçu"}
                </Button>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setIsEditing(!isEditing);
                    setIsPreview(false);
                  }}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {isEditing ? "Mode édition" : "Éditer"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DashboardGridLayout
              configuration={currentConfig}
              widgets={widgets}
              isEditing={isEditing}
              onLayoutChange={handleLayoutChange}
              onSave={handleSave}
            />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button onClick={handleSave} disabled={!formData.name || formData.selected_widgets.length === 0}>
          <Plus className="w-4 h-4 mr-2" />
          {initialData ? 'Mettre à jour' : 'Créer le dashboard'}
        </Button>
      </div>
    </div>
  );
}