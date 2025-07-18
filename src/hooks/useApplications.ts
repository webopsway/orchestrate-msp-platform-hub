import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Application, CreateApplicationData } from '@/types/application';

export function useApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, userProfile } = useAuth();

  const fetchApplications = async () => {
    if (!user || !userProfile) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      // Les filtres RLS géreront l'accès aux données

      if (error) {
        console.error('Error fetching applications:', error);
        toast.error('Erreur lors du chargement des applications');
        return;
      }

      setApplications(data as Application[] || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Erreur lors du chargement des applications');
    } finally {
      setIsLoading(false);
    }
  };

  const createApplication = async (data: CreateApplicationData): Promise<boolean> => {
    if (!user || !userProfile?.default_team_id) {
      toast.error('Utilisateur non authentifié ou équipe non définie');
      return false;
    }

    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          ...data,
          team_id: userProfile.default_team_id,
          created_by: user.id
        });

      if (error) {
        console.error('Error creating application:', error);
        toast.error('Erreur lors de la création de l\'application');
        return false;
      }

      toast.success('Application créée avec succès');
      await fetchApplications();
      return true;
    } catch (error) {
      console.error('Error creating application:', error);
      toast.error('Erreur lors de la création de l\'application');
      return false;
    }
  };

  const updateApplication = async (id: string, data: Partial<CreateApplicationData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('applications')
        .update(data)
        .eq('id', id);

      if (error) {
        console.error('Error updating application:', error);
        toast.error('Erreur lors de la mise à jour de l\'application');
        return false;
      }

      toast.success('Application mise à jour avec succès');
      await fetchApplications();
      return true;
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Erreur lors de la mise à jour de l\'application');
      return false;
    }
  };

  const deleteApplication = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting application:', error);
        toast.error('Erreur lors de la suppression de l\'application');
        return false;
      }

      toast.success('Application supprimée avec succès');
      await fetchApplications();
      return true;
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Erreur lors de la suppression de l\'application');
      return false;
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [user, userProfile]);

  return {
    applications,
    isLoading,
    fetchApplications,
    createApplication,
    updateApplication,
    deleteApplication
  };
}