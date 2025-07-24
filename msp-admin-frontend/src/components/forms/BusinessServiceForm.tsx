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
  Layers, 
  User, 
  Users, 
  AlertTriangle, 
  Plus, 
  X,
  Shield,
  Server,
  Code
} from 'lucide-react';
import { toast } from 'sonner';
import { useOrganizationsAndTeams } from '@/hooks/useOrganizationsAndTeams';
import { useUsers } from '@/hooks/useUsers';
import type { BusinessServiceFormData, BusinessServiceWithDetails } from '@/types/businessService';

const businessServiceSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  description: z.string().optional(),
  criticality: z.enum(['low', 'medium', 'high', 'critical'], {
    required_error: 'La criticité est requise'
  }),
  service_level: z.string().min(1, 'Le niveau de service est requis'),
  business_owner: z.string().optional(),
  business_owner_team_id: z.string().optional(),
  technical_owner: z.string().optional(),
  technical_owner_team_id: z.string().optional(),
  application_stack: z.array(z.string()).optional().default([]),
  technical_stack: z.array(z.string()).optional().default([]),
  metadata: z.record(z.any()).optional()
});

type BusinessServiceFormValues = z.infer<typeof businessServiceSchema>;

interface BusinessServiceFormProps {
  initialData?: BusinessServiceWithDetails;
  onSubmit: (data: BusinessServiceFormData) => Promise<boolean>;
  onCancel: () => void;
  loading?: boolean;
  mode: 'create' | 'edit';
}

const CRITICALITY_OPTIONS = [
  { value: 'low', label: 'Faible', color: 'bg-green-100 text-green-800', icon: Shield },
  { value: 'medium', label: 'Moyenne', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  { value: 'high', label: 'Élevée', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  { value: 'critical', label: 'Critique', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
];

const SERVICE_LEVEL_OPTIONS = [
  { value: 'bronze', label: 'Bronze', description: 'Service de base' },
  { value: 'silver', label: 'Silver', description: 'Service standard' },
  { value: 'gold', label: 'Gold', description: 'Service premium' },
  { value: 'platinum', label: 'Platinum', description: 'Service critique' }
];

const COMMON_TECH_STACK = [
  'React', 'Vue.js', 'Angular', 'Node.js', 'Express', 'FastAPI', 'Django',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
  'AWS', 'Azure', 'GCP', 'Nginx', 'Apache', 'JavaScript', 'TypeScript',
  'Python', 'Java', 'C#', 'Go', 'Rust'
];

const COMMON_APP_STACK = [
  'Web Application', 'Mobile App', 'API', 'Microservice', 'Database',
  'Cache', 'Message Queue', 'Load Balancer', 'CDN', 'Monitoring',
  'Logging', 'Authentication', 'Payment', 'Notification'
];

export const BusinessServiceForm: React.FC<BusinessServiceFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  mode
}) => {
  const { data: orgData } = useOrganizationsAndTeams();
  const { users } = useUsers();
  
  const [newTechStack, setNewTechStack] = useState('');
  const [newAppStack, setNewAppStack] = useState('');

  const form = useForm<BusinessServiceFormValues>({
    resolver: zodResolver(businessServiceSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      criticality: initialData?.criticality || 'medium',
      service_level: initialData?.service_level || 'bronze',
      business_owner: initialData?.business_owner || '',
      business_owner_team_id: initialData?.business_owner_team_id || '',
      technical_owner: initialData?.technical_owner || '',
      technical_owner_team_id: initialData?.technical_owner_team_id || '',
      application_stack: initialData?.application_stack || [],
      technical_stack: initialData?.technical_stack || [],
      metadata: initialData?.metadata || {}
    }
  });

  const { fields: techStackFields, append: appendTechStack, remove: removeTechStack } = useFieldArray({
    control: form.control,
    name: 'technical_stack'
  });

  const { fields: appStackFields, append: appendAppStack, remove: removeAppStack } = useFieldArray({
    control: form.control,
    name: 'application_stack'
  });

  const handleSubmit = async (data: BusinessServiceFormValues) => {
    try {
      const success = await onSubmit(data as BusinessServiceFormData);
      if (success) {
        form.reset();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const addTechStack = () => {
    if (newTechStack.trim()) {
      appendTechStack(newTechStack.trim());
      setNewTechStack('');
    }
  };

  const addAppStack = () => {
    if (newAppStack.trim()) {
      appendAppStack(newAppStack.trim());
      setNewAppStack('');
    }
  };

  const getCriticalityDisplay = (criticality: string) => {
    const option = CRITICALITY_OPTIONS.find(opt => opt.value === criticality);
    if (!option) return null;
    
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
        <option.icon className="h-3 w-3" />
        {option.label}
      </div>
    );
  };

  const teams = orgData?.teams || [];
  const businessUsers = users.filter(user => 
    teams.some(team => team.id === user.default_team_id)
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Informations de base</TabsTrigger>
            <TabsTrigger value="owners">Propriétaires</TabsTrigger>
            <TabsTrigger value="stack">Stack technique</TabsTrigger>
            <TabsTrigger value="metadata">Métadonnées</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du service *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="ex: Service de facturation" 
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
                          placeholder="Description détaillée du service métier..."
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
                    name="criticality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Criticité *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner la criticité" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CRITICALITY_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <option.icon className="h-4 w-4" />
                                  <span>{option.label}</span>
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
                    name="service_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Niveau de service *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner le niveau" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SERVICE_LEVEL_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div>
                                  <div className="font-medium">{option.label}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {option.description}
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

                {/* Affichage de la criticité sélectionnée */}
                {form.watch('criticality') && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Criticité sélectionnée:</span>
                    {getCriticalityDisplay(form.watch('criticality'))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="owners" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Propriétaires du service
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Propriétaire métier */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Propriétaire métier
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="business_owner"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Utilisateur</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un utilisateur" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {businessUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  <div>
                                    <div className="font-medium">
                                      {user.first_name} {user.last_name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {user.email}
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
                      name="business_owner_team_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Équipe</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une équipe" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {teams.map((team) => (
                                <SelectItem key={team.id} value={team.id}>
                                  {team.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Propriétaire technique */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Propriétaire technique
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="technical_owner"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Utilisateur</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un utilisateur" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {businessUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  <div>
                                    <div className="font-medium">
                                      {user.first_name} {user.last_name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {user.email}
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
                      name="technical_owner_team_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Équipe</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une équipe" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {teams.map((team) => (
                                <SelectItem key={team.id} value={team.id}>
                                  {team.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stack" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stack technique */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Stack technique
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ajouter une technologie"
                        value={newTechStack}
                        onChange={(e) => setNewTechStack(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechStack())}
                      />
                      <Button type="button" onClick={addTechStack} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {COMMON_TECH_STACK.map((tech) => (
                        <Button
                          key={tech}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => {
                            if (!form.getValues('technical_stack')?.includes(tech)) {
                              appendTechStack(tech);
                            }
                          }}
                        >
                          {tech}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {techStackFields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <Badge variant="secondary" className="flex-1">
                          {field.value}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTechStack(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Stack applicative */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Stack applicative
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ajouter un composant"
                        value={newAppStack}
                        onChange={(e) => setNewAppStack(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAppStack())}
                      />
                      <Button type="button" onClick={addAppStack} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {COMMON_APP_STACK.map((app) => (
                        <Button
                          key={app}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => {
                            if (!form.getValues('application_stack')?.includes(app)) {
                              appendAppStack(app);
                            }
                          }}
                        >
                          {app}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {appStackFields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <Badge variant="secondary" className="flex-1">
                          {field.value}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAppStack(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Métadonnées et informations complémentaires</CardTitle>
              </CardHeader>
              <CardContent>
                <FormDescription>
                  Les métadonnées permettent de stocker des informations supplémentaires spécifiques à votre organisation.
                </FormDescription>
                <div className="mt-4">
                  <Textarea
                    placeholder='{"environment": "production", "cost_center": "IT001", "contact_email": "admin@example.com"}'
                    rows={6}
                    value={JSON.stringify(form.watch('metadata') || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        form.setValue('metadata', parsed);
                      } catch {
                        // Invalid JSON, ignore
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
            {loading ? 'En cours...' : mode === 'create' ? 'Créer le service' : 'Mettre à jour'}
          </Button>
        </div>
      </form>
    </Form>
  );
}; 