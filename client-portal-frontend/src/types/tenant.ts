// Types pour le système multi-tenant

export interface TenantDomain {
  id: string;
  domain_name: string;
  full_url: string;
  organization_id: string;
  tenant_type: 'esn' | 'client' | 'msp';
  is_active: boolean;
  branding: TenantBranding;
  ui_config: TenantUIConfig;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface TenantBranding {
  logo?: string;
  company_name?: string;
  favicon?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  custom_css?: string;
  [key: string]: any;
}

export interface TenantUIConfig {
  primary_color?: string;
  secondary_color?: string;
  sidebar_style?: 'classic' | 'modern' | 'minimal';
  theme?: 'light' | 'dark' | 'auto';
  logo_position?: 'left' | 'center' | 'right';
  show_organization_switcher?: boolean;
  custom_navigation?: any;
  [key: string]: any;
}

export interface TenantAccessConfig {
  id: string;
  tenant_domain_id: string;
  organization_id: string;
  access_type: 'full' | 'limited' | 'readonly';
  allowed_modules: string[];
  access_restrictions: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantResolution {
  tenant_id: string;
  organization_id: string;
  tenant_type: 'esn' | 'client' | 'msp';
  domain_name: string;
  full_url: string;
  branding: TenantBranding;
  ui_config: TenantUIConfig;
  allowed_organizations: string[];
  access_config?: TenantAccessConfig;
}

export interface TenantContext {
  currentTenant: TenantResolution | null;
  tenantDomains: TenantDomain[];
  loading: boolean;
  error: string | null;
  resolveTenant: (domain: string) => Promise<TenantResolution | null>;
  updateTenantConfig: (tenantId: string, config: Partial<TenantDomain>) => Promise<void>;
  createTenantDomain: (domain: Omit<TenantDomain, 'id' | 'created_at' | 'updated_at'>) => Promise<TenantDomain>;
  deleteTenantDomain: (tenantId: string) => Promise<void>;
}

export interface TenantFormData {
  domain_name: string;
  full_url: string;
  organization_id: string;
  tenant_type: 'esn' | 'client' | 'msp';
  branding: TenantBranding;
  ui_config: TenantUIConfig;
  metadata?: Record<string, any>;
}

// Types pour l'interface d'administration
export interface TenantManagementFilters {
  tenant_type?: 'esn' | 'client' | 'msp' | 'all';
  organization_id?: string;
  is_active?: boolean;
  search?: string;
}

export interface TenantDomainWithOrganization extends TenantDomain {
  organization?: {
    id: string;
    name: string;
    type: string;
  };
} 