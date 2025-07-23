import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useTenant } from './TenantContext';
import { useOrganizationContext } from './OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import type { 
  PortalType, 
  PortalConfig, 
  PortalDetection, 
  ClientPortalConfig,
  DEFAULT_MSP_MODULES,
  DEFAULT_CLIENT_MODULES,
  DEFAULT_ESN_MODULES
} from '@/types/portal';

interface PortalContextType {
  portalConfig: PortalConfig | null;
  portalDetection: PortalDetection | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  switchToMSPPortal: () => void;
  refreshPortalConfig: () => Promise<void>;
  
  // Utilitaires
  canAccessModule: (moduleId: string) => boolean;
  getModulePermission: (moduleId: string) => 'none' | 'read' | 'write' | 'admin';
  isMSPAdminPortal: () => boolean;
  isClientPortal: () => boolean;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

interface PortalProviderProps {
  children: ReactNode;
}

export const PortalProvider: React.FC<PortalProviderProps> = ({ children }) => {
  const { user, userProfile } = useAuth();
  const { currentTenant } = useTenant();
  const { currentOrganization } = useOrganizationContext();
  
  const [portalConfig, setPortalConfig] = useState<PortalConfig | null>(null);
  const [portalDetection, setPortalDetection] = useState<PortalDetection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Détecter automatiquement le type de portail
  const detectPortalType = React.useCallback(async (): Promise<PortalDetection> => {
    try {
      const hostname = window.location.hostname;
      
      // 1. Vérifier si c'est un domaine MSP admin (pas de tenant)
      const isMSPDomain = !currentTenant || 
                          hostname.includes('admin.') || 
                          hostname.includes('msp.') ||
                          userProfile?.is_msp_admin;

      if (isMSPDomain && userProfile?.is_msp_admin) {
        return {
          portal_type: 'msp_admin',
          is_msp_admin_portal: true,
          is_client_portal: false,
          user_access: {
            has_admin_access: true,
            can_switch_organizations: true,
            accessible_modules: ['dashboard', 'organizations', 'users', 'teams', 'roles', 'rbac',
              'business-services', 'applications', 'deployments', 'itsm', 'security', 
              'cloud', 'monitoring', 'tenant-management', 'settings']
          }
        };
      }

      // 2. Vérifier si c'est un portail client via tenant
      if (currentTenant) {
        const portalType: PortalType = currentTenant.tenant_type === 'esn' ? 'esn_portal' : 'client_portal';
        
        // Utiliser la configuration d'accès du tenant ou les valeurs par défaut
        const allowedModules = currentTenant.access_config?.allowed_modules || 
          (portalType === 'esn_portal' ? 
            ['dashboard', 'users', 'teams', 'itsm', 'monitoring', 'applications'] :
            ['dashboard', 'users', 'teams', 'business-services', 'applications', 'itsm', 'monitoring', 'profile', 'settings']
          );

        return {
          portal_type: portalType,
          is_msp_admin_portal: false,
          is_client_portal: true,
          tenant_info: {
            domain_name: currentTenant.domain_name,
            organization_id: currentTenant.organization_id,
            organization_name: currentOrganization?.name || 'Organisation'
          },
          user_access: {
            has_admin_access: false,
            can_switch_organizations: false,
            accessible_modules: allowedModules
          }
        };
      }

      // 3. Fallback - utilisateur non-admin sur domaine principal
      return {
        portal_type: 'client_portal',
        is_msp_admin_portal: false,
        is_client_portal: true,
        user_access: {
          has_admin_access: false,
          can_switch_organizations: false,
          accessible_modules: ['dashboard', 'users', 'teams', 'itsm', 'monitoring', 'profile']
        }
      };

    } catch (err: any) {
      console.error('Error detecting portal type:', err);
      throw new Error('Impossible de détecter le type de portail');
    }
  }, [currentTenant, userProfile, currentOrganization]);

  // Charger la configuration du portail
  const loadPortalConfig = React.useCallback(async (detection: PortalDetection): Promise<PortalConfig> => {
    try {
      if (detection.portal_type === 'msp_admin') {
        // Configuration MSP Admin
        return {
          type: 'msp_admin',
          allowed_modules: detection.user_access.accessible_modules,
          branding: {
            company_name: 'Administration MSP',
            primary_color: '#3b82f6',
            accent_color: '#1e40af'
          },
          ui_config: {
            show_msp_branding: true,
            show_organization_selector: true,
            show_team_selector: true,
            theme: 'light'
          },
          features: {
            multi_tenant_access: true,
            cross_organization_view: true,
            admin_settings_access: true,
            cloud_management: true,
            user_management: true
          }
        };
      } else {
        // Configuration Client/ESN
        let branding = {
          company_name: detection.tenant_info?.organization_name || 'Portail Client',
          primary_color: '#059669',
          accent_color: '#047857'
        };

        // Récupérer le branding personnalisé si disponible
        if (currentTenant?.branding) {
          branding = {
            ...branding,
            company_name: currentTenant.branding.company_name || branding.company_name,
            primary_color: currentTenant.branding.primary_color || branding.primary_color,
            accent_color: currentTenant.branding.accent_color || branding.accent_color,
            ...(currentTenant.branding.logo && { logo: currentTenant.branding.logo }),
            ...(currentTenant.branding.favicon && { favicon: currentTenant.branding.favicon })
          };
        }

        return {
          type: detection.portal_type,
          tenant_domain: currentTenant?.domain_name,
          organization_id: detection.tenant_info?.organization_id,
          allowed_modules: detection.user_access.accessible_modules,
          branding,
          ui_config: {
            show_msp_branding: false,
            show_organization_selector: false,
            show_team_selector: true,
            theme: currentTenant?.ui_config?.theme || 'light'
          },
          features: {
            multi_tenant_access: false,
            cross_organization_view: false,
            admin_settings_access: false,
            cloud_management: detection.user_access.accessible_modules.includes('cloud'),
            user_management: detection.user_access.accessible_modules.includes('users')
          }
        };
      }
    } catch (err: any) {
      console.error('Error loading portal config:', err);
      throw new Error('Impossible de charger la configuration du portail');
    }
  }, [currentTenant]);

  // Initialiser le contexte du portail
  const initializePortal = React.useCallback(async () => {
    if (!user || !userProfile) return;

    try {
      setLoading(true);
      setError(null);

      const detection = await detectPortalType();
      setPortalDetection(detection);

      const config = await loadPortalConfig(detection);
      setPortalConfig(config);

      console.log('Portal initialized:', {
        type: detection.portal_type,
        tenant: detection.tenant_info?.domain_name,
        modules: detection.user_access.accessible_modules.length
      });

    } catch (err: any) {
      console.error('Portal initialization error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile, detectPortalType, loadPortalConfig]);

  // Rafraîchir la configuration
  const refreshPortalConfig = React.useCallback(async () => {
    await initializePortal();
  }, [initializePortal]);

  // Basculer vers le portail MSP (pour les admins MSP)
  const switchToMSPPortal = React.useCallback(() => {
    if (userProfile?.is_msp_admin) {
      // Rediriger vers le domaine admin
      const adminUrl = process.env.NODE_ENV === 'production' 
        ? 'https://admin.votredomaine.com' 
        : window.location.origin;
      window.location.href = adminUrl;
    }
  }, [userProfile]);

  // Utilitaires
  const canAccessModule = React.useCallback((moduleId: string): boolean => {
    return portalConfig?.allowed_modules.includes(moduleId) || false;
  }, [portalConfig]);

  const getModulePermission = React.useCallback((moduleId: string): 'none' | 'read' | 'write' | 'admin' => {
    if (!canAccessModule(moduleId)) return 'none';
    
    // Pour le portail MSP, accès admin complet
    if (portalDetection?.portal_type === 'msp_admin') return 'admin';
    
    // Pour les portails client, permission lecture/écriture selon le module
    const readOnlyModules = ['monitoring', 'security'];
    if (readOnlyModules.includes(moduleId)) return 'read';
    
    return 'write';
  }, [canAccessModule, portalDetection]);

  const isMSPAdminPortal = React.useCallback((): boolean => {
    return portalDetection?.portal_type === 'msp_admin' || false;
  }, [portalDetection]);

  const isClientPortal = React.useCallback((): boolean => {
    return portalDetection?.portal_type === 'client_portal' || portalDetection?.portal_type === 'esn_portal' || false;
  }, [portalDetection]);

  // Initialiser au montage et lors des changements
  useEffect(() => {
    initializePortal();
  }, [initializePortal]);

  const value: PortalContextType = {
    portalConfig,
    portalDetection,
    loading,
    error,
    switchToMSPPortal,
    refreshPortalConfig,
    canAccessModule,
    getModulePermission,
    isMSPAdminPortal,
    isClientPortal
  };

  return (
    <PortalContext.Provider value={value}>
      {children}
    </PortalContext.Provider>
  );
};

export const usePortal = (): PortalContextType => {
  const context = useContext(PortalContext);
  if (context === undefined) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return context;
};

export default usePortal; 