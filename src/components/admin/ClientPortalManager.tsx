import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Globe, 
  Settings, 
  Eye, 
  Edit, 
  Plus,
  ExternalLink,
  Palette,
  Shield,
  Users,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { 
  ClientPortalConfig, 
  ModulePermission,
  DEFAULT_CLIENT_MODULES,
  DEFAULT_ESN_MODULES 
} from '@/types/portal';

interface TenantDomain {
  id: string;
  domain_name: string;
  full_url: string;
  organization_id: string;
  organization_name?: string;
  tenant_type: 'client' | 'esn';
  is_active: boolean;
  created_at: string;
}

const AVAILABLE_MODULES = [
  { id: 'dashboard', name: 'Tableau de bord', description: 'Vue d\'ensemble et métriques' },
  { id: 'users', name: 'Utilisateurs', description: 'Gestion des utilisateurs' },
  { id: 'teams', name: 'Équipes', description: 'Gestion des équipes' },
  { id: 'business-services', name: 'Services Métiers', description: 'Services business' },
  { id: 'applications', name: 'Applications', description: 'Gestion des applications' },
  { id: 'deployments', name: 'Déploiements', description: 'Déploiements d\'applications' },
  { id: 'itsm', name: 'ITSM', description: 'Tickets et incidents' },
  { id: 'security', name: 'Sécurité', description: 'Gestion de la sécurité' },
  { id: 'cloud', name: 'Cloud', description: 'Infrastructure cloud' },
  { id: 'monitoring', name: 'Monitoring', description: 'Supervision système' },
  { id: 'profile', name: 'Profil', description: 'Gestion du profil utilisateur' },
  { id: 'settings', name: 'Paramètres', description: 'Configuration du compte' }
];

export const ClientPortalManager: React.FC = () => {
  const { userProfile } = useAuth();
  const [tenantDomains, setTenantDomains] = useState<TenantDomain[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantDomain | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  
  // États pour la configuration du portail
  const [portalConfig, setPortalConfig] = useState<Partial<ClientPortalConfig>>({
    portal_name: '',
    portal_description: '',
    allowed_modules: [],
    branding: {
      company_name: '',
      primary_color: '#059669',
      accent_color: '#047857'
    },
    ui_config: {
      show_msp_branding: false,
      show_organization_selector: false,
      show_team_selector: true,
      theme: 'light'
    },
    is_active: true
  });

  // Charger la liste des domaines tenant
  const fetchTenantDomains = async () => {
    try {
      setLoading(true);
      
      // Récupérer les domaines avec les infos d'organisation
      const { data: domains, error } = await supabase
        .from('tenant_domains')
        .select(`
          id,
          domain_name,
          full_url,
          organization_id,
          tenant_type,
          is_active,
          created_at,
          organizations!inner(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedDomains = (domains || []).map(domain => ({
        ...domain,
        organization_name: (domain as any).organizations?.name
      }));

      setTenantDomains(formattedDomains);
    } catch (error: any) {
      console.error('Error fetching tenant domains:', error);
      toast.error('Erreur lors du chargement des domaines');
    } finally {
      setLoading(false);
    }
  };

  // Charger la configuration d'un portail spécifique
  const loadPortalConfig = async (tenantDomain: TenantDomain) => {
    try {
      // Récupérer la configuration existante depuis tenant_access_config
      const { data: accessConfig } = await supabase
        .from('tenant_access_config')
        .select('*')
        .eq('tenant_domain_id', tenantDomain.id)
        .eq('organization_id', tenantDomain.organization_id)
        .single();

      // Récupérer le branding depuis tenant_domains
      const { data: domainData } = await supabase
        .from('tenant_domains')
        .select('branding, ui_config')
        .eq('id', tenantDomain.id)
        .single();

      if (accessConfig && domainData) {
        setPortalConfig({
          tenant_domain_id: tenantDomain.id,
          organization_id: tenantDomain.organization_id,
          portal_name: tenantDomain.organization_name || tenantDomain.domain_name,
          portal_description: `Portail ${tenantDomain.tenant_type === 'esn' ? 'ESN' : 'client'} pour ${tenantDomain.organization_name}`,
          allowed_modules: accessConfig.allowed_modules?.map((moduleId: string) => ({
            module_id: moduleId,
            module_name: AVAILABLE_MODULES.find(m => m.id === moduleId)?.name || moduleId,
            access_level: 'write' as const,
            visible: true
          })) || [],
          branding: domainData.branding || {
            company_name: tenantDomain.organization_name || '',
            primary_color: '#059669',
            accent_color: '#047857'
          },
          ui_config: domainData.ui_config || {
            show_msp_branding: false,
            show_organization_selector: false,
            show_team_selector: true,
            theme: 'light'
          },
          is_active: tenantDomain.is_active,
          created_by: userProfile?.id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } else {
        // Configuration par défaut
        const defaultModules = tenantDomain.tenant_type === 'esn' 
          ? ['dashboard', 'users', 'teams', 'itsm', 'monitoring', 'applications']
          : ['dashboard', 'users', 'teams', 'business-services', 'applications', 'itsm', 'monitoring', 'profile', 'settings'];

        setPortalConfig({
          tenant_domain_id: tenantDomain.id,
          organization_id: tenantDomain.organization_id,
          portal_name: tenantDomain.organization_name || tenantDomain.domain_name,
          portal_description: `Portail ${tenantDomain.tenant_type === 'esn' ? 'ESN' : 'client'} pour ${tenantDomain.organization_name}`,
          allowed_modules: defaultModules.map(moduleId => ({
            module_id: moduleId,
            module_name: AVAILABLE_MODULES.find(m => m.id === moduleId)?.name || moduleId,
            access_level: 'write' as const,
            visible: true
          })),
          branding: {
            company_name: tenantDomain.organization_name || '',
            primary_color: '#059669',
            accent_color: '#047857'
          },
          ui_config: {
            show_msp_branding: false,
            show_organization_selector: false,
            show_team_selector: true,
            theme: 'light'
          },
          is_active: true,
          created_by: userProfile?.id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (error: any) {
      console.error('Error loading portal config:', error);
      toast.error('Erreur lors du chargement de la configuration');
    }
  };

  // Sauvegarder la configuration du portail
  const savePortalConfig = async () => {
    if (!selectedTenant || !portalConfig.tenant_domain_id) return;

    try {
      // Mettre à jour le branding dans tenant_domains
      const { error: brandingError } = await supabase
        .from('tenant_domains')
        .update({
          branding: portalConfig.branding,
          ui_config: portalConfig.ui_config
        })
        .eq('id', selectedTenant.id);

      if (brandingError) throw brandingError;

      // Mettre à jour ou créer la configuration d'accès
      const accessConfigData = {
        tenant_domain_id: selectedTenant.id,
        organization_id: selectedTenant.organization_id,
        access_type: 'limited',
        allowed_modules: portalConfig.allowed_modules?.map(m => m.module_id) || [],
        access_restrictions: {},
        is_active: portalConfig.is_active
      };

      const { error: accessError } = await supabase
        .from('tenant_access_config')
        .upsert(accessConfigData);

      if (accessError) throw accessError;

      toast.success('Configuration du portail sauvegardée');
      setIsConfigDialogOpen(false);
      await fetchTenantDomains();
    } catch (error: any) {
      console.error('Error saving portal config:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  // Basculer la visibilité d'un module
  const toggleModule = (moduleId: string) => {
    setPortalConfig(prev => ({
      ...prev,
      allowed_modules: prev.allowed_modules?.some(m => m.module_id === moduleId)
        ? prev.allowed_modules.filter(m => m.module_id !== moduleId)
        : [
            ...(prev.allowed_modules || []),
            {
              module_id: moduleId,
              module_name: AVAILABLE_MODULES.find(m => m.id === moduleId)?.name || moduleId,
              access_level: 'write' as const,
              visible: true
            }
          ]
    }));
  };

  // Ouvrir la configuration d'un tenant
  const openConfig = async (tenant: TenantDomain) => {
    setSelectedTenant(tenant);
    await loadPortalConfig(tenant);
    setIsConfigDialogOpen(true);
  };

  useEffect(() => {
    if (userProfile?.is_msp_admin) {
      fetchTenantDomains();
    }
  }, [userProfile]);

  if (!userProfile?.is_msp_admin) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Accès réservé aux administrateurs MSP
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Gestion des Portails Client
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domaine</TableHead>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenantDomains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell className="font-medium">
                      {domain.domain_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {domain.organization_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={domain.tenant_type === 'esn' ? 'default' : 'secondary'}>
                        {domain.tenant_type === 'esn' ? 'ESN' : 'Client'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <a 
                        href={domain.full_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        {domain.full_url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant={domain.is_active ? 'default' : 'secondary'}>
                        {domain.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openConfig(domain)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {tenantDomains.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun domaine tenant configuré</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de configuration */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration du portail : {selectedTenant?.domain_name}
            </DialogTitle>
            <DialogDescription>
              Configurez les modules, le branding et les paramètres d'interface pour ce portail client
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="modules" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="modules">Modules</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="interface">Interface</TabsTrigger>
            </TabsList>

            <TabsContent value="modules" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Modules autorisés</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {AVAILABLE_MODULES.map((module) => (
                      <div key={module.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Switch
                          checked={portalConfig.allowed_modules?.some(m => m.module_id === module.id) || false}
                          onCheckedChange={() => toggleModule(module.id)}
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{module.name}</h4>
                          <p className="text-sm text-muted-foreground">{module.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="branding" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Personnalisation de la marque
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Nom de l'entreprise</Label>
                      <Input
                        id="company_name"
                        value={portalConfig.branding?.company_name || ''}
                        onChange={(e) => setPortalConfig(prev => ({
                          ...prev,
                          branding: {
                            ...prev.branding!,
                            company_name: e.target.value
                          }
                        }))}
                        placeholder="Nom affiché dans le portail"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logo_url">URL du logo</Label>
                      <Input
                        id="logo_url"
                        value={portalConfig.branding?.logo || ''}
                        onChange={(e) => setPortalConfig(prev => ({
                          ...prev,
                          branding: {
                            ...prev.branding!,
                            logo: e.target.value
                          }
                        }))}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary_color">Couleur principale</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="primary_color"
                          type="color"
                          value={portalConfig.branding?.primary_color || '#059669'}
                          onChange={(e) => setPortalConfig(prev => ({
                            ...prev,
                            branding: {
                              ...prev.branding!,
                              primary_color: e.target.value
                            }
                          }))}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={portalConfig.branding?.primary_color || '#059669'}
                          onChange={(e) => setPortalConfig(prev => ({
                            ...prev,
                            branding: {
                              ...prev.branding!,
                              primary_color: e.target.value
                            }
                          }))}
                          placeholder="#059669"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accent_color">Couleur d'accent</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="accent_color"
                          type="color"
                          value={portalConfig.branding?.accent_color || '#047857'}
                          onChange={(e) => setPortalConfig(prev => ({
                            ...prev,
                            branding: {
                              ...prev.branding!,
                              accent_color: e.target.value
                            }
                          }))}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={portalConfig.branding?.accent_color || '#047857'}
                          onChange={(e) => setPortalConfig(prev => ({
                            ...prev,
                            branding: {
                              ...prev.branding!,
                              accent_color: e.target.value
                            }
                          }))}
                          placeholder="#047857"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interface" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Paramètres d'interface</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Affichage du branding MSP</h4>
                        <p className="text-sm text-muted-foreground">
                          Afficher les informations MSP dans le portail client
                        </p>
                      </div>
                      <Switch
                        checked={portalConfig.ui_config?.show_msp_branding || false}
                        onCheckedChange={(checked) => setPortalConfig(prev => ({
                          ...prev,
                          ui_config: {
                            ...prev.ui_config!,
                            show_msp_branding: checked
                          }
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Sélecteur d'équipe</h4>
                        <p className="text-sm text-muted-foreground">
                          Permettre aux utilisateurs de changer d'équipe
                        </p>
                      </div>
                      <Switch
                        checked={portalConfig.ui_config?.show_team_selector || true}
                        onCheckedChange={(checked) => setPortalConfig(prev => ({
                          ...prev,
                          ui_config: {
                            ...prev.ui_config!,
                            show_team_selector: checked
                          }
                        }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={savePortalConfig}>
              Sauvegarder la configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 