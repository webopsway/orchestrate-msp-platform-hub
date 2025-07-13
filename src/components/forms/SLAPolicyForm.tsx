import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, AlertTriangle, Building2, Network } from 'lucide-react';
import { useMspClientRelations } from '@/hooks/useMspClientRelations';

const slaFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  client_type: z.enum(['direct', 'via_esn', 'all']),
  client_organization_id: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  ticket_category: z.string().optional(),
  response_time_hours: z.number().min(0.5, 'Le temps de réponse doit être d\'au moins 30 minutes'),
  resolution_time_hours: z.number().min(1, 'Le temps de résolution doit être d\'au moins 1 heure'),
  escalation_time_hours: z.number().optional(),
  escalation_to: z.string().optional(),
  is_active: z.boolean(),
  description: z.string().optional(),
});

type SLAFormData = z.infer<typeof slaFormSchema>;

interface SLAPolicyFormProps {
  initialData?: Partial<SLAFormData>;
  onSubmit: (data: SLAFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  mode: 'create' | 'edit';
}

const clientTypeOptions = [
  { value: 'direct', label: 'Client direct', icon: Building2 },
  { value: 'via_esn', label: 'Via ESN', icon: Network },
  { value: 'all', label: 'Tous les clients', icon: Building2 },
];

const priorityOptions = [
  { value: 'low', label: 'Faible', color: 'text-green-600' },
  { value: 'medium', label: 'Moyenne', color: 'text-yellow-600' },
  { value: 'high', label: 'Élevée', color: 'text-orange-600' },
  { value: 'critical', label: 'Critique', color: 'text-red-600' },
];

export const SLAPolicyForm: React.FC<SLAPolicyFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  mode
}) => {
  const { relations } = useMspClientRelations();
  
  const form = useForm<SLAFormData>({
    resolver: zodResolver(slaFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      client_type: initialData?.client_type || 'direct',
      client_organization_id: initialData?.client_organization_id || '',
      priority: initialData?.priority || 'medium',
      ticket_category: initialData?.ticket_category || '',
      response_time_hours: initialData?.response_time_hours || 4,
      resolution_time_hours: initialData?.resolution_time_hours || 24,
      escalation_time_hours: initialData?.escalation_time_hours || undefined,
      escalation_to: initialData?.escalation_to || '',
      is_active: initialData?.is_active ?? true,
      description: initialData?.description || '',
    },
  });

  const watchResponseTime = form.watch('response_time_hours');
  const watchResolutionTime = form.watch('resolution_time_hours');

  // Validation: temps de résolution doit être supérieur au temps de réponse
  useEffect(() => {
    if (watchResponseTime && watchResolutionTime && watchResponseTime >= watchResolutionTime) {
      form.setError('resolution_time_hours', {
        type: 'manual',
        message: 'Le temps de résolution doit être supérieur au temps de réponse'
      });
    } else {
      form.clearErrors('resolution_time_hours');
    }
  }, [watchResponseTime, watchResolutionTime, form]);

  const handleSubmit = (data: SLAFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la politique</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ex: Client Direct - Priorité Critique"
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
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description de la politique SLA..."
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de client</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {clientTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <option.icon className="h-4 w-4" />
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priorité</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className={`flex items-center gap-2 ${option.color}`}>
                                {option.value === 'critical' && <AlertTriangle className="h-4 w-4" />}
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sélection du client spécifique */}
            <FormField
              control={form.control}
              name="client_organization_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client spécifique (optionnel)</FormLabel>
                  <FormControl>
                    <Select value={field.value || 'all_clients'} onValueChange={(value) => field.onChange(value === 'all_clients' ? undefined : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un client..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_clients">Tous les clients du type sélectionné</SelectItem>
                        {relations
                          .filter(relation => relation.is_active && relation.client_organization)
                          .map((relation) => (
                            <SelectItem key={relation.client_organization!.id} value={relation.client_organization!.id}>
                              {relation.client_organization!.name}
                              {relation.relation_type === 'via_esn' && relation.esn_organization && 
                                ` (via ${relation.esn_organization.name})`
                              }
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ticket_category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de ticket (optionnel)</FormLabel>
                  <FormControl>
                    <Select value={field.value || 'all_types'} onValueChange={(value) => field.onChange(value === 'all_types' ? undefined : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_types">Tous les types</SelectItem>
                        <SelectItem value="incident">Incident</SelectItem>
                        <SelectItem value="change_request">Demande de changement</SelectItem>
                        <SelectItem value="service_request">Demande de service</SelectItem>
                        <SelectItem value="security">Sécurité</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Délais SLA */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Délais SLA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="response_time_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temps de réponse (heures)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.5"
                        min="0.5"
                        placeholder="4"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="resolution_time_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temps de résolution (heures)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="1"
                        min="1"
                        placeholder="24"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="escalation_time_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temps d'escalade (heures, optionnel)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      step="1"
                      min="1"
                      placeholder="8"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="escalation_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Escalader vers (optionnel)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ID de l'utilisateur ou équipe..."
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Statut */}
        <Card>
          <CardContent className="pt-6">
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>Politique active</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Active cette politique pour qu'elle soit utilisée dans le système
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Enregistrement...' : mode === 'create' ? 'Créer' : 'Modifier'}
          </Button>
        </div>
      </form>
    </Form>
  );
};