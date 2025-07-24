import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Json } from '@/integrations/supabase/types';

export interface ITSMConfigItem {
  id: string;
  team_id: string;
  config_type: 'priorities' | 'statuses' | 'categories' | 'ticket_types';
  config_key: string;
  config_value: {
    label: string;
    color: string;
    category?: string;
    description?: string;
  };
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreateConfigData {
  config_type: 'priorities' | 'statuses' | 'categories' | 'ticket_types';
  config_key: string;
  label: string;
  color: string;
  category?: string;
  description?: string;
  display_order?: number;
}

export interface UpdateConfigData {
  label?: string;
  color?: string;
  category?: string;
  description?: string;
  is_active?: boolean;
  display_order?: number;
}

// Hook principal pour gérer les configurations ITSM
export const useITSMDynamicConfig = (configType?: 'priorities' | 'statuses' | 'categories' | 'ticket_types') => {
  const { userProfile } = useAuth();
  const teamId = userProfile?.default_team_id;

  return useQuery({
    queryKey: ['itsm-dynamic-config', teamId, configType],
    queryFn: async () => {
      if (!teamId) throw new Error('Team ID is required');

      let query = supabase
        .from('itsm_configurations')
        .select('*')
        .eq('team_id', teamId)
        .order('display_order');

      if (configType) {
        query = query.eq('config_type', configType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ITSMConfigItem[];
    },
    enabled: !!teamId,
  });
};

// Hook pour créer une nouvelle configuration
export const useCreateITSMDynamicConfig = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const teamId = userProfile?.default_team_id;

  return useMutation({
    mutationFn: async (configData: CreateConfigData) => {
      if (!teamId) throw new Error('Team ID is required');

      // Générer un ordre d'affichage automatique
      if (!configData.display_order) {
        const { data: existingConfigs } = await supabase
          .from('itsm_configurations')
          .select('display_order')
          .eq('team_id', teamId)
          .eq('config_type', configData.config_type)
          .order('display_order', { ascending: false })
          .limit(1);

        configData.display_order = existingConfigs?.[0]?.display_order ? existingConfigs[0].display_order + 1 : 1;
      }

      const configItem = {
        team_id: teamId,
        config_type: configData.config_type,
        config_key: configData.config_key,
        config_value: {
          label: configData.label,
          color: configData.color,
          category: configData.category,
          description: configData.description,
        } as Json,
        display_order: configData.display_order,
        created_by: user?.id || '',
        is_active: true,
      };

      const { data, error } = await supabase
        .from('itsm_configurations')
        .insert(configItem)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['itsm-dynamic-config'] });
      toast({
        title: "Configuration créée",
        description: `${(data.config_value as any)?.label} a été créé avec succès.`,
      });
    },
    onError: (error) => {
      console.error('Create config error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la configuration.",
        variant: "destructive",
      });
    },
  });
};

// Hook pour mettre à jour une configuration
export const useUpdateITSMDynamicConfig = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateConfigData }) => {
      const updateData: any = { updated_at: new Date().toISOString() };

      // Construire l'objet config_value mis à jour
      if (updates.label || updates.color || updates.category || updates.description) {
        // Récupérer la configuration actuelle pour merger les valeurs
        const { data: currentConfig } = await supabase
          .from('itsm_configurations')
          .select('config_value')
          .eq('id', id)
          .single();

        const currentValue = currentConfig?.config_value as any || {};
        
        updateData.config_value = {
          ...currentValue,
          ...(updates.label && { label: updates.label }),
          ...(updates.color && { color: updates.color }),
          ...(updates.category !== undefined && { category: updates.category }),
          ...(updates.description !== undefined && { description: updates.description }),
        };
      }

      if (updates.is_active !== undefined) {
        updateData.is_active = updates.is_active;
      }

      if (updates.display_order !== undefined) {
        updateData.display_order = updates.display_order;
      }

      const { data, error } = await supabase
        .from('itsm_configurations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itsm-dynamic-config'] });
      toast({
        title: "Configuration mise à jour",
        description: "La configuration a été mise à jour avec succès.",
      });
    },
    onError: (error) => {
      console.error('Update config error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la configuration.",
        variant: "destructive",
      });
    },
  });
};

// Hook pour supprimer une configuration
export const useDeleteITSMDynamicConfig = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('itsm_configurations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itsm-dynamic-config'] });
      toast({
        title: "Configuration supprimée",
        description: "La configuration a été supprimée avec succès.",
      });
    },
    onError: (error) => {
      console.error('Delete config error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la configuration.",
        variant: "destructive",
      });
    },
  });
};

// Hook spécialisé pour les priorités
export const useITSMPriorities = () => {
  const { data: allConfigs = [], ...rest } = useITSMDynamicConfig('priorities');
  return {
    data: allConfigs.filter(config => config.is_active),
    ...rest
  };
};

// Hook spécialisé pour les statuts avec filtrage par catégorie
export const useITSMStatuses = (category?: string) => {
  const { data: allConfigs = [], ...rest } = useITSMDynamicConfig('statuses');
  
  const filteredData = category 
    ? allConfigs.filter(config => 
        config.is_active && 
        (config.config_value as any)?.category === category
      )
    : allConfigs.filter(config => config.is_active);
    
  return {
    data: filteredData,
    ...rest
  };
};

// Hook spécialisé pour les catégories
export const useITSMCategories = () => {
  const { data: allConfigs = [], ...rest } = useITSMDynamicConfig('categories');
  return {
    data: allConfigs.filter(config => config.is_active),
    ...rest
  };
};

// Fonctions utilitaires pour extraire les informations des configurations
export const getConfigLabel = (config: ITSMConfigItem): string => {
  return (config.config_value as any)?.label || config.config_key;
};

export const getConfigColor = (config: ITSMConfigItem): string => {
  return (config.config_value as any)?.color || '#6b7280';
};

export const getConfigCategory = (config: ITSMConfigItem): string | undefined => {
  return (config.config_value as any)?.category;
};

export const getConfigDescription = (config: ITSMConfigItem): string | undefined => {
  return (config.config_value as any)?.description;
};

// Fonction pour formater les configurations pour les composants Select
export const formatConfigsForSelect = (configs: ITSMConfigItem[] = []) => {
  return configs.map(config => ({
    value: config.config_key,
    label: getConfigLabel(config),
    color: getConfigColor(config),
    category: getConfigCategory(config),
    description: getConfigDescription(config),
    config
  }));
};