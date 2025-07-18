import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { BusinessService, CreateBusinessServiceData } from '@/types/application';

export function useBusinessServices() {
  const [businessServices, setBusinessServices] = useState<BusinessService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, userProfile } = useAuth();

  const fetchBusinessServices = async () => {
    if (!user || !userProfile) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('business_services')
        .select('*')
        .order('created_at', { ascending: false });

      // Les filtres RLS géreront l'accès aux données

      if (error) {
        console.error('Error fetching business services:', error);
        toast.error('Erreur lors du chargement des services métiers');
        return;
      }

      setBusinessServices(data as BusinessService[] || []);
    } catch (error) {
      console.error('Error fetching business services:', error);
      toast.error('Erreur lors du chargement des services métiers');
    } finally {
      setIsLoading(false);
    }
  };

  const createBusinessService = async (data: CreateBusinessServiceData): Promise<boolean> => {
    if (!user || !userProfile?.default_team_id) {
      toast.error('Utilisateur non authentifié ou équipe non définie');
      return false;
    }

    // Validation de l'organisation requise
    if (!data.organization_id) {
      toast.error('L\'organisation est requise');
      return false;
    }

    try {
      const { error } = await supabase
        .from('business_services')
        .insert({
          ...data,
          team_id: userProfile.default_team_id,
          created_by: user.id
        });

      if (error) {
        console.error('Error creating business service:', error);
        toast.error('Erreur lors de la création du service métier');
        return false;
      }

      toast.success('Service métier créé avec succès');
      await fetchBusinessServices();
      return true;
    } catch (error) {
      console.error('Error creating business service:', error);
      toast.error('Erreur lors de la création du service métier');
      return false;
    }
  };

  const updateBusinessService = async (id: string, data: Partial<CreateBusinessServiceData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('business_services')
        .update(data)
        .eq('id', id);

      if (error) {
        console.error('Error updating business service:', error);
        toast.error('Erreur lors de la mise à jour du service métier');
        return false;
      }

      toast.success('Service métier mis à jour avec succès');
      await fetchBusinessServices();
      return true;
    } catch (error) {
      console.error('Error updating business service:', error);
      toast.error('Erreur lors de la mise à jour du service métier');
      return false;
    }
  };

  const deleteBusinessService = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('business_services')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting business service:', error);
        toast.error('Erreur lors de la suppression du service métier');
        return false;
      }

      toast.success('Service métier supprimé avec succès');
      await fetchBusinessServices();
      return true;
    } catch (error) {
      console.error('Error deleting business service:', error);
      toast.error('Erreur lors de la suppression du service métier');
      return false;
    }
  };

  useEffect(() => {
    fetchBusinessServices();
  }, [user, userProfile]);

  return {
    businessServices,
    isLoading,
    fetchBusinessServices,
    createBusinessService,
    updateBusinessService,
    deleteBusinessService
  };
}