import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Organization {
  id: string;
  name: string;
  type: 'client' | 'esn' | 'msp';
  is_msp: boolean;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  organization_id: string;
}

export const useOrganizationsAndTeams = () => {
  return useQuery({
    queryKey: ['organizations-and-teams'],
    queryFn: async () => {
      // Récupérer toutes les organisations clientes
      const { data: organizations, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, type, is_msp')
        .eq('type', 'client')
        .order('name');

      if (orgError) throw orgError;

      // Récupérer toutes les équipes de ces organisations
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, description, organization_id')
        .in('organization_id', organizations?.map(org => org.id) || [])
        .order('name');

      if (teamsError) throw teamsError;

      return {
        organizations: organizations as Organization[],
        teams: teams as Team[]
      };
    },
  });
};