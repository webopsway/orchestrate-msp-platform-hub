import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ITSMItem {
  id: string;
  type: 'incident' | 'change' | 'request';
  title: string;
  description?: string;
  priority: string;
  status: string;
  created_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  scheduled_date?: string;
  team_id: string;
  metadata?: any;
  
  // Relations avec les profils
  created_by_profile?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  assigned_to_profile?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export interface ITSMFilters {
  type?: 'incident' | 'change' | 'request';
  status?: string;
  priority?: string;
  assigned_to?: string;
  created_by?: string;
  search?: string;
}

export interface UseITSMItemsReturn {
  items: ITSMItem[];
  loading: boolean;
  error: string | null;
  filters: ITSMFilters;
  setFilters: (filters: ITSMFilters) => void;
  refresh: () => Promise<void>;
  getItemsByType: (type: 'incident' | 'change' | 'request') => ITSMItem[];
  getItemsByStatus: (status: string) => ITSMItem[];
  getItemsByPriority: (priority: string) => ITSMItem[];
  getAssignedItems: (userId: string) => ITSMItem[];
  getCreatedItems: (userId: string) => ITSMItem[];
}

export const useITSMItems = (): UseITSMItemsReturn => {
  const { user, userProfile } = useAuth();
  const [items, setItems] = useState<ITSMItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ITSMFilters>({});

  const fetchItems = useCallback(async () => {
    if (!user || !userProfile?.default_team_id) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const teamId = userProfile.default_team_id;
      const isMspAdmin = userProfile.is_msp_admin;

      // Récupérer les incidents
      let incidentsQuery = supabase
        .from('itsm_incidents')
        .select(`
          *,
          created_by_profile:created_by(email, first_name, last_name),
          assigned_to_profile:assigned_to(email, first_name, last_name)
        `);

      if (!isMspAdmin) {
        incidentsQuery = incidentsQuery.eq('team_id', teamId);
      }

      const { data: incidents, error: incidentsError } = await incidentsQuery;

      if (incidentsError) throw incidentsError;

      // Récupérer les changements
      let changesQuery = supabase
        .from('itsm_change_requests')
        .select(`
          *,
          requested_by_profile:requested_by(email, first_name, last_name),
          approved_by_profile:approved_by(email, first_name, last_name)
        `);

      if (!isMspAdmin) {
        changesQuery = changesQuery.eq('team_id', teamId);
      }

      const { data: changes, error: changesError } = await changesQuery;

      if (changesError) throw changesError;

      // Récupérer les demandes de service
      let requestsQuery = supabase
        .from('itsm_service_requests')
        .select(`
          *,
          requested_by_profile:requested_by(email, first_name, last_name),
          assigned_to_profile:assigned_to(email, first_name, last_name)
        `);

      if (!isMspAdmin) {
        requestsQuery = requestsQuery.eq('team_id', teamId);
      }

      const { data: requests, error: requestsError } = await requestsQuery;

      if (requestsError) throw requestsError;

      // Formater et combiner les données
      const formattedIncidents = (incidents || []).map(item => ({
        ...item,
        type: 'incident' as const,
        created_by_profile: item.created_by_profile,
        assigned_to_profile: item.assigned_to_profile
      }));

      const formattedChanges = (changes || []).map(item => ({
        ...item,
        type: 'change' as const,
        created_by_profile: item.requested_by_profile,
        assigned_to_profile: item.approved_by_profile
      }));

      const formattedRequests = (requests || []).map(item => ({
        ...item,
        type: 'request' as const,
        created_by_profile: item.requested_by_profile,
        assigned_to_profile: item.assigned_to_profile
      }));

      const allItems = [...formattedIncidents, ...formattedChanges, ...formattedRequests];
      setItems(allItems);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des éléments ITSM';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching ITSM items:', err);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile]);

  // Appliquer les filtres
  const applyFilters = useCallback((items: ITSMItem[], filters: ITSMFilters): ITSMItem[] => {
    return items.filter(item => {
      // Filtre par type
      if (filters.type && item.type !== filters.type) return false;

      // Filtre par statut
      if (filters.status && item.status !== filters.status) return false;

      // Filtre par priorité
      if (filters.priority && item.priority !== filters.priority) return false;

      // Filtre par assigné
      if (filters.assigned_to && item.assigned_to !== filters.assigned_to) return false;

      // Filtre par créateur
      if (filters.created_by && item.created_by !== filters.created_by) return false;

      // Filtre par recherche
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(searchLower);
        const matchesDescription = item.description?.toLowerCase().includes(searchLower);
        const matchesCreator = item.created_by_profile?.email.toLowerCase().includes(searchLower) ||
                              item.created_by_profile?.first_name?.toLowerCase().includes(searchLower) ||
                              item.created_by_profile?.last_name?.toLowerCase().includes(searchLower);
        
        if (!matchesTitle && !matchesDescription && !matchesCreator) return false;
      }

      return true;
    });
  }, []);

  // Fonctions utilitaires
  const getItemsByType = useCallback((type: 'incident' | 'change' | 'request'): ITSMItem[] => {
    return items.filter(item => item.type === type);
  }, [items]);

  const getItemsByStatus = useCallback((status: string): ITSMItem[] => {
    return items.filter(item => item.status === status);
  }, [items]);

  const getItemsByPriority = useCallback((priority: string): ITSMItem[] => {
    return items.filter(item => item.priority === priority);
  }, [items]);

  const getAssignedItems = useCallback((userId: string): ITSMItem[] => {
    return items.filter(item => item.assigned_to === userId);
  }, [items]);

  const getCreatedItems = useCallback((userId: string): ITSMItem[] => {
    return items.filter(item => item.created_by === userId);
  }, [items]);

  // Effet pour charger les données
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Données filtrées
  const filteredItems = applyFilters(items, filters);

  return {
    items: filteredItems,
    loading,
    error,
    filters,
    setFilters,
    refresh: fetchItems,
    getItemsByType,
    getItemsByStatus,
    getItemsByPriority,
    getAssignedItems,
    getCreatedItems
  };
}; 