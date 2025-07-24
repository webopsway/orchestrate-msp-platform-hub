import { supabase } from "@/integrations/supabase/client";
import type { 
  TenantDomain, 
  TenantResolution, 
  TenantFormData, 
  TenantAccessConfig,
  TenantDomainWithOrganization,
  TenantManagementFilters 
} from "@/types/tenant";

export class TenantService {
  /**
   * Résout le tenant basé sur le domaine actuel
   */
  static async resolveTenantByDomain(domain: string): Promise<TenantResolution | null> {
    try {
      const { data, error } = await supabase.rpc('resolve_tenant_by_domain', {
        p_domain_name: domain
      });

      if (error) {
        console.error('Error resolving tenant:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const tenantData = data[0] as TenantResolution;

      // Enrichir avec les relations MSP-Client-ESN
      const enrichedTenant = await this.enrichTenantWithRelations(tenantData);
      
      return enrichedTenant;
    } catch (error) {
      console.error('Error in resolveTenantByDomain:', error);
      return null;
    }
  }

  /**
   * Enrichit les données tenant avec les relations MSP-Client-ESN
   */
  static async enrichTenantWithRelations(tenant: TenantResolution): Promise<TenantResolution> {
    try {
      // Récupérer les informations de l'organisation
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id, name, type, is_msp')
        .eq('id', tenant.organization_id)
        .single();

      if (!orgData) return tenant;

      // Si c'est un client, récupérer les relations MSP/ESN
      if (orgData.type === 'client') {
        const { data: relationData } = await supabase
          .from('msp_client_relations')
          .select(`
            relation_type,
            msp_organization_id,
            esn_organization_id,
            msp_organization:organizations!msp_organization_id(id, name),
            esn_organization:organizations!esn_organization_id(id, name)
          `)
          .eq('client_organization_id', tenant.organization_id)
          .eq('is_active', true)
          .maybeSingle();

        if (relationData) {
          // Ajouter les organisations autorisées selon la relation
          const allowedOrgs = [tenant.organization_id]; // Le client lui-même
          
          if (relationData.msp_organization_id) {
            allowedOrgs.push(relationData.msp_organization_id);
          }
          
          if (relationData.esn_organization_id) {
            allowedOrgs.push(relationData.esn_organization_id);
          }

          return {
            ...tenant,
            allowed_organizations: allowedOrgs,
            metadata: {
              ...tenant.metadata,
              relation_type: relationData.relation_type,
              msp_organization: relationData.msp_organization,
              esn_organization: relationData.esn_organization
            }
          };
        }
      }

      // Si c'est une ESN, récupérer tous ses clients
      if (orgData.type === 'esn') {
        const { data: clientRelations } = await supabase
          .from('msp_client_relations')
          .select(`
            client_organization_id,
            client_organization:organizations!client_organization_id(id, name)
          `)
          .eq('esn_organization_id', tenant.organization_id)
          .eq('is_active', true);

        if (clientRelations) {
          const allowedOrgs = [tenant.organization_id]; // L'ESN elle-même
          
          // Ajouter tous les clients de l'ESN
          clientRelations.forEach(rel => {
            allowedOrgs.push(rel.client_organization_id);
          });

          return {
            ...tenant,
            allowed_organizations: allowedOrgs,
            metadata: {
              ...tenant.metadata,
              clients: clientRelations.map(rel => rel.client_organization)
            }
          };
        }
      }

      return tenant;
    } catch (error) {
      console.error('Error enriching tenant with relations:', error);
      return tenant;
    }
  }

  /**
   * Résout le tenant basé sur l'URL courante du navigateur
   */
  static async resolveTenantFromCurrentURL(): Promise<TenantResolution | null> {
    try {
      const hostname = window.location.hostname;
      const subdomain = hostname.split('.')[0];
      
      // Essayer d'abord avec le hostname complet
      let tenant = await this.resolveTenantByDomain(hostname);
      
      // Si pas trouvé, essayer avec le sous-domaine
      if (!tenant && subdomain !== hostname) {
        tenant = await this.resolveTenantByDomain(subdomain);
      }
      
      return tenant;
    } catch (error) {
      console.error('Error resolving tenant from URL:', error);
      return null;
    }
  }

  /**
   * Charge tous les domaines tenant (admin MSP uniquement)
   */
  static async loadAll(filters?: TenantManagementFilters): Promise<{ tenantDomains: TenantDomainWithOrganization[]; count: number }> {
    let query = supabase
      .from('tenant_domains')
      .select(`
        *,
        organization:organizations(id, name, type)
      `, { count: 'exact' });

    // Appliquer les filtres
    if (filters?.tenant_type && filters.tenant_type !== 'all') {
      query = query.eq('tenant_type', filters.tenant_type);
    }
    
    if (filters?.organization_id) {
      query = query.eq('organization_id', filters.organization_id);
    }
    
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    
    if (filters?.search) {
      query = query.or(`domain_name.ilike.%${filters.search}%,full_url.ilike.%${filters.search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Error loading tenant domains:', error);
      throw error;
    }

    return { 
      tenantDomains: data as TenantDomainWithOrganization[], 
      count: count || 0 
    };
  }

  /**
   * Crée un nouveau domaine tenant avec configuration automatique des accès
   */
  static async create(formData: TenantFormData): Promise<TenantDomain> {
    const { data, error } = await supabase
      .from('tenant_domains')
      .insert({
        domain_name: formData.domain_name,
        full_url: formData.full_url,
        organization_id: formData.organization_id,
        tenant_type: formData.tenant_type,
        branding: formData.branding,
        ui_config: formData.ui_config,
        metadata: formData.metadata || {},
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating tenant domain:', error);
      throw error;
    }

    const newDomain = data as TenantDomain;

    // Configuration automatique des accès selon le type
    await this.configureAutoAccess(newDomain);

    return newDomain;
  }

  /**
   * Configure automatiquement les accès selon les relations MSP-Client-ESN
   */
  static async configureAutoAccess(tenantDomain: TenantDomain): Promise<void> {
    try {
      const accessConfigs = [];

      // L'organisation propriétaire a toujours accès
      accessConfigs.push({
        tenant_domain_id: tenantDomain.id,
        organization_id: tenantDomain.organization_id,
        access_type: 'full',
        allowed_modules: ['*'], // Tous les modules
        access_restrictions: {},
        is_active: true
      });

      // Si c'est un client, donner accès au MSP et à l'ESN si applicable
      if (tenantDomain.tenant_type === 'client') {
        const { data: relation } = await supabase
          .from('msp_client_relations')
          .select('msp_organization_id, esn_organization_id, relation_type')
          .eq('client_organization_id', tenantDomain.organization_id)
          .eq('is_active', true)
          .maybeSingle();

        if (relation) {
          // Accès MSP (services techniques)
          accessConfigs.push({
            tenant_domain_id: tenantDomain.id,
            organization_id: relation.msp_organization_id,
            access_type: 'full',
            allowed_modules: ['itsm', 'cloud', 'monitoring', 'security'],
            access_restrictions: {},
            is_active: true
          });

          // Accès ESN si relation via ESN
          if (relation.esn_organization_id) {
            accessConfigs.push({
              tenant_domain_id: tenantDomain.id,
              organization_id: relation.esn_organization_id,
              access_type: 'limited',
              allowed_modules: ['itsm', 'monitoring', 'users', 'teams'],
              access_restrictions: { can_modify_infrastructure: false },
              is_active: true
            });
          }
        }
      }

      // Si c'est une ESN, donner accès au MSP
      if (tenantDomain.tenant_type === 'esn') {
        // Trouver le MSP associé (on prend le premier MSP trouvé dans les relations)
        const { data: mspRelation } = await supabase
          .from('msp_client_relations')
          .select('msp_organization_id')
          .eq('esn_organization_id', tenantDomain.organization_id)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (mspRelation) {
          accessConfigs.push({
            tenant_domain_id: tenantDomain.id,
            organization_id: mspRelation.msp_organization_id,
            access_type: 'full',
            allowed_modules: ['*'],
            access_restrictions: {},
            is_active: true
          });
        }
      }

      // Insérer toutes les configurations d'accès
      if (accessConfigs.length > 0) {
        await supabase
          .from('tenant_access_config')
          .insert(accessConfigs);
      }
    } catch (error) {
      console.error('Error configuring auto access:', error);
      // Ne pas faire échouer la création du tenant pour ça
    }
  }

  /**
   * Met à jour un domaine tenant
   */
  static async update(tenantId: string, updates: Partial<TenantDomain>): Promise<TenantDomain> {
    const { data, error } = await supabase
      .from('tenant_domains')
      .update({
        domain_name: updates.domain_name,
        full_url: updates.full_url,
        organization_id: updates.organization_id,
        tenant_type: updates.tenant_type,
        is_active: updates.is_active,
        branding: updates.branding,
        ui_config: updates.ui_config,
        metadata: updates.metadata
      })
      .eq('id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating tenant domain:', error);
      throw error;
    }

    return data as TenantDomain;
  }

  /**
   * Supprime un domaine tenant
   */
  static async delete(tenantId: string): Promise<void> {
    const { error } = await supabase
      .from('tenant_domains')
      .delete()
      .eq('id', tenantId);

    if (error) {
      console.error('Error deleting tenant domain:', error);
      throw error;
    }
  }

  /**
   * Active/désactive un domaine tenant
   */
  static async toggleActive(tenantId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('tenant_domains')
      .update({ is_active: isActive })
      .eq('id', tenantId);

    if (error) {
      console.error('Error toggling tenant domain:', error);
      throw error;
    }
  }

  /**
   * Récupère la configuration d'accès pour une organisation sur un tenant
   */
  static async getTenantAccessConfig(tenantDomainId: string, organizationId: string): Promise<TenantAccessConfig | null> {
    const { data, error } = await supabase.rpc('get_tenant_access_config', {
      p_tenant_domain_id: tenantDomainId,
      p_organization_id: organizationId
    });

    if (error) {
      console.error('Error getting tenant access config:', error);
      return null;
    }

    return data?.[0] as TenantAccessConfig || null;
  }

  /**
   * Configure l'accès d'une organisation à un tenant
   */
  static async configureTenantAccess(config: Omit<TenantAccessConfig, 'id' | 'created_at' | 'updated_at'>): Promise<TenantAccessConfig> {
    const { data, error } = await supabase
      .from('tenant_access_config')
      .upsert({
        tenant_domain_id: config.tenant_domain_id,
        organization_id: config.organization_id,
        access_type: config.access_type,
        allowed_modules: config.allowed_modules,
        access_restrictions: config.access_restrictions,
        is_active: config.is_active
      })
      .select()
      .single();

    if (error) {
      console.error('Error configuring tenant access:', error);
      throw error;
    }

    return data as TenantAccessConfig;
  }

  /**
   * Valide si un nom de domaine est disponible
   */
  static async validateDomainAvailability(domainName: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('tenant_domains')
      .select('id')
      .or(`domain_name.eq.${domainName},full_url.eq.${domainName}`);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error validating domain:', error);
      return false;
    }

    return data.length === 0;
  }

  /**
   * Génère une URL de preview pour un tenant
   */
  static generatePreviewURL(domainName: string, baseDomain: string = window.location.host): Promise<string> {
    // Si c'est un domaine complet, l'utiliser tel quel
    if (domainName.includes('.')) {
      return Promise.resolve(`https://${domainName}`);
    }
    
    // Sinon, créer un sous-domaine
    const [subdomain, ...rest] = baseDomain.split('.');
    const rootDomain = rest.join('.');
    return Promise.resolve(`https://${domainName}.${rootDomain}`);
  }

  /**
   * Applique la configuration UI d'un tenant
   */
  static applyTenantUIConfig(uiConfig: any): void {
    if (!uiConfig) return;

    const root = document.documentElement;

    // Appliquer les couleurs personnalisées
    if (uiConfig.primary_color) {
      root.style.setProperty('--tenant-primary', uiConfig.primary_color);
    }
    
    if (uiConfig.secondary_color) {
      root.style.setProperty('--tenant-secondary', uiConfig.secondary_color);
    }

    // Appliquer le CSS personnalisé si présent
    if (uiConfig.custom_css) {
      const styleId = 'tenant-custom-styles';
      let styleElement = document.getElementById(styleId);
      
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      
      styleElement.textContent = uiConfig.custom_css;
    }
  }

  /**
   * Obtient les statistiques d'utilisation d'un tenant
   */
  static async getTenantStats(tenantId: string): Promise<any> {
    try {
      // Récupérer les organisations ayant accès à ce tenant
      const { data: accessConfigs } = await supabase
        .from('tenant_access_config')
        .select(`
          organization_id,
          access_type,
          organization:organizations(name, type)
        `)
        .eq('tenant_domain_id', tenantId)
        .eq('is_active', true);

      return {
        total_organizations: accessConfigs?.length || 0,
        organizations_by_type: accessConfigs?.reduce((acc: any, config: any) => {
          const type = config.organization?.type || 'unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {}),
        access_levels: accessConfigs?.reduce((acc: any, config: any) => {
          acc[config.access_type] = (acc[config.access_type] || 0) + 1;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting tenant stats:', error);
      return null;
    }
  }
} 