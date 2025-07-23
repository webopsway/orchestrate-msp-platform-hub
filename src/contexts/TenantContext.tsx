import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { TenantService } from '@/services/tenantService';
import { useAuth } from '@/contexts/AuthContext';
import type { 
  TenantContext as TenantContextType, 
  TenantResolution, 
  TenantDomain, 
  TenantFormData 
} from '@/types/tenant';

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const { userProfile } = useAuth();
  const [currentTenant, setCurrentTenant] = useState<TenantResolution | null>(null);
  const [tenantDomains, setTenantDomains] = useState<TenantDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Résolution initiale du tenant basé sur l'URL
  useEffect(() => {
    const initializeTenant = async () => {
      try {
        setLoading(true);
        setError(null);

        // Tenter de résoudre le tenant depuis l'URL actuelle
        const tenant = await TenantService.resolveTenantFromCurrentURL();
        
        if (tenant) {
          setCurrentTenant(tenant);
          
          // Appliquer la configuration UI du tenant
          TenantService.applyTenantUIConfig(tenant.ui_config);
          
          console.log('Tenant résolu:', {
            domain: tenant.domain_name,
            organization: tenant.organization_id,
            type: tenant.tenant_type
          });
        } else {
          console.log('Aucun tenant trouvé pour ce domaine, utilisation du mode par défaut');
        }
      } catch (err: any) {
        console.error('Erreur lors de la résolution du tenant:', err);
        setError(err.message || 'Erreur de résolution de tenant');
      } finally {
        setLoading(false);
      }
    };

    initializeTenant();
  }, []);

  // Charger la liste des domaines tenant si admin MSP
  useEffect(() => {
    const loadTenantDomains = async () => {
      if (!userProfile?.is_msp_admin) return;

      try {
        const { tenantDomains: domains } = await TenantService.loadAll();
        setTenantDomains(domains);
      } catch (err: any) {
        console.error('Erreur lors du chargement des domaines tenant:', err);
      }
    };

    if (userProfile?.is_msp_admin && !loading) {
      loadTenantDomains();
    }
  }, [userProfile?.is_msp_admin, loading]);

  const resolveTenant = async (domain: string): Promise<TenantResolution | null> => {
    try {
      const tenant = await TenantService.resolveTenantByDomain(domain);
      if (tenant) {
        setCurrentTenant(tenant);
        TenantService.applyTenantUIConfig(tenant.ui_config);
      }
      return tenant;
    } catch (err: any) {
      setError(err.message || 'Erreur de résolution de tenant');
      return null;
    }
  };

  const updateTenantConfig = async (tenantId: string, config: Partial<TenantDomain>): Promise<void> => {
    try {
      await TenantService.update(tenantId, config);
      
      // Recharger la liste des domaines
      if (userProfile?.is_msp_admin) {
        const { tenantDomains: domains } = await TenantService.loadAll();
        setTenantDomains(domains);
      }

      // Si c'est le tenant actuel, mettre à jour sa config
      if (currentTenant?.tenant_id === tenantId) {
        const updatedTenant = await TenantService.resolveTenantByDomain(currentTenant.domain_name);
        if (updatedTenant) {
          setCurrentTenant(updatedTenant);
          TenantService.applyTenantUIConfig(updatedTenant.ui_config);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de mise à jour de tenant');
      throw err;
    }
  };

  const createTenantDomain = async (domainData: Omit<TenantDomain, 'id' | 'created_at' | 'updated_at'>): Promise<TenantDomain> => {
    try {
      const newDomain = await TenantService.create(domainData as TenantFormData);
      
      // Recharger la liste des domaines
      if (userProfile?.is_msp_admin) {
        const { tenantDomains: domains } = await TenantService.loadAll();
        setTenantDomains(domains);
      }

      return newDomain;
    } catch (err: any) {
      setError(err.message || 'Erreur de création de domaine tenant');
      throw err;
    }
  };

  const deleteTenantDomain = async (tenantId: string): Promise<void> => {
    try {
      await TenantService.delete(tenantId);
      
      // Recharger la liste des domaines
      if (userProfile?.is_msp_admin) {
        const { tenantDomains: domains } = await TenantService.loadAll();
        setTenantDomains(domains);
      }

      // Si c'était le tenant actuel, le réinitialiser
      if (currentTenant?.tenant_id === tenantId) {
        setCurrentTenant(null);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de suppression de domaine tenant');
      throw err;
    }
  };

  const value: TenantContextType = {
    currentTenant,
    tenantDomains,
    loading,
    error,
    resolveTenant,
    updateTenantConfig,
    createTenantDomain,
    deleteTenantDomain
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

/**
 * Hook pour vérifier si l'utilisateur actuel a accès au tenant résolu
 */
export const useTenantAccess = () => {
  const { currentTenant } = useTenant();
  const { userProfile } = useAuth();

  const hasAccess = React.useMemo(() => {
    if (!currentTenant || !userProfile) return false;

    // Admin MSP a toujours accès
    if (userProfile.is_msp_admin) return true;

    // Vérifier si l'utilisateur fait partie des organisations autorisées
    if (!userProfile.default_organization_id) return false;

    return currentTenant.allowed_organizations.includes(userProfile.default_organization_id);
  }, [currentTenant, userProfile]);

  return {
    hasAccess,
    tenant: currentTenant,
    isMSPAdmin: userProfile?.is_msp_admin || false
  };
};

/**
 * Hook pour obtenir la configuration UI du tenant actuel
 */
export const useTenantUI = () => {
  const { currentTenant } = useTenant();

  return React.useMemo(() => {
    if (!currentTenant) return null;

    return {
      branding: currentTenant.branding,
      uiConfig: currentTenant.ui_config,
      companyName: currentTenant.branding?.company_name || 'Plateforme MSP',
      logo: currentTenant.branding?.logo,
      primaryColor: currentTenant.ui_config?.primary_color || '#3b82f6',
      secondaryColor: currentTenant.ui_config?.secondary_color || '#1e40af'
    };
  }, [currentTenant]);
}; 