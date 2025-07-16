import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

export type CloudAccount = Database['public']['Tables']['cloud_accounts']['Row'];
export type CloudAccountProfile = Database['public']['Tables']['cloud_account_profiles']['Row'];
export type CloudProvider = Database['public']['Tables']['cloud_providers']['Row'];
export type Organization = Database['public']['Tables']['organizations']['Row'];
export type Team = Database['public']['Tables']['teams']['Row'];

export interface CloudAccountWithDetails extends CloudAccount {
  cloud_providers?: CloudProvider;
  organizations?: Organization;
  teams?: Team;
  profiles?: CloudAccountProfile[];
}

export interface CloudAccountFormData {
  name: string;
  description?: string;
  provider_id: string;
  team_id: string;
  client_organization_id: string;
  account_identifier: string;
  region?: string;
  environment: string[];
}

export const useCloudAccounts = () => {
  const { userProfile } = useAuth();
  const [accounts, setAccounts] = useState<CloudAccountWithDetails[]>([]);
  const [providers, setProviders] = useState<CloudProvider[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);

  // Récupérer les données
  const fetchData = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);

      // Récupérer les providers
      const { data: providersData, error: providersError } = await supabase
        .from('cloud_providers')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (providersError) throw providersError;
      setProviders(providersData || []);

      // Récupérer les organisations (pour les admins MSP)
      if (userProfile.is_msp_admin) {
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('*')
          .order('name');

        if (orgsError) throw orgsError;
        setOrganizations(orgsData || []);

        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .order('name');

        if (teamsError) throw teamsError;
        setTeams(teamsData || []);
      }

      // Récupérer les comptes cloud
      const { data: accountsData, error: accountsError } = await supabase
        .from('cloud_accounts')
        .select(`
          *,
          cloud_providers(*),
          organizations(*),
          teams(*),
          cloud_account_profiles(*)
        `)
        .order('created_at', { ascending: false });

      if (accountsError) throw accountsError;
      setAccounts(accountsData as CloudAccountWithDetails[] || []);

    } catch (error) {
      console.error('Error fetching cloud accounts data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Créer un compte cloud (MSP admin seulement)
  const createAccount = async (data: CloudAccountFormData) => {
    if (!userProfile?.is_msp_admin) {
      toast.error('Seuls les admins MSP peuvent créer des comptes');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('cloud_accounts')
        .insert({
          ...data,
          created_by: userProfile.id,
          metadata: {}
        });

      if (error) throw error;

      toast.success('Compte cloud créé avec succès');
      await fetchData();
    } catch (error) {
      console.error('Error creating cloud account:', error);
      toast.error('Erreur lors de la création du compte');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour un compte cloud
  const updateAccount = async (id: string, data: Partial<CloudAccountFormData>) => {
    if (!userProfile?.is_msp_admin) {
      toast.error('Seuls les admins MSP peuvent modifier les comptes');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('cloud_accounts')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast.success('Compte cloud mis à jour');
      await fetchData();
    } catch (error) {
      console.error('Error updating cloud account:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un compte cloud
  const deleteAccount = async (id: string) => {
    if (!userProfile?.is_msp_admin) {
      toast.error('Seuls les admins MSP peuvent supprimer les comptes');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('cloud_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Compte cloud supprimé');
      await fetchData();
    } catch (error) {
      console.error('Error deleting cloud account:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Assigner un utilisateur à un compte
  const assignUserToAccount = async (
    accountId: string, 
    userId: string, 
    role: 'viewer' | 'operator' | 'admin',
    expiresAt?: string
  ) => {
    if (!userProfile?.is_msp_admin) {
      toast.error('Seuls les admins MSP peuvent assigner des utilisateurs');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('cloud_account_profiles')
        .upsert({
          account_id: accountId,
          user_id: userId,
          role,
          granted_by: userProfile.id,
          expires_at: expiresAt || null,
          metadata: {}
        }, {
          onConflict: 'account_id,user_id'
        });

      if (error) throw error;

      toast.success('Utilisateur assigné au compte');
      await fetchData();
    } catch (error) {
      console.error('Error assigning user to account:', error);
      toast.error('Erreur lors de l\'assignation');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Retirer un utilisateur d'un compte
  const removeUserFromAccount = async (accountId: string, userId: string) => {
    if (!userProfile?.is_msp_admin) {
      toast.error('Seuls les admins MSP peuvent retirer des utilisateurs');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('cloud_account_profiles')
        .delete()
        .eq('account_id', accountId)
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Utilisateur retiré du compte');
      await fetchData();
    } catch (error) {
      console.error('Error removing user from account:', error);
      toast.error('Erreur lors du retrait');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage
  useEffect(() => {
    fetchData();
  }, [userProfile]);

  return {
    accounts,
    providers,
    organizations,
    teams,
    loading,
    createAccount,
    updateAccount,
    deleteAccount,
    assignUserToAccount,
    removeUserFromAccount,
    refetch: fetchData
  };
};