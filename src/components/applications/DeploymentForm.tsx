import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { 
  Server, 
  Cloud,
  Globe,
  Settings,
  Activity,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useDeployments } from '@/hooks/useDeployments';
import type { 
  CreateDeploymentData, 
  ApplicationDeploymentWithDetails,
  CloudAssetSummary 
} from '@/types/application';

const deploymentSchema = z.object({
  application_id: z.string().min(1, 'Application requise'),
  cloud_asset_id: z.string().min(1, 'Actif cloud requis'),
  environment_name: z.string().min(1, 'Environnement requis'),
  deployment_type: z.string().min(1, 'Type de déploiement requis'),
  status: z.string().min(1, 'Statut requis'),
  version: z.string().optional(),
  health_check_url: z.string().url('URL invalide').optional().or(z.literal('')),
  configuration: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional()
});

type DeploymentFormValues = z.infer<typeof deploymentSchema>;

interface DeploymentFormProps {
  initialData?: ApplicationDeploymentWithDetails;
  applicationId?: string; // Si on veut pré-sélectionner une application
  onSubmit: (data: CreateDeploymentData) => Promise<boolean>;
  onCancel: () => void;
  loading?: boolean;
  mode: 'create' | 'edit';
}

const ENVIRONMENTS = [
  { value: 'development', label: 'Development', description: 'Environnement de développement', color: 'bg-blue-100 text-blue-800' },
  { value: 'staging', label: 'Staging', description: 'Pré-production', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'production', label: 'Production', description: 'Environnement de production', color: 'bg-green-100 text-green-800' },
  { value: 'testing', label: 'Testing', description: 'Tests et QA', color: 'bg-purple-100 text-purple-800' },
  { value: 'demo', label: 'Demo', description: 'Démonstration client', color: 'bg-orange-100 text-orange-800' }
];

const DEPLOYMENT_TYPES = [
  { value: 'manual', label: 'Manuel', description: 'Déploiement manuel' },
  { value: 'automated', label: 'Automatisé', description: 'Via CI/CD pipeline' },
  { value: 'hotfix', label: 'Hotfix', description: 'Correction urgente' },
  { value: 'rollback', label: 'Rollback', description: 'Retour version précédente' },
  { value: 'blue_green', label: 'Blue-Green', description: 'Déploiement blue-green' },
  { value: 'canary', label: 'Canary', description: 'Déploiement canary' }
];

const DEPLOYMENT_STATUSES = [
  { value: 'pending', label: 'En attente', description: 'En cours de déploiement', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'active', label: 'Actif', description: 'Déployé et fonctionnel', color: 'bg-green-100 text-green-800' },
  { value: 'failed', label: 'Échoué', description: 'Échec du déploiement', color: 'bg-red-100 text-red-800' },
  { value: 'inactive', label: 'Inactif', description: 'Arrêté ou suspendu', color: 'bg-gray-100 text-gray-800' },
  { value: 'maintenance', label: 'Maintenance', description: 'En cours de maintenance', color: 'bg-orange-100 text-orange-800' }
];

export const DeploymentForm: React.FC<DeploymentFormProps> = ({
  initialData,
  applicationId,
  onSubmit,
  onCancel,
  loading = false,
  mode
}) => {
  const { fetchAvailableCloudAssets, fetchAvailableApplications } = useDeployments();
  
  const [cloudAssets, setCloudAssets] = useState<CloudAssetSummary[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);

  const form = useForm<DeploymentFormValues>({
    resolver: zodResolver(deploymentSchema),
    defaultValues: {
      application_id: applicationId || initialData?.application_id || '',
      cloud_asset_id: initialData?.cloud_asset_id || '',
      environment_name: initialData?.environment_name || '',
      deployment_type: initialData?.deployment_type || '',
      status: initialData?.status || 'pending',
      version: initialData?.version || '',
      health_check_url: initialData?.health_check_url || '',
      configuration: initialData?.configuration || {},
      metadata: initialData?.metadata || {}
    }
  });

  // Charger les données nécessaires
  useEffect(() => {
    const loadData = async () => {
      setLoadingAssets(true);
      try {
        const [assetsData, appsData] = await Promise.all([
          fetchAvailableCloudAssets(),
          fetchAvailableApplications()
        ]);
        setCloudAssets(assetsData);
        setApplications(appsData);
      } catch (error) {
        console.error('Error loading form data:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoadingAssets(false);
      }
    };

    loadData();
  }, [fetchAvailableCloudAssets, fetchAvailableApplications]);

  const handleSubmit = async (data: DeploymentFormValues) => {
    try {
      const success = await onSubmit(data as CreateDeploymentData);
      if (success) {
        form.reset();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const getEnvironmentIcon = (env: string) => {
    switch (env) {
      case 'production': return <Globe className="h-4 w-4" />;
      case 'staging': return <Server className="h-4 w-4" />;
      case 'development': return <Settings className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loadingAssets) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Configuration de base</TabsTrigger>
            <TabsTrigger value="advanced">Configuration avancée</TabsTrigger>
            <TabsTrigger value="metadata">Métadonnées</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Informations du déploiement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Application */}
                <FormField
                  control={form.control}
                  name="application_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!applicationId}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner l'application" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {applications.map((app) => (
                            <SelectItem key={app.id} value={app.id}>
                              <div className="flex items-center gap-2">
                                <Server className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">{app.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {app.application_type} {app.version && `v${app.version}`}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cloud Asset */}
                <FormField
                  control={form.control}
                  name="cloud_asset_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actif cloud *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner l'actif cloud" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cloudAssets.map((asset) => (
                            <SelectItem key={asset.id} value={asset.id}>
                              <div className="flex items-center gap-2">
                                <Cloud className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">
                                    {asset.asset_name || `Asset ${asset.id.slice(0, 8)}`}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {asset.asset_type} - {asset.region}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Infrastructure sur laquelle déployer l'application
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Environnement */}
                <FormField
                  control={form.control}
                  name="environment_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Environnement *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner l'environnement" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ENVIRONMENTS.map((env) => (
                            <SelectItem key={env.value} value={env.value}>
                              <div className="flex items-center gap-2">
                                {getEnvironmentIcon(env.value)}
                                <div>
                                  <div className="font-medium">{env.label}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {env.description}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  {/* Type de déploiement */}
                  <FormField
                    control={form.control}
                    name="deployment_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de déploiement *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DEPLOYMENT_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div>
                                  <div className="font-medium">{type.label}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {type.description}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Statut */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statut *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Statut" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DEPLOYMENT_STATUSES.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${status.color.replace('text-', 'bg-').split(' ')[0]}`} />
                                  <div>
                                    <div className="font-medium">{status.label}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {status.description}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Version */}
                <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Version</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="ex: 1.2.3" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Version de l'application à déployer
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Aperçu de la configuration */}
                {form.watch('environment_name') && (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Environnement sélectionné:</span>
                    <Badge className={ENVIRONMENTS.find(e => e.value === form.watch('environment_name'))?.color}>
                      {getEnvironmentIcon(form.watch('environment_name'))}
                      <span className="ml-1">
                        {ENVIRONMENTS.find(e => e.value === form.watch('environment_name'))?.label}
                      </span>
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuration avancée
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Health Check URL */}
                <FormField
                  control={form.control}
                  name="health_check_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de vérification (Health Check)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="https://api.example.com/health" 
                            className="pl-10"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        URL pour vérifier l'état de santé du déploiement
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Configuration JSON */}
                <div className="space-y-2">
                  <FormLabel>Configuration technique</FormLabel>
                  <FormDescription>
                    Configuration spécifique au déploiement (variables d'environnement, paramètres, etc.)
                  </FormDescription>
                  <Textarea
                    placeholder='{"NODE_ENV": "production", "DATABASE_URL": "...", "API_KEY": "..."}'
                    rows={6}
                    value={JSON.stringify(form.watch('configuration') || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        form.setValue('configuration', parsed);
                      } catch {
                        // JSON invalide, on ignore
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Métadonnées du déploiement</CardTitle>
              </CardHeader>
              <CardContent>
                <FormDescription className="mb-4">
                  Informations supplémentaires au format JSON (tags, contacts, documentation, etc.)
                </FormDescription>
                <Textarea
                  placeholder='{"tags": ["critical", "backend"], "contact": "team@example.com", "documentation": "https://docs.example.com"}'
                  rows={8}
                  value={JSON.stringify(form.watch('metadata') || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      form.setValue('metadata', parsed);
                    } catch {
                      // JSON invalide, on ignore
                    }
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'En cours...' : mode === 'create' ? 'Créer le déploiement' : 'Mettre à jour'}
          </Button>
        </div>
      </form>
    </Form>
  );
}; 