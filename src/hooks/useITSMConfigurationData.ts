import { useQuery } from '@tanstack/react-query';
import { useITSMConfig, ITSMConfigItem } from './useITSMConfig';
import { useAuth } from '@/contexts/AuthContext';

// Hook pour accéder aux priorités configurées
export const useITSMPriorities = () => {
  const { user } = useAuth();
  const teamId = user?.user_metadata?.default_team_id;
  
  return useITSMConfig(teamId, 'priorities');
};

// Hook pour accéder aux statuts configurés
export const useITSMStatuses = (category?: string) => {
  const { user } = useAuth();
  const teamId = user?.user_metadata?.default_team_id;
  
  const { data: allStatuses, ...rest } = useITSMConfig(teamId, 'statuses');
  
  // Filtrer par catégorie si spécifiée
  const filteredData = category 
    ? allStatuses?.filter(status => {
        const configValue = status.config_value as any;
        return configValue?.category === category;
      })
    : allStatuses;
    
  return {
    data: filteredData,
    ...rest
  };
};

// Hook pour accéder aux types configurés
export const useITSMTypes = () => {
  const { user } = useAuth();
  const teamId = user?.user_metadata?.default_team_id;
  
  return useITSMConfig(teamId, 'ticket_types');
};

// Hook pour accéder aux catégories configurées
export const useITSMCategories = () => {
  const { user } = useAuth();
  const teamId = user?.user_metadata?.default_team_id;
  
  return useITSMConfig(teamId, 'categories');
};

// Utilitaires pour extraire les informations des configurations
export const getITSMConfigLabel = (config: ITSMConfigItem): string => {
  const configValue = config.config_value as any;
  return configValue?.label || config.config_key;
};

export const getITSMConfigColor = (config: ITSMConfigItem): string => {
  const configValue = config.config_value as any;
  return configValue?.color || '#6b7280';
};

export const getITSMConfigCategory = (config: ITSMConfigItem): string | undefined => {
  const configValue = config.config_value as any;
  return configValue?.category;
};

// Hook pour obtenir une configuration spécifique par clé
export const useITSMConfigByKey = (configType: string, configKey: string) => {
  const { user } = useAuth();
  const teamId = user?.user_metadata?.default_team_id;
  
  return useQuery({
    queryKey: ['itsm-config-by-key', teamId, configType, configKey],
    queryFn: async () => {
      const { data } = useITSMConfig(teamId, configType);
      return data?.find(config => config.config_key === configKey);
    },
    enabled: !!teamId && !!configType && !!configKey,
  });
};

// Hook pour obtenir toutes les configurations d'une équipe
export const useAllITSMConfigurations = () => {
  const { user } = useAuth();
  const teamId = user?.user_metadata?.default_team_id;
  
  return useITSMConfig(teamId);
};

// Fonctions utilitaires pour obtenir les options de formulaire
export const formatConfigsForSelect = (configs: ITSMConfigItem[] = []) => {
  return configs.map(config => ({
    value: config.config_key,
    label: getITSMConfigLabel(config),
    color: getITSMConfigColor(config),
    category: getITSMConfigCategory(config),
    config
  }));
};

// Hook pour obtenir les options formatées pour un Select
export const useITSMSelectOptions = (configType: 'priorities' | 'statuses' | 'categories' | 'ticket_types', category?: string) => {
  const { user } = useAuth();
  const teamId = user?.user_metadata?.default_team_id;
  
  const { data: configs, ...rest } = useITSMConfig(teamId, configType);
  
  // Filtrer par catégorie si spécifiée
  const filteredConfigs = category 
    ? configs?.filter(config => getITSMConfigCategory(config) === category)
    : configs;
    
  const options = formatConfigsForSelect(filteredConfigs);
  
  return {
    data: options,
    configs: filteredConfigs,
    ...rest
  };
};