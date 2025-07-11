import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { supabase } from '@/integrations/supabase/client';
import { CreateMspClientRelationData, MspClientRelation } from '@/hooks/useMspClientRelations';
import { cn } from '@/lib/utils';

const relationSchema = z.object({
  msp_organization_id: z.string().min(1, 'Sélectionnez une organisation MSP'),
  client_organization_id: z.string().min(1, 'Sélectionnez une organisation cliente'),
  esn_organization_id: z.string().optional(),
  relation_type: z.enum(['direct', 'via_esn'], {
    required_error: 'Sélectionnez un type de relation'
  }),
  start_date: z.date({
    required_error: 'Sélectionnez une date de début'
  }),
  end_date: z.date().optional(),
  description: z.string().optional()
});

type RelationFormData = z.infer<typeof relationSchema>;

interface Organization {
  id: string;
  name: string;
  type: string;
  is_msp?: boolean;
}

interface MspClientRelationFormProps {
  relation?: MspClientRelation;
  onSubmit: (data: CreateMspClientRelationData) => Promise<boolean>;
  onCancel: () => void;
  loading?: boolean;
}

export const MspClientRelationForm = ({
  relation,
  onSubmit,
  onCancel,
  loading = false
}: MspClientRelationFormProps) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  const form = useForm<RelationFormData>({
    resolver: zodResolver(relationSchema),
    defaultValues: {
      msp_organization_id: relation?.msp_organization_id || '',
      client_organization_id: relation?.client_organization_id || '',
      esn_organization_id: relation?.esn_organization_id || '',
      relation_type: relation?.relation_type as 'direct' | 'via_esn' || 'direct',
      start_date: relation?.start_date ? new Date(relation.start_date) : new Date(),
      end_date: relation?.end_date ? new Date(relation.end_date) : undefined,
      description: relation?.metadata?.description || ''
    }
  });

  const watchedRelationType = form.watch('relation_type');
  const watchedMspOrg = form.watch('msp_organization_id');
  const watchedClientOrg = form.watch('client_organization_id');

  // Charger les organisations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name, type, is_msp')
          .order('name');

        if (error) throw error;
        setOrganizations(data || []);
      } catch (error) {
        console.error('Error fetching organizations:', error);
      } finally {
        setLoadingOrgs(false);
      }
    };

    fetchOrganizations();
  }, []);

  // Filtrer les organisations selon leur type
  const mspOrganizations = organizations.filter(org => org.type === 'msp' || org.is_msp);
  const clientOrganizations = organizations.filter(org => org.type === 'client');
  const esnOrganizations = organizations.filter(org => org.type === 'esn');

  const handleSubmit = async (data: RelationFormData) => {
    const submitData: CreateMspClientRelationData = {
      msp_organization_id: data.msp_organization_id,
      client_organization_id: data.client_organization_id,
      esn_organization_id: data.esn_organization_id || undefined,
      relation_type: data.relation_type,
      start_date: data.start_date.toISOString(),
      end_date: data.end_date?.toISOString(),
      metadata: data.description ? { description: data.description } : undefined
    };

    const success = await onSubmit(submitData);
    if (success) {
      form.reset();
    }
  };

  const getRelationDescription = () => {
    if (watchedRelationType === 'direct') {
      return 'Le MSP gère directement le client sans intermédiaire ESN.';
    } else {
      return 'Le MSP intervient via une ESN qui est le gestionnaire contractuel du client.';
    }
  };

  const getSelectedOrgNames = () => {
    const mspOrg = organizations.find(org => org.id === watchedMspOrg);
    const clientOrg = organizations.find(org => org.id === watchedClientOrg);
    return { mspOrg, clientOrg };
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec prévisualisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {relation ? 'Modifier la relation MSP-Client' : 'Créer une relation MSP-Client'}
          </CardTitle>
          <CardDescription>
            {getRelationDescription()}
          </CardDescription>
        </CardHeader>
        {(watchedMspOrg || watchedClientOrg) && (
          <CardContent>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">MSP</Badge>
              <span className="text-sm font-medium">
                {getSelectedOrgNames().mspOrg?.name || 'Non sélectionné'}
              </span>
              <span className="text-muted-foreground">→</span>
              {watchedRelationType === 'via_esn' && (
                <>
                  <Badge variant="secondary">ESN</Badge>
                  <span className="text-muted-foreground">→</span>
                </>
              )}
              <Badge variant="outline">Client</Badge>
              <span className="text-sm font-medium">
                {getSelectedOrgNames().clientOrg?.name || 'Non sélectionné'}
              </span>
            </div>
          </CardContent>
        )}
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Type de relation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Type de relation</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="relation_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de relation</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez le type de relation" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="direct">
                          <div className="space-y-1">
                            <div className="font-medium">MSP → Client (Direct)</div>
                            <div className="text-sm text-muted-foreground">
                              Le MSP est le gestionnaire contractuel direct du client
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="via_esn">
                          <div className="space-y-1">
                            <div className="font-medium">MSP → ESN → Client (Via ESN)</div>
                            <div className="text-sm text-muted-foreground">
                              Le MSP intervient via une ESN gestionnaire du contrat client
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Organisations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Organisations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingOrgs ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Chargement des organisations...</p>
                </div>
              ) : (
                <>
                  {/* MSP */}
                  <FormField
                    control={form.control}
                    name="msp_organization_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organisation MSP</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez l'organisation MSP" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mspOrganizations.map((org) => (
                              <SelectItem key={org.id} value={org.id}>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">MSP</Badge>
                                  {org.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* ESN (si via ESN) */}
                  {watchedRelationType === 'via_esn' && (
                    <FormField
                      control={form.control}
                      name="esn_organization_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organisation ESN</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez l'organisation ESN" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {esnOrganizations.map((org) => (
                                <SelectItem key={org.id} value={org.id}>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">ESN</Badge>
                                    {org.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Client */}
                  <FormField
                    control={form.control}
                    name="client_organization_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organisation Cliente</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez l'organisation cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clientOrganizations.map((org) => (
                              <SelectItem key={org.id} value={org.id}>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">Client</Badge>
                                  {org.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Période de validité</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date de début */}
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de début</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: fr })
                            ) : (
                              <span>Sélectionnez une date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date de fin */}
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de fin (optionnelle)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: fr })
                            ) : (
                              <span>Aucune date de fin</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const startDate = form.getValues('start_date');
                            return date < startDate;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description (optionnelle)</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description de la relation</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Décrivez cette relation MSP-Client..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : relation ? 'Mettre à jour' : 'Créer la relation'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};