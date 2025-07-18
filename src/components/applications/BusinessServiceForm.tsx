import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import type { CreateBusinessServiceData } from '@/types/application';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useTeams } from '@/hooks/useTeams';
import { useApplications } from '@/hooks/useApplications';
import { supabase } from '@/integrations/supabase/client';

interface BusinessServiceFormProps {
  onSubmit: (data: CreateBusinessServiceData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CreateBusinessServiceData>;
}

export function BusinessServiceForm({ onSubmit, onCancel, initialData }: BusinessServiceFormProps) {
  const { teams } = useTeams();
  const { applications } = useApplications();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [cloudAssets, setCloudAssets] = useState<any[]>([]);

  const [formData, setFormData] = useState<CreateBusinessServiceData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    criticality: initialData?.criticality || 'medium',
    organization_id: initialData?.organization_id || '',
    business_owner_team_id: initialData?.business_owner_team_id || '',
    technical_owner_team_id: initialData?.technical_owner_team_id || '',
    application_stack: initialData?.application_stack || [],
    technical_stack: initialData?.technical_stack || [],
    business_owner: initialData?.business_owner || '',
    technical_owner: initialData?.technical_owner || '',
    service_level: initialData?.service_level || '',
    metadata: initialData?.metadata || {}
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Charger les organisations et cloud assets
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les organisations
        const { data: orgsData } = await supabase
          .from('organizations')
          .select('id, name')
          .order('name');
        
        if (orgsData) setOrganizations(orgsData);

        // Récupérer les cloud assets
        const { data: assetsData } = await supabase
          .from('cloud_asset')
          .select('id, asset_name, asset_type')
          .order('asset_name');
        
        if (assetsData) setCloudAssets(assetsData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    fetchData();
  }, []);

  // Fonction pour mettre à jour l'organisation quand une équipe est sélectionnée
  const handleTeamSelection = (teamId: string, teamType: 'business' | 'technical') => {
    const selectedTeam = teams.find(team => team.id === teamId);
    
    if (selectedTeam && selectedTeam.organization_id) {
      // Mettre à jour l'organisation automatiquement
      setFormData(prev => ({
        ...prev,
        organization_id: selectedTeam.organization_id,
        [teamType === 'business' ? 'business_owner_team_id' : 'technical_owner_team_id']: teamId
      }));
    } else {
      // Juste mettre à jour l'équipe
      setFormData(prev => ({
        ...prev,
        [teamType === 'business' ? 'business_owner_team_id' : 'technical_owner_team_id']: teamId
      }));
    }
  };

  // Fonction pour obtenir l'organisation d'une équipe
  const getTeamOrganization = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team && team.organization_id) {
      const org = organizations.find(o => o.id === team.organization_id);
      return org ? org.name : '';
    }
    return '';
  };

  const addToApplicationStack = (appId: string) => {
    if (!formData.application_stack?.includes(appId)) {
      setFormData({
        ...formData,
        application_stack: [...(formData.application_stack || []), appId]
      });
    }
  };

  const removeFromApplicationStack = (appId: string) => {
    setFormData({
      ...formData,
      application_stack: formData.application_stack?.filter(id => id !== appId) || []
    });
  };

  const addToTechnicalStack = (assetId: string) => {
    if (!formData.technical_stack?.includes(assetId)) {
      setFormData({
        ...formData,
        technical_stack: [...(formData.technical_stack || []), assetId]
      });
    }
  };

  const removeFromTechnicalStack = (assetId: string) => {
    setFormData({
      ...formData,
      technical_stack: formData.technical_stack?.filter(id => id !== assetId) || []
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom du service est requis";
    }

    if (!formData.criticality) {
      newErrors.criticality = "La criticité est requise";
    }

    if (!formData.organization_id) {
      newErrors.organization_id = "L'organisation est requise";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting business service form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du service *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Service de facturation"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="criticality">Criticité *</Label>
              <Select
                value={formData.criticality}
                onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => 
                  setFormData({ ...formData, criticality: value })
                }
              >
                <SelectTrigger className={errors.criticality ? "border-destructive" : ""}>
                  <SelectValue placeholder="Sélectionner la criticité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
              {errors.criticality && (
                <p className="text-sm text-destructive">{errors.criticality}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description du service métier..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_owner">Propriétaire métier</Label>
              <Input
                id="business_owner"
                value={formData.business_owner}
                onChange={(e) => setFormData({ ...formData, business_owner: e.target.value })}
                placeholder="Ex: Jean Dupont"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="technical_owner">Propriétaire technique</Label>
              <Input
                id="technical_owner"
                value={formData.technical_owner}
                onChange={(e) => setFormData({ ...formData, technical_owner: e.target.value })}
                placeholder="Ex: Marie Martin"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_level">Niveau de service</Label>
            <Input
              id="service_level"
              value={formData.service_level}
              onChange={(e) => setFormData({ ...formData, service_level: e.target.value })}
              placeholder="Ex: 99.9% de disponibilité"
            />
          </div>

          {/* Organisation et équipes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organization_id">Organisation *</Label>
              <Select
                value={formData.organization_id}
                onValueChange={(value) => setFormData({ ...formData, organization_id: value })}
              >
                <SelectTrigger className={errors.organization_id ? "border-destructive" : ""}>
                  <SelectValue placeholder="Sélectionner une organisation" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.organization_id && (
                <p className="text-sm text-destructive">{errors.organization_id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_owner_team_id">Équipe propriétaire métier</Label>
              <Select
                value={formData.business_owner_team_id || ''}
                onValueChange={(value) => handleTeamSelection(value, 'business')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une équipe" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex flex-col">
                        <span>{team.name}</span>
                        {team.organizations && (
                          <span className="text-xs text-muted-foreground">
                            {team.organizations.name}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.business_owner_team_id && getTeamOrganization(formData.business_owner_team_id) && (
                <p className="text-sm text-muted-foreground">
                  Organisation: {getTeamOrganization(formData.business_owner_team_id)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="technical_owner_team_id">Équipe propriétaire technique</Label>
              <Select
                value={formData.technical_owner_team_id || ''}
                onValueChange={(value) => handleTeamSelection(value, 'technical')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une équipe" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex flex-col">
                        <span>{team.name}</span>
                        {team.organizations && (
                          <span className="text-xs text-muted-foreground">
                            {team.organizations.name}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.technical_owner_team_id && getTeamOrganization(formData.technical_owner_team_id) && (
                <p className="text-sm text-muted-foreground">
                  Organisation: {getTeamOrganization(formData.technical_owner_team_id)}
                </p>
              )}
            </div>
          </div>

          {/* Stack applicative */}
          <div className="space-y-2">
            <Label>Stack applicative</Label>
            <div className="space-y-2">
              <Select
                onValueChange={addToApplicationStack}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ajouter une application" />
                </SelectTrigger>
                <SelectContent>
                  {applications
                    .filter(app => !formData.application_stack?.includes(app.id))
                    .map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.name} ({app.application_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {formData.application_stack && formData.application_stack.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.application_stack.map((appId) => {
                    const app = applications.find(a => a.id === appId);
                    return app ? (
                      <Badge key={appId} variant="secondary" className="flex items-center gap-1">
                        {app.name}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive/20"
                          onClick={() => removeFromApplicationStack(appId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Stack technique */}
          <div className="space-y-2">
            <Label>Stack technique (Cloud Assets)</Label>
            <div className="space-y-2">
              <Select
                onValueChange={addToTechnicalStack}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ajouter un asset cloud" />
                </SelectTrigger>
                <SelectContent>
                  {cloudAssets
                    .filter(asset => !formData.technical_stack?.includes(asset.id))
                    .map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.asset_name} ({asset.asset_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {formData.technical_stack && formData.technical_stack.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.technical_stack.map((assetId) => {
                    const asset = cloudAssets.find(a => a.id === assetId);
                    return asset ? (
                      <Badge key={assetId} variant="secondary" className="flex items-center gap-1">
                        {asset.asset_name}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive/20"
                          onClick={() => removeFromTechnicalStack(assetId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Création..." : "Créer le service"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}