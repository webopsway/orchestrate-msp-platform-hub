import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook personnalisé qui retourne le contexte actuel (organisation et équipe)
 * à utiliser dans les autres hooks pour filtrer les données
 */
export const useCurrentContext = () => {
  const { userProfile } = useAuth();
  const { currentOrganization, currentTeam, loading } = useOrganizationContext();

  return {
    currentOrganization,
    currentTeam,
    currentOrganizationId: currentOrganization?.id || null,
    currentTeamId: currentTeam?.id || null,
    isMspAdmin: userProfile?.is_msp_admin || false,
    loading,
    hasContext: !loading && (currentOrganization || currentTeam)
  };
};