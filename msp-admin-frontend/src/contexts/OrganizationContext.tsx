import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useOrganizationsAndTeams, Organization, Team } from '@/hooks/useOrganizationsAndTeams';

interface OrganizationContextType {
  currentOrganization: Organization | null;
  currentTeam: Team | null;
  availableOrganizations: Organization[];
  availableTeams: Team[];
  setCurrentOrganization: (org: Organization | null) => void;
  setCurrentTeam: (team: Team | null) => void;
  loading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganizationContext = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganizationContext must be used within an OrganizationProvider');
  }
  return context;
};

interface OrganizationProviderProps {
  children: ReactNode;
}

const STORAGE_KEYS = {
  CURRENT_ORG: 'current_organization',
  CURRENT_TEAM: 'current_team'
};

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const { userProfile } = useAuth();
  const { data, isLoading } = useOrganizationsAndTeams();
  
  const [currentOrganization, setCurrentOrganizationState] = useState<Organization | null>(null);
  const [currentTeam, setCurrentTeamState] = useState<Team | null>(null);

  // Initialiser le contexte depuis localStorage ou profil par défaut
  useEffect(() => {
    if (!userProfile || isLoading || !data) return;

    const { organizations, teams } = data;

    // Charger depuis localStorage ou utiliser les valeurs par défaut du profil
    const savedOrgId = localStorage.getItem(STORAGE_KEYS.CURRENT_ORG);
    const savedTeamId = localStorage.getItem(STORAGE_KEYS.CURRENT_TEAM);

    let targetOrg: Organization | null = null;
    let targetTeam: Team | null = null;

    // Si admin MSP, peut accéder à toutes les organisations
    if (userProfile.is_msp_admin) {
      if (savedOrgId) {
        targetOrg = organizations.find(org => org.id === savedOrgId) || null;
      } else if (userProfile.default_organization_id) {
        targetOrg = organizations.find(org => org.id === userProfile.default_organization_id) || null;
      }
      
      if (savedTeamId) {
        targetTeam = teams.find(team => team.id === savedTeamId) || null;
      } else if (userProfile.default_team_id) {
        targetTeam = teams.find(team => team.id === userProfile.default_team_id) || null;
      }
    } else {
      // Pour les utilisateurs non-admin, utiliser seulement leurs organisations/équipes accessibles
      if (savedOrgId) {
        targetOrg = organizations.find(org => org.id === savedOrgId) || null;
      }
      
      if (savedTeamId) {
        targetTeam = teams.find(team => team.id === savedTeamId) || null;
      }

      // Si aucune organisation/équipe trouvée, prendre la première disponible
      if (!targetOrg && organizations.length > 0) {
        targetOrg = organizations[0];
      }
      
      if (!targetTeam && teams.length > 0) {
        // Prendre la première équipe de l'organisation courante si possible
        if (targetOrg) {
          targetTeam = teams.find(team => team.organization_id === targetOrg.id) || teams[0];
        } else {
          targetTeam = teams[0];
        }
      }
    }

    setCurrentOrganizationState(targetOrg);
    setCurrentTeamState(targetTeam);
    
    console.log('Session context initialized:', {
      organization: targetOrg?.name,
      team: targetTeam?.name,
      isMspAdmin: userProfile.is_msp_admin
    });
  }, [userProfile, data, isLoading]);

  const setCurrentOrganization = (org: Organization | null) => {
    setCurrentOrganizationState(org);
    if (org) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_ORG, org.id);
      
      // Si on change d'organisation, réinitialiser l'équipe si elle n'appartient pas à cette organisation
      if (currentTeam && data?.teams) {
        const teamBelongsToOrg = data.teams.find(
          team => team.id === currentTeam.id && team.organization_id === org.id
        );
        
        if (!teamBelongsToOrg) {
          // Prendre la première équipe de cette organisation
          const firstTeamInOrg = data.teams.find(team => team.organization_id === org.id);
          setCurrentTeam(firstTeamInOrg || null);
        }
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_ORG);
    }
  };

  const setCurrentTeam = (team: Team | null) => {
    setCurrentTeamState(team);
    if (team) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_TEAM, team.id);
      
      // Si on change d'équipe, s'assurer que l'organisation correspond
      if (data?.organizations && (!currentOrganization || currentOrganization.id !== team.organization_id)) {
        const teamOrg = data.organizations.find(org => org.id === team.organization_id);
        if (teamOrg) {
          setCurrentOrganizationState(teamOrg);
          localStorage.setItem(STORAGE_KEYS.CURRENT_ORG, teamOrg.id);
        }
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_TEAM);
    }
  };

  const value = {
    currentOrganization,
    currentTeam,
    availableOrganizations: data?.organizations || [],
    availableTeams: data?.teams || [],
    setCurrentOrganization,
    setCurrentTeam,
    loading: isLoading
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};