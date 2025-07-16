import React from 'react';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Building2, Users, ChevronDown, Settings, AlertTriangle } from 'lucide-react';
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

  // Pour les admins MSP : outil de debug/simulation
  if (userProfile.is_msp_admin) {
    const isInSimulationMode = currentOrganization && !currentOrganization.is_msp;
    
    return (
      <div className="border-t mt-auto">
        <div className="p-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant={isInSimulationMode ? "destructive" : "ghost"}
                className="w-full justify-between px-3 py-2 h-auto text-left font-normal"
                size="sm"
              >
                <div className="flex flex-col items-start space-y-1 min-w-0 flex-1">
                  {isInSimulationMode ? (
                    <>
                      <div className="flex items-center space-x-1 text-xs font-medium text-destructive-foreground">
                        <AlertTriangle className="h-3 w-3" />
                        <span>MODE SIMULATION</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs opacity-90">
                        <Building2 className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{currentOrganization.name}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-1 text-xs text-blue-600 font-medium">
                        <Settings className="h-3 w-3" />
                        <span>Outil Debug MSP</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Contexte normal
                      </div>
                    </>
                  )}
                </div>
                <ChevronDown className="h-3 w-3 opacity-50 flex-shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Mode Simulation</Label>
                    {isInSimulationMode && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const mspOrg = availableOrganizations.find(org => org.is_msp);
                          setCurrentOrganization(mspOrg || null);
                        }}
                        className="h-6 text-xs"
                      >
                        Revenir au mode normal
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Simulez l'expérience d'un utilisateur client pour tester les permissions et les vues.
                  </p>
                  
                  <Select
                    value={currentOrganization?.id || ''}
                    onValueChange={(orgId) => {
                      const org = availableOrganizations.find(o => o.id === orgId);
                      setCurrentOrganization(org || null);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner une organisation à simuler" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Organisation MSP en premier */}
                      {availableOrganizations.filter(org => org.is_msp).map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 text-blue-600" />
                            <span>{org.name}</span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">MSP</span>
                          </div>
                        </SelectItem>
                      ))}
                      
                      {/* Séparateur */}
                      {availableOrganizations.filter(org => !org.is_msp).length > 0 && (
                        <div className="border-t my-1" />
                      )}
                      
                      {/* Organisations clientes */}
                      {availableOrganizations.filter(org => !org.is_msp).map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4" />
                            <span>{org.name}</span>
                            <span className="text-xs bg-orange-100 text-orange-700 px-1 rounded">Client</span>
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
                      const team = teamsForCurrentOrg.find(t => t.id === teamId);
                      setCurrentTeam(team || null);
                    }}
                    disabled={!currentOrganization}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner une équipe" />
                    </SelectTrigger>
                    <SelectContent>
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

                <div className="pt-2 border-t space-y-2">
                  <div className="flex items-center space-x-2 text-xs text-blue-600">
                    <Settings className="h-3 w-3" />
                    <span>Outil de Debug MSP</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Utilisez cet outil pour tester l'expérience utilisateur et vérifier les permissions RLS.
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    );
  }

  // Affichage en lecture seule pour les utilisateurs normaux
  return (
    <div className="border-t mt-auto p-4">
      <div className="flex flex-col items-start space-y-1">
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