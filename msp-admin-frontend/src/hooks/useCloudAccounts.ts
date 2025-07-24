import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export type CloudAccount = Database['public']['Tables']['cloud_accounts']['Row'];
export type CloudProvider = Database['public']['Tables']['cloud_providers']['Row'];
export type Organization = Database['public']['Tables']['organizations']['Row'];
export type Team = Database['public']['Tables']['teams']['Row'];

export interface CloudEnvironment {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  color: string;
  is_active: boolean;
}

export interface CloudAccountWithDetails extends CloudAccount {
  cloud_providers?: CloudProvider;
  organizations?: Organization;
  teams?: Team;
  environments?: CloudEnvironment[];
}

export interface CloudAccountFormData {
  name: string;
  description?: string;
  provider_id: string;
  team_id: string;
  client_organization_id: string;
  account_identifier: string;
  region?: string;
  environment_ids: string[];
}

export const useCloudAccounts = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: cloudAccounts, isLoading } = useQuery({
    queryKey: ['cloudAccounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cloud_accounts')
        .select(`
          *,
          cloud_providers!inner(id, name, display_name, api_endpoint, created_at, is_active, metadata, updated_at),
          teams!inner(name, organization_id),
          organizations!cloud_accounts_client_organization_id_fkey(name),
          cloud_account_environments!inner(
            cloud_environments!inner(id, name, display_name, color)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to include environments array
      const transformedData = data?.map(account => ({
        ...account,
        environments: account.cloud_account_environments?.map(cae => cae.cloud_environments).filter(Boolean) || []
      })) as unknown as CloudAccountWithDetails[];
      
      return transformedData;
    },
  });

  const { data: environments } = useQuery({
    queryKey: ['cloudEnvironments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cloud_environments')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;
      return data as CloudEnvironment[];
    },
  });

  const { data: providers } = useQuery({
    queryKey: ['cloudProviders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cloud_providers')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;
      return data as CloudProvider[];
    },
  });

  const { data: organizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Organization[];
    },
  });

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Team[];
    },
  });

  const createCloudAccount = useMutation({
    mutationFn: async (formData: CloudAccountFormData) => {
      // Créer le compte cloud
      const { data: account, error: accountError } = await supabase
        .from('cloud_accounts')
        .insert([{
          name: formData.name,
          description: formData.description,
          provider_id: formData.provider_id,
          team_id: formData.team_id,
          client_organization_id: formData.client_organization_id,
          account_identifier: formData.account_identifier,
          region: formData.region,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (accountError) throw accountError;

      // Créer les liaisons avec les environnements
      if (formData.environment_ids?.length > 0) {
        const { error: envError } = await supabase
          .from('cloud_account_environments')
          .insert(
            formData.environment_ids.map(envId => ({
              cloud_account_id: account.id,
              cloud_environment_id: envId
            }))
          );

        if (envError) throw envError;
      }

      return account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cloudAccounts'] });
      toast({ 
        title: "Succès", 
        description: "Compte cloud créé avec succès" 
      });
    },
    onError: (error) => {
      console.error('Error creating cloud account:', error);
      toast({ 
        title: "Erreur", 
        description: "Erreur lors de la création du compte cloud",
        variant: "destructive" 
      });
    },
  });

  const updateCloudAccount = useMutation({
    mutationFn: async ({ id, ...formData }: CloudAccountFormData & { id: string }) => {
      // Mettre à jour le compte cloud
      const { data: account, error: accountError } = await supabase
        .from('cloud_accounts')
        .update({
          name: formData.name,
          description: formData.description,
          provider_id: formData.provider_id,
          team_id: formData.team_id,
          client_organization_id: formData.client_organization_id,
          account_identifier: formData.account_identifier,
          region: formData.region
        })
        .eq('id', id)
        .select()
        .single();

      if (accountError) throw accountError;

      // Supprimer les anciennes liaisons d'environnements
      const { error: deleteError } = await supabase
        .from('cloud_account_environments')
        .delete()
        .eq('cloud_account_id', id);

      if (deleteError) throw deleteError;

      // Créer les nouvelles liaisons avec les environnements
      if (formData.environment_ids?.length > 0) {
        const { error: envError } = await supabase
          .from('cloud_account_environments')
          .insert(
            formData.environment_ids.map(envId => ({
              cloud_account_id: id,
              cloud_environment_id: envId
            }))
          );

        if (envError) throw envError;
      }

      return account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cloudAccounts'] });
      toast({ 
        title: "Succès", 
        description: "Compte cloud mis à jour avec succès" 
      });
    },
    onError: (error) => {
      console.error('Error updating cloud account:', error);
      toast({ 
        title: "Erreur", 
        description: "Erreur lors de la mise à jour du compte cloud",
        variant: "destructive" 
      });
    },
  });

  const deleteCloudAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cloud_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cloudAccounts'] });
      toast({ 
        title: "Succès", 
        description: "Compte cloud supprimé" 
      });
    },
    onError: (error) => {
      console.error('Error deleting cloud account:', error);
      toast({ 
        title: "Erreur", 
        description: "Erreur lors de la suppression",
        variant: "destructive" 
      });
    },
  });

  return {
    cloudAccounts,
    providers,
    organizations,
    teams,
    environments,
    isLoading,
    createCloudAccount,
    updateCloudAccount,
    deleteCloudAccount
  };
};