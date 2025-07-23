import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, ExternalLink, Edit, Trash2, Eye, EyeOff, Globe, Building2 } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/common';
import { DataGrid } from '@/components/common/DataGrid';
import { RBACGuard } from '@/components/rbac/RBACGuard';
import { useTenant } from '@/contexts/TenantContext';
import { useOrganizationsAndTeams } from '@/hooks/useOrganizationsAndTeams';
import { TenantService } from '@/services/tenantService';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import type { TenantDomainWithOrganization, TenantFormData, TenantManagementFilters } from '@/types/tenant';

// Schéma de validation pour le formulaire
const tenantFormSchema = z.object({
  domain_name: z.string().min(2, 'Le nom de domaine doit contenir au moins 2 caractères'),
  full_url: z.string().url('URL invalide').optional(),
  organization_id: z.string().min(1, 'Veuillez sélectionner une organisation'),
  tenant_type: z.enum(['esn', 'client', 'msp']),
  branding: z.object({
    company_name: z.string().optional(),
    logo: z.string().optional(),
    primary_color: z.string().optional(),
    secondary_color: z.string().optional(),
    custom_css: z.string().optional(),
  }).optional(),
  ui_config: z.object({
    primary_color: z.string().optional(),
    secondary_color: z.string().optional(),
    sidebar_style: z.enum(['classic', 'modern', 'minimal']).optional(),
    theme: z.enum(['light', 'dark', 'auto']).optional(),
    show_organization_switcher: z.boolean().optional(),
  }).optional(),
});

type TenantFormValues = z.infer<typeof tenantFormSchema>;

export default function TenantManagement() {
  const { tenantDomains, createTenantDomain, updateTenantConfig, deleteTenantDomain } = useTenant();
  const { data: orgData } = useOrganizationsAndTeams();
  
  const [selectedTenant, setSelectedTenant] = useState<TenantDomainWithOrganization | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filters, setFilters] = useState<TenantManagementFilters>({});
  const [loading, setLoading] = useState(false);

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      tenant_type: 'client',
      branding: {},
      ui_config: {
        sidebar_style: 'modern',
        theme: 'auto',
        show_organization_switcher: true,
      },
    },
  });

  // Charger les données initiales
  useEffect(() => {
    if (selectedTenant) {
      form.reset({
        domain_name: selectedTenant.domain_name,
        full_url: selectedTenant.full_url,
        organization_id: selectedTenant.organization_id,
        tenant_type: selectedTenant.tenant_type,
        branding: selectedTenant.branding || {},
        ui_config: selectedTenant.ui_config || {
          sidebar_style: 'modern',
          theme: 'auto',
          show_organization_switcher: true,
        },
      });
    }
  }, [selectedTenant, form]);

  const handleCreateTenant = async (data: TenantFormValues) => {
    try {
      setLoading(true);
      
      // Générer l'URL complète si pas fournie
      const fullUrl = data.full_url || `${data.domain_name}.${window.location.host}`;
      
      const tenantData: TenantFormData = {
        domain_name: data.domain_name,
        full_url: fullUrl,
        organization_id: data.organization_id,
        tenant_type: data.tenant_type,
        branding: data.branding || {},
        ui_config: data.ui_config || {},
      };

      await createTenantDomain(tenantData);
      toast.success('Domaine tenant créé avec succès !');
      setIsCreateModalOpen(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTenant = async (data: TenantFormValues) => {
    if (!selectedTenant) return;

    try {
      setLoading(true);
      
      const fullUrl = data.full_url || `${data.domain_name}.${window.location.host}`;
      
      await updateTenantConfig(selectedTenant.id, {
        ...selectedTenant,
        domain_name: data.domain_name,
        full_url: fullUrl,
        organization_id: data.organization_id,
        tenant_type: data.tenant_type,
        branding: data.branding || {},
        ui_config: data.ui_config || {},
      });
      
      toast.success('Configuration mise à jour avec succès !');
      setIsEditModalOpen(false);
      setSelectedTenant(null);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce domaine tenant ?')) return;

    try {
      await deleteTenantDomain(tenantId);
      toast.success('Domaine tenant supprimé');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const handleToggleActive = async (tenant: TenantDomainWithOrganization) => {
    try {
      await TenantService.toggleActive(tenant.id, !tenant.is_active);
      toast.success(`Domaine ${tenant.is_active ? 'désactivé' : 'activé'}`);
    } catch (error: any) {
      toast.error('Erreur lors de la modification du statut');
    }
  };

  const generatePreviewURL = (domain: string) => {
    return domain.includes('.') ? `https://${domain}` : `https://${domain}.${window.location.host}`;
  };

  const columns = [
    {
      key: 'domain_name',
      label: 'Nom de domaine',
      render: (tenant: TenantDomainWithOrganization) => (
        <div className="flex items-center space-x-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{tenant.domain_name}</div>
            <div className="text-sm text-muted-foreground">{tenant.full_url}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'organization',
      label: 'Organisation',
      render: (tenant: TenantDomainWithOrganization) => (
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{tenant.organization?.name}</div>
            <Badge variant="outline" className="text-xs">
              {tenant.tenant_type.toUpperCase()}
            </Badge>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      render: (tenant: TenantDomainWithOrganization) => (
        <Badge variant={tenant.is_active ? 'default' : 'secondary'}>
          {tenant.is_active ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Créé le',
      render: (tenant: TenantDomainWithOrganization) => 
        new Date(tenant.created_at).toLocaleDateString('fr-FR'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (tenant: TenantDomainWithOrganization) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(generatePreviewURL(tenant.full_url), '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleActive(tenant)}
          >
            {tenant.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedTenant(tenant);
              setIsEditModalOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteTenant(tenant.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const TenantForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(isEdit ? handleUpdateTenant : handleCreateTenant)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Configuration de base</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="ui">Interface</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <FormField
              control={form.control}
              name="domain_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de domaine</FormLabel>
                  <FormControl>
                    <Input placeholder="acme-corp" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nom court utilisé pour identifier le tenant (ex: acme-corp, esn-alpha)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="full_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL complète (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="acme-corp.platform.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Si non fournie, sera générée automatiquement comme {form.watch('domain_name')}.{window.location.host}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organization_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organisation</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une organisation" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {orgData?.organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name} ({org.is_msp ? 'MSP' : 'Client'})
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
              name="tenant_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de tenant</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="esn">ESN</SelectItem>
                      <SelectItem value="msp">MSP</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="branding" className="space-y-4">
            <FormField
              control={form.control}
              name="branding.company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de l'entreprise</FormLabel>
                  <FormControl>
                    <Input placeholder="ACME Corporation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="branding.logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL du logo</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/logo.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="branding.primary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Couleur primaire</FormLabel>
                    <FormControl>
                      <Input type="color" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="branding.secondary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Couleur secondaire</FormLabel>
                    <FormControl>
                      <Input type="color" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="branding.custom_css"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CSS personnalisé</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="/* CSS personnalisé */"
                      className="font-mono text-sm"
                      rows={5}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="ui" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ui_config.primary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Couleur primaire UI</FormLabel>
                    <FormControl>
                      <Input type="color" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ui_config.secondary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Couleur secondaire UI</FormLabel>
                    <FormControl>
                      <Input type="color" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="ui_config.sidebar_style"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Style de sidebar</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="classic">Classique</SelectItem>
                      <SelectItem value="modern">Moderne</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ui_config.theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thème par défaut</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="light">Clair</SelectItem>
                      <SelectItem value="dark">Sombre</SelectItem>
                      <SelectItem value="auto">Automatique</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ui_config.show_organization_switcher"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Sélecteur d'organisation</FormLabel>
                    <FormDescription>
                      Permettre aux utilisateurs de changer d'organisation
                    </FormDescription>
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
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              setIsCreateModalOpen(false);
              setIsEditModalOpen(false);
              setSelectedTenant(null);
              form.reset();
            }}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Traitement...' : (isEdit ? 'Mettre à jour' : 'Créer')}
          </Button>
        </div>
      </form>
    </Form>
  );

  return (
    <RBACGuard resource="settings" action="view">
      <div className="space-y-6">
        <PageHeader
          title="Gestion des domaines tenant"
          description="Configurez les URL personnalisées pour vos ESN et clients"
        />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Domaines configurés</CardTitle>
                <CardDescription>
                  Gérez les URL personnalisées pour permettre l'accès par domaine spécifique
                </CardDescription>
              </div>
              
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau domaine
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Créer un nouveau domaine tenant</DialogTitle>
                    <DialogDescription>
                      Configurez une URL personnalisée pour permettre l'accès à la plateforme
                    </DialogDescription>
                  </DialogHeader>
                  <TenantForm />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          
          <CardContent>
            <DataGrid
              data={tenantDomains}
              columns={columns}
              searchable
              filterable
            />
          </CardContent>
        </Card>

        {/* Modal d'édition */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier le domaine tenant</DialogTitle>
              <DialogDescription>
                Modifiez la configuration du domaine {selectedTenant?.domain_name}
              </DialogDescription>
            </DialogHeader>
            <TenantForm isEdit />
          </DialogContent>
        </Dialog>
      </div>
    </RBACGuard>
  );
} 