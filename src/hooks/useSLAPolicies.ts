import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SLAPolicy {
  id: string;
  name: string;
  client_type: 'direct' | 'via_esn' | 'all';
  client_organization_id?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  ticket_category?: string;
  response_time_hours: number;
  resolution_time_hours: number;
  escalation_time_hours?: number;
  escalation_to?: string;
  is_active: boolean;
  description?: string;
  team_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreateSLAPolicyData {
  name: string;
  client_type: 'direct' | 'via_esn' | 'all';
  client_organization_id?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  ticket_category?: string;
  response_time_hours: number;
  resolution_time_hours: number;
  escalation_time_hours?: number;
  escalation_to?: string;
  is_active: boolean;
  description?: string;
}

export interface UpdateSLAPolicyData extends Partial<CreateSLAPolicyData> {}

export const useSLAPolicies = (teamId?: string) => {
  const [policies, setPolicies] = useState<SLAPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fonction pour récupérer les politiques SLA
  const fetchPolicies = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('itsm_sla_policies')
        .select('*')
        .order('created_at', { ascending: false });

      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setPolicies((data || []) as SLAPolicy[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des politiques SLA';
      setError(errorMessage);
      console.error('Erreur lors du chargement des politiques SLA:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour créer une nouvelle politique SLA
  const createPolicy = async (policyData: CreateSLAPolicyData): Promise<SLAPolicy | null> => {
    try {
      setLoading(true);
      
      // Récupérer l'utilisateur actuel et son équipe
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Récupérer le team_id de l'utilisateur si non fourni
      let currentTeamId = teamId;
      if (!currentTeamId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('default_team_id')
          .eq('id', user.id)
          .single();
        
        if (!profile?.default_team_id) {
          throw new Error('Aucune équipe définie pour cet utilisateur');
        }
        currentTeamId = profile.default_team_id;
      }

      const { data, error } = await supabase
        .from('itsm_sla_policies')
        .insert({
          ...policyData,
          team_id: currentTeamId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newPolicy = data as SLAPolicy;
      setPolicies(prev => [newPolicy, ...prev]);
      
      toast({
        title: 'Politique SLA créée',
        description: `La politique "${policyData.name}" a été créée avec succès.`,
      });

      return newPolicy;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la politique SLA';
      setError(errorMessage);
      
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      
      console.error('Erreur lors de la création de la politique SLA:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour mettre à jour une politique SLA
  const updatePolicy = async (id: string, updates: UpdateSLAPolicyData): Promise<SLAPolicy | null> => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('itsm_sla_policies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const updatedPolicy = data as SLAPolicy;
      setPolicies(prev => 
        prev.map(policy => 
          policy.id === id ? updatedPolicy : policy
        )
      );

      toast({
        title: 'Politique SLA mise à jour',
        description: 'Les modifications ont été enregistrées avec succès.',
      });

      return updatedPolicy;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la politique SLA';
      setError(errorMessage);
      
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      
      console.error('Erreur lors de la mise à jour de la politique SLA:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour supprimer une politique SLA
  const deletePolicy = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);

      // Vérifier d'abord si la politique est utilisée dans des trackings SLA
      const { data: trackings, error: trackingError } = await supabase
        .from('itsm_sla_tracking')
        .select('id')
        .eq('sla_policy_id', id)
        .limit(1);

      if (trackingError) {
        throw trackingError;
      }

      if (trackings && trackings.length > 0) {
        throw new Error('Cette politique SLA ne peut pas être supprimée car elle est utilisée dans des suivis SLA actifs.');
      }

      const { error } = await supabase
        .from('itsm_sla_policies')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setPolicies(prev => prev.filter(policy => policy.id !== id));

      toast({
        title: 'Politique SLA supprimée',
        description: 'La politique a été supprimée avec succès.',
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la politique SLA';
      setError(errorMessage);
      
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      
      console.error('Erreur lors de la suppression de la politique SLA:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour basculer le statut actif/inactif
  const toggleActive = async (id: string): Promise<boolean> => {
    try {
      const policy = policies.find(p => p.id === id);
      if (!policy) {
        throw new Error('Politique SLA non trouvée');
      }

      const result = await updatePolicy(id, { is_active: !policy.is_active });
      return result !== null;
    } catch (err) {
      console.error('Erreur lors du basculement du statut:', err);
      return false;
    }
  };

  // Charger les politiques au montage du composant
  useEffect(() => {
    fetchPolicies();
  }, [teamId]);

  return {
    policies,
    loading,
    error,
    createPolicy,
    updatePolicy,
    deletePolicy,
    toggleActive,
    refetch: fetchPolicies,
  };
};