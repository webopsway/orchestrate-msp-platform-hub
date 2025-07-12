import { useQuery } from '@tanstack/react-query';

// Configuration ITSM globale (non hardcodée dans les composants)
export interface GlobalConfigItem {
  config_key: string;
  config_value: {
    label: string;
    color: string;
    category?: string;
  };
}

const GLOBAL_PRIORITIES: GlobalConfigItem[] = [
  { config_key: 'low', config_value: { label: 'Faible', color: '#10b981' } },
  { config_key: 'medium', config_value: { label: 'Moyenne', color: '#f59e0b' } },
  { config_key: 'high', config_value: { label: 'Élevée', color: '#f97316' } },
  { config_key: 'critical', config_value: { label: 'Critique', color: '#ef4444' } }
];

const GLOBAL_STATUSES: GlobalConfigItem[] = [
  // Statuts pour incidents
  { config_key: 'open', config_value: { label: 'Ouvert', color: '#ef4444', category: 'incident' } },
  { config_key: 'in_progress', config_value: { label: 'En cours', color: '#f59e0b', category: 'incident' } },
  { config_key: 'resolved', config_value: { label: 'Résolu', color: '#10b981', category: 'incident' } },
  { config_key: 'closed', config_value: { label: 'Fermé', color: '#6b7280', category: 'incident' } },
  
  // Statuts pour changements
  { config_key: 'draft', config_value: { label: 'Brouillon', color: '#6b7280', category: 'change' } },
  { config_key: 'pending_approval', config_value: { label: 'En attente approbation', color: '#f59e0b', category: 'change' } },
  { config_key: 'approved', config_value: { label: 'Approuvé', color: '#10b981', category: 'change' } },
  { config_key: 'rejected', config_value: { label: 'Rejeté', color: '#ef4444', category: 'change' } },
  { config_key: 'implemented', config_value: { label: 'Implémenté', color: '#10b981', category: 'change' } },
  { config_key: 'failed', config_value: { label: 'Échec', color: '#ef4444', category: 'change' } },
  
  // Statuts pour demandes de service
  { config_key: 'open', config_value: { label: 'Ouvert', color: '#ef4444', category: 'request' } },
  { config_key: 'in_progress', config_value: { label: 'En cours', color: '#f59e0b', category: 'request' } },
  { config_key: 'resolved', config_value: { label: 'Résolu', color: '#10b981', category: 'request' } },
  { config_key: 'closed', config_value: { label: 'Fermé', color: '#6b7280', category: 'request' } },
  { config_key: 'cancelled', config_value: { label: 'Annulé', color: '#6b7280', category: 'request' } }
];

const GLOBAL_CATEGORIES: GlobalConfigItem[] = [
  { config_key: 'incident', config_value: { label: 'Incidents', color: '#ef4444' } },
  { config_key: 'change', config_value: { label: 'Changements', color: '#f59e0b' } },
  { config_key: 'request', config_value: { label: 'Demandes', color: '#3b82f6' } }
];

export const useGlobalITSMConfig = (configType: 'priorities' | 'statuses' | 'categories', filterCategory?: string) => {
  return useQuery({
    queryKey: ['global-itsm-config', configType, filterCategory],
    queryFn: async () => {
      let data: GlobalConfigItem[] = [];
      
      switch (configType) {
        case 'priorities':
          data = GLOBAL_PRIORITIES;
          break;
        case 'statuses':
          data = GLOBAL_STATUSES;
          if (filterCategory) {
            data = data.filter(item => item.config_value.category === filterCategory);
          }
          break;
        case 'categories':
          data = GLOBAL_CATEGORIES;
          break;
      }
      
      return data;
    },
    staleTime: Infinity, // Les données globales ne changent pas
  });
};

// Fonctions utilitaires pour obtenir les couleurs et labels
export const getConfigColor = (configKey: string, configType: 'priorities' | 'statuses' | 'categories', category?: string): string => {
  let data: GlobalConfigItem[] = [];
  
  switch (configType) {
    case 'priorities':
      data = GLOBAL_PRIORITIES;
      break;
    case 'statuses':
      data = GLOBAL_STATUSES;
      if (category) {
        data = data.filter(item => item.config_value.category === category);
      }
      break;
    case 'categories':
      data = GLOBAL_CATEGORIES;
      break;
  }
  
  const config = data.find(item => item.config_key === configKey);
  return config?.config_value.color || '#6b7280';
};

export const getConfigLabel = (configKey: string, configType: 'priorities' | 'statuses' | 'categories', category?: string): string => {
  let data: GlobalConfigItem[] = [];
  
  switch (configType) {
    case 'priorities':
      data = GLOBAL_PRIORITIES;
      break;
    case 'statuses':
      data = GLOBAL_STATUSES;
      if (category) {
        data = data.filter(item => item.config_value.category === category);
      }
      break;
    case 'categories':
      data = GLOBAL_CATEGORIES;
      break;
  }
  
  const config = data.find(item => item.config_key === configKey);
  return config?.config_value.label || configKey;
};

// Fonctions utilitaires pour la compatibilité avec l'ancien code
export const getPriorityColor = (priority: string): string => {
  return getConfigColor(priority, 'priorities');
};

export const getStatusColor = (status: string, category?: string): string => {
  return getConfigColor(status, 'statuses', category);
};

export const getPriorityLabel = (priority: string): string => {
  return getConfigLabel(priority, 'priorities');
};

export const getStatusLabel = (status: string, category?: string): string => {
  return getConfigLabel(status, 'statuses', category);
};

export const getCategoryLabel = (category: string): string => {
  return getConfigLabel(category, 'categories');
};

export const getCategoryColor = (category: string): string => {
  return getConfigColor(category, 'categories');
};