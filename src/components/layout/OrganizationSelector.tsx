import React from 'react';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Building2, Users, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function OrganizationSelector() {
  const { userProfile } = useAuth();
  const {
    currentOrganization,
    currentTeam,
    availableOrganizations,
    availableTeams,
    setCurrentOrganization,
    setCurrentTeam,
    loading
  } = useOrganizationContext();

  if (loading || !userProfile) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2">
        <div className="animate-pulse flex items-center space-x-2">
          <div className="h-4 w-4 bg-muted rounded"></div>
          <div className="h-3 w-16 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  // Filtrer les équipes par organisation courante
  const teamsForCurrentOrg = currentOrganization 
    ? availableTeams.filter(team => team.organization_id === currentOrganization.id)
    : availableTeams;

  // Affichage en lecture seule pour les utilisateurs non-MSP
  if (!userProfile.is_msp_admin) {
    return (
      <div className="w-full px-3 py-2 text-left">
        <div className="flex flex-col items-start space-y-1 min-w-0 flex-1">
          {currentOrganization && (
            <div className="flex items-center space-x-1 text-xs text-muted-foreground truncate w-full">
              <Building2 className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{currentOrganization.name}</span>
            </div>
          )}
          {currentTeam && (
            <div className="flex items-center space-x-1 text-xs font-medium truncate w-full">
              <Users className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{currentTeam.name}</span>
            </div>
          )}
          {!currentOrganization && !currentTeam && (
            <span className="text-xs text-muted-foreground">Aucun contexte</span>
          )}
        </div>
      </div>
    );
  }

  // Affichage complet avec sélecteur pour les admins MSP

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-between px-3 py-2 h-auto text-left font-normal"
        >
          <div className="flex flex-col items-start space-y-1 min-w-0 flex-1">
            {currentOrganization && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground truncate w-full">
                <Building2 className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{currentOrganization.name}</span>
              </div>
            )}
            {currentTeam && (
              <div className="flex items-center space-x-1 text-xs font-medium truncate w-full">
                <Users className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{currentTeam.name}</span>
              </div>
            )}
            {!currentOrganization && !currentTeam && (
              <span className="text-xs text-muted-foreground">Sélectionner un contexte</span>
            )}
          </div>
          <ChevronDown className="h-3 w-3 opacity-50 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Organisation</Label>
            <Select
              value={currentOrganization?.id || ''}
              onValueChange={(orgId) => {
                if (orgId === '__msp_context__') {
                  // Revenir au contexte MSP par défaut
                  const mspOrg = availableOrganizations.find(org => org.is_msp);
                  setCurrentOrganization(mspOrg || null);
                } else {
                  const org = availableOrganizations.find(o => o.id === orgId);
                  setCurrentOrganization(org || null);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner une organisation" />
              </SelectTrigger>
                <SelectContent>
                  {/* Option pour revenir au contexte MSP */}
                  <SelectItem value="__msp_context__">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Mon Organisation MSP</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">MSP</span>
                    </div>
                  </SelectItem>
                  {availableOrganizations.length > 0 && (
                    <div className="border-t my-1" />
                  )}
                  {availableOrganizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4" />
                        <span>{org.name}</span>
                        {org.is_msp && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">MSP</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Équipe</Label>
            <Select
              value={currentTeam?.id || ''}
              onValueChange={(teamId) => {
                if (teamId === '__msp_team__') {
                  // Revenir à l'équipe MSP par défaut
                  const mspTeams = teamsForCurrentOrg.filter(team => {
                    const teamOrg = availableOrganizations.find(org => org.id === team.organization_id);
                    return teamOrg?.is_msp;
                  });
                  setCurrentTeam(mspTeams[0] || null);
                } else {
                  const team = teamsForCurrentOrg.find(t => t.id === teamId);
                  setCurrentTeam(team || null);
                }
              }}
              disabled={!currentOrganization}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner une équipe" />
              </SelectTrigger>
              <SelectContent>
                {/* Option pour revenir à l'équipe MSP si dans une org MSP */}
                {currentOrganization?.is_msp && teamsForCurrentOrg.length > 0 && (
                  <>
                    <SelectItem value="__msp_team__">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Mon Équipe MSP</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">MSP</span>
                      </div>
                    </SelectItem>
                    <div className="border-t my-1" />
                  </>
                )}
                {teamsForCurrentOrg.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>{team.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!currentOrganization && (
              <p className="text-xs text-muted-foreground">
                Sélectionnez d'abord une organisation
              </p>
            )}
          </div>

          {userProfile.is_msp_admin && (
            <div className="pt-2 border-t space-y-2">
              <div className="flex items-center space-x-2 text-xs text-blue-600">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>Mode Administrateur MSP</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Utilisez "Mon Organisation MSP" pour revenir à votre contexte par défaut
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}