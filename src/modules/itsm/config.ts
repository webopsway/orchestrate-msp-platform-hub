// Configuration unifiée du module ITSM
import { useITSMDynamicConfig, useGlobalITSMConfig } from '@/hooks';

export const ITSM_CONFIG = {
  // Tables de base de données
  tables: {
    incidents: 'itsm_incidents',
    changes: 'itsm_change_requests',
    serviceRequests: 'itsm_service_requests',
    configurations: 'itsm_configurations'
  },

  // Configuration par défaut (fallback)
  defaults: {
    priorities: {
      low: { label: 'Faible', color: '#10b981' },
      medium: { label: 'Moyenne', color: '#f59e0b' },
      high: { label: 'Élevée', color: '#f97316' },
      critical: { label: 'Critique', color: '#ef4444' }
    },
    statuses: {
      incident: {
        open: { label: 'Ouvert', color: '#ef4444' },
        in_progress: { label: 'En cours', color: '#f59e0b' },
        resolved: { label: 'Résolu', color: '#10b981' },
        closed: { label: 'Fermé', color: '#6b7280' }
      },
      change: {
        draft: { label: 'Brouillon', color: '#6b7280' },
        pending_approval: { label: 'En attente approbation', color: '#f59e0b' },
        approved: { label: 'Approuvé', color: '#10b981' },
        rejected: { label: 'Rejeté', color: '#ef4444' },
        implemented: { label: 'Implémenté', color: '#10b981' },
        failed: { label: 'Échec', color: '#ef4444' }
      },
      request: {
        open: { label: 'Ouvert', color: '#ef4444' },
        in_progress: { label: 'En cours', color: '#f59e0b' },
        resolved: { label: 'Résolu', color: '#10b981' },
        closed: { label: 'Fermé', color: '#6b7280' },
        cancelled: { label: 'Annulé', color: '#6b7280' }
      }
    },
    categories: {
      incident: { label: 'Incidents', color: '#ef4444' },
      change: { label: 'Changements', color: '#f59e0b' },
      request: { label: 'Demandes', color: '#3b82f6' }
    }
  },

  // Pagination par défaut
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 100
  },

  // Messages d'erreur
  messages: {
    errors: {
      fetchFailed: 'Erreur lors du chargement des données',
      createFailed: 'Erreur lors de la création',
      updateFailed: 'Erreur lors de la modification',
      deleteFailed: 'Erreur lors de la suppression',
      permissionDenied: 'Permission refusée',
      validationFailed: 'Données invalides'
    },
    success: {
      created: 'Élément créé avec succès',
      updated: 'Élément modifié avec succès',
      deleted: 'Élément supprimé avec succès',
      statusUpdated: 'Statut mis à jour avec succès',
      assigned: 'Assignation mise à jour avec succès'
    }
  },

  // Validation
  validation: {
    title: {
      minLength: 3,
      maxLength: 200
    },
    description: {
      minLength: 10,
      maxLength: 2000
    }
  },

  // Logs de débogage
  debug: {
    enabled: true, // À configurer selon l'environnement
    logLevel: 'info' as 'debug' | 'info' | 'warn' | 'error'
  }
} as const;

// Hook unifié pour la configuration ITSM
export const useITSMCONFIG = (configType: 'priorities' | 'statuses' | 'categories', category?: string) => {
  const { data: dynamicConfigs = [], isLoading: dynamicLoading } = useITSMDynamicConfig(configType);
  const { data: globalConfigs = [], isLoading: globalLoading } = useGlobalITSMConfig(configType, category);

  // Priorité aux configurations dynamiques, fallback vers les globales
  const configs = dynamicConfigs.length > 0 ? dynamicConfigs : globalConfigs;
  const isLoading = dynamicLoading || globalLoading;

  return {
    data: configs,
    isLoading,
    isDynamic: dynamicConfigs.length > 0,
    isGlobal: dynamicConfigs.length === 0 && globalConfigs.length > 0
  };
};

// Fonctions utilitaires unifiées
export const getITSMCONFIGValue = (
  key: string, 
  configType: 'priorities' | 'statuses' | 'categories', 
  category?: string
) => {
  const { data: configs } = useITSMCONFIG(configType, category);
  const config = configs.find(c => c.config_key === key);
  
  if (config) {
    return {
      label: config.config_value.label,
      color: config.config_value.color,
      category: config.config_value.category
    };
  }

  // Fallback vers les valeurs par défaut
  const defaults = ITSM_CONFIG.defaults[configType];
  if (configType === 'statuses' && category && defaults[category]) {
    return defaults[category][key] || { label: key, color: '#6b7280' };
  }
  
  return defaults[key] || { label: key, color: '#6b7280' };
}; 