import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CloudEnvironment {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CloudEnvironmentFormData {
  name: string;
  display_name: string;
  description?: string;
  color: string;
  is_active: boolean;
}

export const useCloudEnvironments = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: environments, isLoading } = useQuery({
    queryKey: ['cloudEnvironments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cloud_environments')
        .select('*')
        .order('display_name');

      if (error) throw error;
      return data as CloudEnvironment[];
    },
  });

  const createEnvironment = useMutation({
    mutationFn: async (formData: CloudEnvironmentFormData) => {
      const { data, error } = await supabase
        .from('cloud_environments')
        .insert([formData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cloudEnvironments'] });
      toast({ 
        title: "Succès", 
        description: "Environnement cloud créé avec succès" 
      });
    },
    onError: (error) => {
      console.error('Error creating environment:', error);
      toast({ 
        title: "Erreur", 
        description: "Erreur lors de la création de l'environnement",
        variant: "destructive" 
      });
    },
  });

  const updateEnvironment = useMutation({
    mutationFn: async ({ id, ...formData }: CloudEnvironmentFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('cloud_environments')
        .update(formData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cloudEnvironments'] });
      toast({ 
        title: "Succès", 
        description: "Environnement cloud mis à jour avec succès" 
      });
    },
    onError: (error) => {
      console.error('Error updating environment:', error);
      toast({ 
        title: "Erreur", 
        description: "Erreur lors de la mise à jour de l'environnement",
        variant: "destructive" 
      });
    },
  });

  const deleteEnvironment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cloud_environments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cloudEnvironments'] });
      toast({ 
        title: "Succès", 
        description: "Environnement cloud supprimé" 
      });
    },
    onError: (error) => {
      console.error('Error deleting environment:', error);
      toast({ 
        title: "Erreur", 
        description: "Erreur lors de la suppression",
        variant: "destructive" 
      });
    },
  });

  return {
    environments,
    isLoading,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment
  };
};