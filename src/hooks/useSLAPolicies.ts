import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SLAService } from '@/services/slaService';
import { SLAPolicy, CreateSLAPolicyData, UpdateSLAPolicyData, SLAPolicyFilters } from '@/types/sla';

// Re-export types for backward compatibility
export type { SLAPolicy, CreateSLAPolicyData, UpdateSLAPolicyData, SLAPolicyFilters } from '@/types/sla';

interface UseSLAPoliciesReturn {
  policies: SLAPolicy[];
  loading: boolean;
  error: string | null;
  createPolicy: (data: CreateSLAPolicyData) => Promise<SLAPolicy | null>;
  updatePolicy: (id: string, updates: UpdateSLAPolicyData) => Promise<SLAPolicy | null>;
  deletePolicy: (id: string) => Promise<boolean>;
  toggleActive: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
  clearError: () => void;
}

export const useSLAPolicies = (teamId?: string): UseSLAPoliciesReturn => {
  const [policies, setPolicies] = useState<SLAPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await SLAService.getAll(teamId);
      setPolicies(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des politiques SLA';
      setError(errorMessage);
      console.error('Erreur lors du chargement des politiques SLA:', err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  const createPolicy = useCallback(async (policyData: CreateSLAPolicyData): Promise<SLAPolicy | null> => {
    try {
      setLoading(true);
      
      const newPolicy = await SLAService.create(policyData, teamId);
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
  }, [teamId, toast]);

  const updatePolicy = useCallback(async (id: string, updates: UpdateSLAPolicyData): Promise<SLAPolicy | null> => {
    try {
      setLoading(true);

      const updatedPolicy = await SLAService.update(id, updates);
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
  }, [toast]);

  const deletePolicy = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);

      await SLAService.delete(id);
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
  }, [toast]);

  const toggleActive = useCallback(async (id: string): Promise<boolean> => {
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
  }, [policies, updatePolicy]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  return {
    policies,
    loading,
    error,
    createPolicy,
    updatePolicy,
    deletePolicy,
    toggleActive,
    refetch: fetchPolicies,
    clearError,
  };
};