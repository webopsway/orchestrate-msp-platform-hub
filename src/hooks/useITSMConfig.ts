import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export interface ITSMConfigItem {
  id: string;
  team_id: string;
  config_type: 'priorities' | 'statuses' | 'categories' | 'ticket_types';
  config_key: string;
  config_value: Json;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface SLAPolicy {
  id: string;
  team_id: string;
  name: string;
  description?: string;
  priority: string;
  ticket_category?: string;
  response_time_hours: number;
  resolution_time_hours: number;
  escalation_time_hours?: number;
  escalation_to?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface SLATracking {
  id: string;
  team_id: string;
  incident_id?: string;
  change_request_id?: string;
  service_request_id?: string;
  sla_policy_id: string;
  response_due_at: string;
  resolution_due_at: string;
  escalation_due_at?: string;
  first_response_at?: string;
  resolved_at?: string;
  escalated_at?: string;
  response_sla_breached: boolean;
  resolution_sla_breached: boolean;
  is_escalated: boolean;
  created_at: string;
  updated_at: string;
  sla_policy?: {
    name: string;
    response_time_hours: number;
    resolution_time_hours: number;
  };
}

export const useITSMConfig = (teamId: string, configType?: string) => {
  return useQuery({
    queryKey: ['itsm-config', teamId, configType],
    queryFn: async () => {
      let query = supabase
        .from('itsm_configurations')
        .select('*')
        .eq('team_id', teamId)
        .eq('is_active', true)
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

export const useCreateITSMConfig = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (config: Omit<ITSMConfigItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('itsm_configurations')
        .insert(config)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['itsm-config'] });
      toast({
        title: "Configuration créée",
        description: "La configuration a été créée avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la configuration.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateITSMConfig = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ITSMConfigItem> }) => {
      const { data, error } = await supabase
        .from('itsm_configurations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itsm-config'] });
      toast({
        title: "Configuration mise à jour",
        description: "La configuration a été mise à jour avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la configuration.",
        variant: "destructive",
      });
    },
  });
};

export const useSLAPolicies = (teamId: string) => {
  return useQuery({
    queryKey: ['sla-policies', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('itsm_sla_policies')
        .select(`
          *,
          escalation_profile:profiles!itsm_sla_policies_escalation_to_fkey(first_name, last_name, email)
        `)
        .eq('team_id', teamId)
        .eq('is_active', true)
        .order('priority');

      if (error) throw error;
      return data as (SLAPolicy & { escalation_profile?: any })[];
    },
    enabled: !!teamId,
  });
};

export const useCreateSLAPolicy = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (policy: Omit<SLAPolicy, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('itsm_sla_policies')
        .insert(policy)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
      toast({
        title: "Politique SLA créée",
        description: "La politique SLA a été créée avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la politique SLA.",
        variant: "destructive",
      });
    },
  });
};

export const useSLATracking = (teamId: string) => {
  return useQuery({
    queryKey: ['sla-tracking', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('itsm_sla_tracking')
        .select(`
          *,
          sla_policy:itsm_sla_policies(name, response_time_hours, resolution_time_hours)
        `)
        .eq('team_id', teamId);

      if (error) throw error;
      return data as SLATracking[];
    },
    enabled: !!teamId,
  });
};

export const useCheckSLAViolations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('check_sla_violations');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-tracking'] });
    },
  });
};

// Hook pour obtenir le statut SLA d'un ticket
export const getSLAStatus = (tracking?: SLATracking) => {
  if (!tracking) return { status: 'unknown', color: 'gray' };

  const now = new Date();
  const responseDeadline = new Date(tracking.response_due_at);
  const resolutionDeadline = new Date(tracking.resolution_due_at);

  // Ticket résolu
  if (tracking.resolved_at) {
    const resolvedAt = new Date(tracking.resolved_at);
    if (resolvedAt <= resolutionDeadline) {
      return { status: 'resolved_on_time', color: 'green', label: 'Résolu dans les temps' };
    } else {
      return { status: 'resolved_late', color: 'orange', label: 'Résolu en retard' };
    }
  }

  // Violations SLA
  if (tracking.resolution_sla_breached) {
    return { status: 'breached', color: 'red', label: 'SLA de résolution dépassé' };
  }

  if (tracking.response_sla_breached) {
    return { status: 'response_breached', color: 'red', label: 'SLA de réponse dépassé' };
  }

  // Escaladé
  if (tracking.is_escalated) {
    return { status: 'escalated', color: 'purple', label: 'Escaladé' };
  }

  // À risque (moins de 25% du temps restant)
  const resolutionTimeLeft = resolutionDeadline.getTime() - now.getTime();
  const totalResolutionTime = resolutionDeadline.getTime() - new Date(tracking.created_at).getTime();
  
  if (resolutionTimeLeft < totalResolutionTime * 0.25) {
    return { status: 'at_risk', color: 'orange', label: 'À risque' };
  }

  // Dans les temps
  return { status: 'on_track', color: 'green', label: 'Dans les temps' };
};