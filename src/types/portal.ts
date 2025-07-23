// Types pour la gestion des portails MSP vs Client

export type PortalType = 'msp_admin' | 'client_portal' | 'esn_portal';

export interface PortalConfig {
  type: PortalType;
  tenant_domain?: string;
  organization_id?: string;
  allowed_modules: string[];
  branding: {
    company_name: string;
    logo?: string;
    primary_color: string;
    accent_color?: string;
    favicon?: string;
  };
  ui_config: {
    show_msp_branding: boolean;
    show_organization_selector: boolean;
    show_team_selector: boolean;
    custom_header?: string;
    custom_footer?: string;
    theme: 'light' | 'dark' | 'auto';
  };
  features: {
    multi_tenant_access: boolean;
    cross_organization_view: boolean;
    admin_settings_access: boolean;
    cloud_management: boolean;
    user_management: boolean;
  };
}

export interface ModulePermission {
  module_id: string;
  module_name: string;
  access_level: 'none' | 'read' | 'write' | 'admin';
  visible: boolean;
  custom_config?: Record<string, any>;
}

export interface ClientPortalConfig {
  tenant_domain_id: string;
  organization_id: string;
  portal_name: string;
  portal_description?: string;
  allowed_modules: ModulePermission[];
  branding: PortalConfig['branding'];
  ui_config: PortalConfig['ui_config'];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Détection automatique du type de portail
export interface PortalDetection {
  portal_type: PortalType;
  is_msp_admin_portal: boolean;
  is_client_portal: boolean;
  tenant_info?: {
    domain_name: string;
    organization_id: string;
    organization_name: string;
  };
  user_access: {
    has_admin_access: boolean;
    can_switch_organizations: boolean;
    accessible_modules: string[];
  };
}

// Configuration par défaut des modules
export const DEFAULT_MSP_MODULES = [
  'dashboard', 'organizations', 'users', 'teams', 'roles', 'rbac',
  'business-services', 'applications', 'deployments', 'itsm', 'security', 
  'cloud', 'monitoring', 'tenant-management', 'settings'
];

export const DEFAULT_CLIENT_MODULES = [
  'dashboard', 'users', 'teams', 'business-services', 'applications', 
  'itsm', 'monitoring', 'profile', 'settings'
];

export const DEFAULT_ESN_MODULES = [
  'dashboard', 'users', 'teams', 'itsm', 'monitoring', 'applications'
]; 