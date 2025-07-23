import { useEffect, useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { TenantService } from '@/services/tenantService';
import type { TenantResolution } from '@/types/tenant';

/**
 * Hook pour résoudre le tenant basé sur l'URL actuelle
 * Utile pour les pages publiques ou quand le contexte n'est pas encore initialisé
 */
export const useTenantResolution = (domain?: string) => {
  const [tenant, setTenant] = useState<TenantResolution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolveTenant = async () => {
      try {
        setLoading(true);
        setError(null);

        let resolvedTenant: TenantResolution | null = null;

        if (domain) {
          // Résoudre avec un domaine spécifique
          resolvedTenant = await TenantService.resolveTenantByDomain(domain);
        } else {
          // Résoudre avec l'URL actuelle
          resolvedTenant = await TenantService.resolveTenantFromCurrentURL();
        }

        setTenant(resolvedTenant);
      } catch (err: any) {
        setError(err.message || 'Erreur de résolution de tenant');
        console.error('Error resolving tenant:', err);
      } finally {
        setLoading(false);
      }
    };

    resolveTenant();
  }, [domain]);

  return {
    tenant,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      // Re-trigger the effect
      setTenant(null);
    }
  };
};

/**
 * Hook pour vérifier si un domaine est disponible
 */
export const useDomainAvailability = () => {
  const [checking, setChecking] = useState(false);

  const checkAvailability = async (domainName: string, excludeId?: string): Promise<boolean> => {
    try {
      setChecking(true);
      return await TenantService.validateDomainAvailability(domainName, excludeId);
    } catch (error) {
      console.error('Error checking domain availability:', error);
      return false;
    } finally {
      setChecking(false);
    }
  };

  return {
    checkAvailability,
    checking
  };
};

/**
 * Hook pour obtenir l'URL de preview d'un tenant
 */
export const useTenantPreview = () => {
  const generatePreviewURL = (domainName: string): string => {
    if (domainName.includes('.')) {
      return `https://${domainName}`;
    }
    
    // Créer un sous-domaine basé sur l'hôte actuel
    const currentHost = window.location.host;
    const [, ...rest] = currentHost.split('.');
    const rootDomain = rest.join('.');
    
    if (rootDomain) {
      return `https://${domainName}.${rootDomain}`;
    } else {
      // En développement local
      return `http://${domainName}.localhost:8080`;
    }
  };

  const openPreview = (domainName: string) => {
    const url = generatePreviewURL(domainName);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return {
    generatePreviewURL,
    openPreview
  };
};

/**
 * Hook pour la gestion de l'état du tenant actuel
 */
export const useCurrentTenant = () => {
  const { currentTenant, loading, error } = useTenant();

  const isESN = currentTenant?.tenant_type === 'esn';
  const isClient = currentTenant?.tenant_type === 'client';
  const isMSP = currentTenant?.tenant_type === 'msp';

  const hasCustomBranding = Boolean(
    currentTenant?.branding?.logo || 
    currentTenant?.branding?.primary_color ||
    currentTenant?.branding?.company_name
  );

  const allowedModules = currentTenant?.access_config?.allowed_modules || [];
  const accessType = currentTenant?.access_config?.access_type || 'full';

  return {
    tenant: currentTenant,
    loading,
    error,
    isESN,
    isClient,
    isMSP,
    hasCustomBranding,
    allowedModules,
    accessType,
    canAccess: (module: string) => {
      if (accessType === 'full') return true;
      return allowedModules.includes(module);
    }
  };
}; 