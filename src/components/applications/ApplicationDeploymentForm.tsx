import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import type { CreateApplicationDeploymentData } from '@/types/application';

interface ApplicationDeploymentFormProps {
  onSubmit: (data: CreateApplicationDeploymentData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CreateApplicationDeploymentData>;
}

export function ApplicationDeploymentForm({ onSubmit, onCancel, initialData }: ApplicationDeploymentFormProps) {
  const [applications, setApplications] = useState<any[]>([]);
  const [cloudAssets, setCloudAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreateApplicationDeploymentData>({
    application_id: initialData?.application_id || '',
    cloud_asset_id: initialData?.cloud_asset_id || '',
    environment_name: initialData?.environment_name || '',
    deployment_type: initialData?.deployment_type || 'development',
    status: initialData?.status || 'running',
    version: initialData?.version || '',
    configuration: initialData?.configuration || {},
    health_check_url: initialData?.health_check_url || '',
    deployment_date: initialData?.deployment_date || new Date().toISOString().split('T')[0],
    metadata: initialData?.metadata || {}
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les applications
        const { data: appsData } = await supabase
          .from('applications')
          .select('id, name, application_type')
          .order('name');
        
        if (appsData) setApplications(appsData);

        // Récupérer les cloud assets
        const { data: assetsData } = await supabase
          .from('cloud_asset')
          .select('id, asset_name, asset_type, region')
          .order('asset_name');
        
        if (assetsData) setCloudAssets(assetsData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    fetchData();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.application_id) {
      newErrors.application_id = "L'application est requise";
    }
    if (!formData.cloud_asset_id) {
      newErrors.cloud_asset_id = "L'asset cloud est requis";
    }
    if (!formData.environment_name.trim()) {
      newErrors.environment_name = "Le nom d'environnement est requis";
    }
    if (!formData.deployment_date) {
      newErrors.deployment_date = "La date de déploiement est requise";
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
      await onSubmit({
        ...formData,
        deployment_date: new Date(formData.deployment_date).toISOString()
      });
    } catch (error) {
      console.error('Error submitting deployment form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouveau Déploiement</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Application */}
            <div className="space-y-2">
              <Label htmlFor="application_id">Application *</Label>
              <Select
                value={formData.application_id}
                onValueChange={(value) => setFormData({ ...formData, application_id: value })}
              >
                <SelectTrigger className={errors.application_id ? "border-destructive" : ""}>
                  <SelectValue placeholder="Sélectionner une application" />
                </SelectTrigger>
                <SelectContent>
                  {applications.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.name} ({app.application_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.application_id && (
                <p className="text-sm text-destructive">{errors.application_id}</p>
              )}
            </div>

            {/* Cloud Asset */}
            <div className="space-y-2">
              <Label htmlFor="cloud_asset_id">Asset Cloud *</Label>
              <Select
                value={formData.cloud_asset_id}
                onValueChange={(value) => setFormData({ ...formData, cloud_asset_id: value })}
              >
                <SelectTrigger className={errors.cloud_asset_id ? "border-destructive" : ""}>
                  <SelectValue placeholder="Sélectionner un asset" />
                </SelectTrigger>
                <SelectContent>
                  {cloudAssets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.asset_name} ({asset.asset_type})
                      {asset.region && ` - ${asset.region}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.cloud_asset_id && (
                <p className="text-sm text-destructive">{errors.cloud_asset_id}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Environnement */}
            <div className="space-y-2">
              <Label htmlFor="environment_name">Environnement *</Label>
              <Input
                id="environment_name"
                value={formData.environment_name}
                onChange={(e) => setFormData({ ...formData, environment_name: e.target.value })}
                placeholder="Ex: production, staging, dev"
                className={errors.environment_name ? "border-destructive" : ""}
              />
              {errors.environment_name && (
                <p className="text-sm text-destructive">{errors.environment_name}</p>
              )}
            </div>

            {/* Type de déploiement */}
            <div className="space-y-2">
              <Label htmlFor="deployment_type">Type de déploiement</Label>
              <Select
                value={formData.deployment_type}
                onValueChange={(value: 'production' | 'staging' | 'development' | 'test') => 
                  setFormData({ ...formData, deployment_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="development">Développement</SelectItem>
                  <SelectItem value="test">Test</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Statut */}
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'running' | 'stopped' | 'deploying' | 'error') => 
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="running">En cours d'exécution</SelectItem>
                  <SelectItem value="stopped">Arrêté</SelectItem>
                  <SelectItem value="deploying">En cours de déploiement</SelectItem>
                  <SelectItem value="error">Erreur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Version */}
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="Ex: 1.0.0, latest"
              />
            </div>

            {/* Date de déploiement */}
            <div className="space-y-2">
              <Label htmlFor="deployment_date">Date de déploiement *</Label>
              <Input
                id="deployment_date"
                type="date"
                value={formData.deployment_date}
                onChange={(e) => setFormData({ ...formData, deployment_date: e.target.value })}
                className={errors.deployment_date ? "border-destructive" : ""}
              />
              {errors.deployment_date && (
                <p className="text-sm text-destructive">{errors.deployment_date}</p>
              )}
            </div>

            {/* URL de santé */}
            <div className="space-y-2">
              <Label htmlFor="health_check_url">URL de vérification</Label>
              <Input
                id="health_check_url"
                type="url"
                value={formData.health_check_url}
                onChange={(e) => setFormData({ ...formData, health_check_url: e.target.value })}
                placeholder="https://app.example.com/health"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Création..." : "Créer le déploiement"}
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