import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
  Plus, 
  X,
  Code,
  Link,
  FileText,
  Package,
  GitBranch,
  Globe,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { useBusinessServices } from '@/hooks/useBusinessServices';
import type { ApplicationFormData, ApplicationWithDetails } from '@/types/application';

const applicationSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  description: z.string().optional(),
  application_type: z.string().min(1, 'Le type d\'application est requis'),
  version: z.string().optional(),
  technology_stack: z.array(z.string()).optional().default([]),
  business_services: z.array(z.string()).optional().default([]),
  repository_url: z.string().url('URL invalide').optional().or(z.literal('')),
  documentation_url: z.string().url('URL invalide').optional().or(z.literal('')),
  metadata: z.record(z.any()).optional()
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

interface ApplicationFormProps {
  initialData?: ApplicationWithDetails;
  onSubmit: (data: ApplicationFormData) => Promise<boolean>;
  onCancel: () => void;
  loading?: boolean;
  mode: 'create' | 'edit';
}

const APPLICATION_TYPES = [
  { value: 'web', label: 'Application Web', description: 'Interface utilisateur web' },
  { value: 'api', label: 'API/Service', description: 'Service backend ou API REST' },
  { value: 'mobile', label: 'Application Mobile', description: 'App mobile native ou hybride' },
  { value: 'desktop', label: 'Application Desktop', description: 'Application de bureau' },
  { value: 'microservice', label: 'Microservice', description: 'Service distribué' },
  { value: 'database', label: 'Base de données', description: 'Système de gestion de données' },
  { value: 'batch', label: 'Traitement par lot', description: 'Job de traitement automatisé' },
  { value: 'integration', label: 'Intégration', description: 'Connecteur ou middleware' },
  { value: 'monitoring', label: 'Surveillance', description: 'Outil de monitoring' },
  { value: 'security', label: 'Sécurité', description: 'Composant de sécurité' }
];

const COMMON_TECHNOLOGIES = [
  // Frontend
  'React', 'Vue.js', 'Angular', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS',
  // Backend
  'Node.js', 'Express', 'FastAPI', 'Django', 'Flask', 'Spring Boot', 'ASP.NET Core', 'Go', 'Rust',
  // Databases
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'SQLite',
  // Cloud & Infrastructure
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Terraform', 'Nginx', 'Apache',
  // Languages
  'Python', 'Java', 'C#', 'PHP', 'Ruby', 'Kotlin', 'Swift',
  // Tools
  'Git', 'Jenkins', 'GitLab CI', 'GitHub Actions', 'Grafana', 'Prometheus'
];

export const ApplicationForm: React.FC<ApplicationFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  mode
}) => {
  const { services: businessServices } = useBusinessServices();
  
  const [newTechnology, setNewTechnology] = useState('');

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      application_type: initialData?.application_type || '',
      version: initialData?.version || '',
      technology_stack: initialData?.technology_stack || [],
      business_services: initialData?.business_services || [],
      repository_url: initialData?.repository_url || '',
      documentation_url: initialData?.documentation_url || '',
      metadata: initialData?.metadata || {}
    }
  });

  const { fields: techStackFields, append: appendTech, remove: removeTech } = useFieldArray({
    control: form.control,
    name: 'technology_stack'
  });

  const { fields: businessServiceFields, append: appendService, remove: removeService } = useFieldArray({
    control: form.control,
    name: 'business_services'
  });

  const handleSubmit = async (data: ApplicationFormValues) => {
    try {
      const success = await onSubmit(data as ApplicationFormData);
      if (success) {
        form.reset();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const addTechnology = () => {
    if (newTechnology.trim()) {
      appendTech(newTechnology.trim());
      setNewTechnology('');
    }
  };

  const addBusinessService = (serviceId: string) => {
    const currentServices = form.getValues('business_services');
    if (!currentServices.includes(serviceId)) {
      appendService(serviceId);
    }
  };

  const getApplicationTypeIcon = (type: string) => {
    switch (type) {
      case 'web': return <Globe className="h-4 w-4" />;
      case 'api': return <Server className="h-4 w-4" />;
      case 'mobile': return <Package className="h-4 w-4" />;
      case 'database': return <FileText className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Informations de base</TabsTrigger>
            <TabsTrigger value="technology">Stack technique</TabsTrigger>
            <TabsTrigger value="services">Services métiers</TabsTrigger>
            <TabsTrigger value="metadata">Métadonnées</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'application *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="ex: API de facturation" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Description détaillée de l'application..."
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="application_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type d'application *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner le type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {APPLICATION_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  {getApplicationTypeIcon(type.value)}
                                  <div>
                                    <div className="font-medium">{type.label}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {type.description}
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

                  <FormField
                    control={form.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="ex: 1.0.0" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Version actuelle de l'application
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="repository_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL du repository</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <GitBranch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="https://github.com/org/repo" 
                              className="pl-10"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="documentation_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL de la documentation</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="https://docs.example.com" 
                              className="pl-10"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Aperçu du type sélectionné */}
                {form.watch('application_type') && (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Type sélectionné:</span>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {getApplicationTypeIcon(form.watch('application_type'))}
                      {APPLICATION_TYPES.find(t => t.value === form.watch('application_type'))?.label}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="technology" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Technologies utilisées
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ajouter une technologie"
                      value={newTechnology}
                      onChange={(e) => setNewTechnology(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                    />
                    <Button type="button" onClick={addTechnology} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {COMMON_TECHNOLOGIES.map((tech) => (
                      <Button
                        key={tech}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => {
                          if (!form.getValues('technology_stack')?.includes(tech)) {
                            appendTech(tech);
                          }
                        }}
                      >
                        {tech}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Technologies sélectionnées</h4>
                  {techStackFields.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {techStackFields.map((field, index) => (
                        <Badge key={field.id} variant="secondary" className="flex items-center gap-1">
                          {field.value}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => removeTech(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Aucune technologie sélectionnée
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Services métiers liés
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Services disponibles</h4>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {businessServices.map((service) => {
                      const isSelected = form.getValues('business_services').includes(service.id);
                      return (
                        <div
                          key={service.id}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-primary/10 border-primary' 
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => {
                            if (isSelected) {
                              const index = businessServiceFields.findIndex(f => f.value === service.id);
                              if (index >= 0) removeService(index);
                            } else {
                              addBusinessService(service.id);
                            }
                          }}
                        >
                          <div>
                            <div className="font-medium">{service.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {service.description || 'Aucune description'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              service.criticality === 'critical' ? 'destructive' :
                              service.criticality === 'high' ? 'secondary' :
                              'outline'
                            }>
                              {service.criticality}
                            </Badge>
                            {isSelected && (
                              <Badge variant="default">Sélectionné</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {businessServiceFields.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Services sélectionnés ({businessServiceFields.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {businessServiceFields.map((field, index) => {
                        const service = businessServices.find(s => s.id === field.value);
                        return (
                          <Badge key={field.id} variant="default" className="flex items-center gap-1">
                            {service?.name || 'Service inconnu'}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => removeService(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Métadonnées et configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormDescription className="mb-4">
                  Métadonnées au format JSON pour des informations supplémentaires spécifiques à votre organisation.
                </FormDescription>
                <div className="mt-4">
                  <Textarea
                    placeholder='{"environment": "production", "team": "backend", "maintainer": "john@example.com"}'
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
                </div>
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
            {loading ? 'En cours...' : mode === 'create' ? 'Créer l\'application' : 'Mettre à jour'}
          </Button>
        </div>
      </form>
    </Form>
  );
}; 