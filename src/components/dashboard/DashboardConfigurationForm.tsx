import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useTeams } from '@/hooks/useTeams';
import type { DashboardWidget, CreateDashboardConfigurationData } from '@/types/dashboard';

interface DashboardConfigurationFormProps {
  widgets: DashboardWidget[];
  initialData?: any;
  onSubmit: (data: CreateDashboardConfigurationData) => Promise<void>;
  onCancel: () => void;
}

export function DashboardConfigurationForm({ 
  widgets, 
  initialData, 
  onSubmit, 
  onCancel 
}: DashboardConfigurationFormProps) {
  const { userProfile } = useAuth();
  const { organizations } = useOrganizations();
  const { teams } = useTeams();

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    team_id: initialData?.team_id || 'all',
    organization_id: initialData?.organization_id || 'all',
    is_default: initialData?.is_default || false,
    selected_widgets: initialData?.widgets?.map((w: any) => w.id) || []
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Créer la configuration des widgets avec positions par défaut
      const widgetPositions = formData.selected_widgets.map((widgetId, index) => ({
        id: widgetId,
        position: {
          x: (index % 4) * 3,
          y: Math.floor(index / 4),
          w: 3,
          h: 1
        }
      }));

      const submitData: CreateDashboardConfigurationData = {
        name: formData.name,
        description: formData.description || undefined,
        team_id: formData.team_id || undefined,
        organization_id: formData.organization_id || undefined,
        is_default: formData.is_default,
        widgets: widgetPositions
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWidgetToggle = (widgetId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selected_widgets: checked
        ? [...prev.selected_widgets, widgetId]
        : prev.selected_widgets.filter(id => id !== widgetId)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nom de la configuration *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Dashboard Équipe Support"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Dashboard personnalisé pour l'équipe support technique"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_default"
              checked={formData.is_default}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, is_default: checked as boolean })
              }
            />
            <Label htmlFor="is_default">Dashboard par défaut</Label>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="organization">Organisation cible (optionnel)</Label>
            <Select 
              value={formData.organization_id} 
              onValueChange={(value) => setFormData({ ...formData, organization_id: value === 'all' ? '' : value })}
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
            <Label htmlFor="team">Équipe cible (optionnel)</Label>
            <Select 
              value={formData.team_id} 
              onValueChange={(value) => setFormData({ ...formData, team_id: value === 'all' ? '' : value })}
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Widgets à inclure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {widgets.map((widget) => (
              <div key={widget.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={widget.id}
                  checked={formData.selected_widgets.includes(widget.name)}
                  onCheckedChange={(checked) => 
                    handleWidgetToggle(widget.name, checked as boolean)
                  }
                />
                <div className="flex-1">
                  <Label htmlFor={widget.id} className="font-medium cursor-pointer">
                    {widget.display_name}
                  </Label>
                  {widget.description && (
                    <p className="text-sm text-muted-foreground">{widget.description}</p>
                  )}
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded mt-1 inline-block">
                    {widget.widget_type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Sauvegarde..." : initialData ? "Mettre à jour" : "Créer"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
      </div>
    </form>
  );
}