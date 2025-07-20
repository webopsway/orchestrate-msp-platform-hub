import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIncidents } from './useIncidents';
import { useUsers } from './useUsers';
import { useOrganizations } from './useOrganizationsCore';
import { useCloudAssetManagement } from './useCloudAssetManagement';

export interface DashboardStats {
  organizations: number;
  users: number;
  incidents: number;
  services: number;
}

export const useDashboardStats = () => {
  const { user, userProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    organizations: 0,
    users: 0,
    incidents: 0,
    services: 0
  });
  const [loading, setLoading] = useState(true);

  // Utiliser les hooks existants pour récupérer les données
  const { incidents } = useIncidents();
  const { users } = useUsers();
  const { organizations } = useOrganizations();
  const { configurations } = useCloudAssetManagement();

  const calculateStats = useCallback(() => {
    if (!user) {
      setStats({
        organizations: 0,
        users: 0,
        incidents: 0,
        services: 0
      });
      setLoading(false);
      return;
    }

    // Calculer les statistiques basées sur les données disponibles
    const activeIncidents = incidents.filter(incident => 
      incident.status !== 'resolved' && incident.status !== 'closed'
    );

    const activeUsers = users.filter(user => 
      user.metadata?.status === 'active'
    );

    const activeOrganizations = organizations.filter(org => 
      org.status === 'active'
    );

    const activeServices = configurations.filter(config => 
      config.collected_at // Utiliser la date de collecte comme indicateur d'activité
    );

    setStats({
      organizations: activeOrganizations.length,
      users: activeUsers.length,
      incidents: activeIncidents.length,
      services: activeServices.length
    });
    setLoading(false);
  }, [user, incidents, users, organizations, configurations]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  return {
    stats,
    loading
  };
}; 