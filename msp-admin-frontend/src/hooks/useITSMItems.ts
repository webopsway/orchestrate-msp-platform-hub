import { useState, useEffect, useCallback, useMemo } from 'react';
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
  } | null;
  assigned_to_profile?: {
    email: string;
    first_name?: string;
    last_name?: string;
  } | null;
}

export interface ITSMFilters {
  type?: 'incident' | 'change' | 'request';
  status?: string;
  priority?: string;
  assigned_to?: string;
  created_by?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ITSMPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface UseITSMItemsReturn {
  items: ITSMItem[];
  loading: boolean;
  error: string | null;
  filters: ITSMFilters;
  pagination: ITSMPagination;
  setFilters: (filters: ITSMFilters) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  refresh: () => Promise<void>;
  getItemsByType: (type: 'incident' | 'change' | 'request') => ITSMItem[];
  getItemsByStatus: (status: string) => ITSMItem[];
  getItemsByPriority: (priority: string) => ITSMItem[];
  getAssignedItems: (userId: string) => ITSMItem[];
  getCreatedItems: (userId: string) => ITSMItem[];
  getFilteredItems: () => ITSMItem[];
  clearFilters: () => void;
}

export const useITSMItems = (
  initialPageSize: number = 10,
  enablePagination: boolean = true
): UseITSMItemsReturn => {
  const { user, userProfile } = useAuth();
  const [allItems, setAllItems] = useState<ITSMItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ITSMFilters>({});
  const [pagination, setPagination] = useState<ITSMPagination>({
    page: 1,
    pageSize: initialPageSize,
    total: 0,
    totalPages: 0
  });

  const fetchItems = useCallback(async () => {
    if (!user || !userProfile?.default_team_id) {
      setAllItems([]);
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
          created_by_profile:profiles!itsm_incidents_created_by_fkey(email, first_name, last_name),
          assigned_to_profile:profiles!itsm_incidents_assigned_to_fkey(email, first_name, last_name)
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
          requested_by_profile:profiles!itsm_change_requests_requested_by_fkey(email, first_name, last_name),
          approved_by_profile:profiles!itsm_change_requests_approved_by_fkey(email, first_name, last_name)
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
          requested_by_profile:profiles!itsm_service_requests_requested_by_fkey(email, first_name, last_name),
          assigned_to_profile:profiles!itsm_service_requests_assigned_to_fkey(email, first_name, last_name)
        `);

      if (!isMspAdmin) {
        requestsQuery = requestsQuery.eq('team_id', teamId);
      }

      const { data: requests, error: requestsError } = await requestsQuery;

      if (requestsError) throw requestsError;

      // Formater et combiner les données avec gestion des erreurs de types
      const formattedIncidents = (incidents || []).map((item: any) => ({
        ...item,
        type: 'incident' as const,
        created_by_profile: item.created_by_profile || null,
        assigned_to_profile: item.assigned_to_profile || null
      }));

      const formattedChanges = (changes || []).map((item: any) => ({
        ...item,
        type: 'change' as const,
        created_by_profile: item.requested_by_profile || null,
        assigned_to_profile: item.approved_by_profile || null
      }));

      const formattedRequests = (requests || []).map((item: any) => ({
        ...item,
        type: 'request' as const,
        created_by_profile: item.requested_by_profile || null,
        assigned_to_profile: item.assigned_to_profile || null
      }));

      const allItems = [...formattedIncidents, ...formattedChanges, ...formattedRequests] as ITSMItem[];
      setAllItems(allItems);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des éléments ITSM';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching ITSM items:', err);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile]);

  // Appliquer les filtres avec mémorisation
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

      // Filtre par date
      if (filters.dateFrom) {
        const itemDate = new Date(item.created_at);
        const fromDate = new Date(filters.dateFrom);
        if (itemDate < fromDate) return false;
      }

      if (filters.dateTo) {
        const itemDate = new Date(item.created_at);
        const toDate = new Date(filters.dateTo);
        if (itemDate > toDate) return false;
      }

      return true;
    });
  }, []);

  // Items filtrés avec mémorisation
  const filteredItems = useMemo(() => {
    return applyFilters(allItems, filters);
  }, [allItems, filters, applyFilters]);

  // Pagination avec mémorisation
  const paginatedItems = useMemo(() => {
    if (!enablePagination) return filteredItems;
    
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, pagination, enablePagination]);

  // Mettre à jour la pagination quand les filtres changent
  useEffect(() => {
    const total = filteredItems.length;
    const totalPages = Math.ceil(total / pagination.pageSize);
    
    setPagination(prev => ({
      ...prev,
      total,
      totalPages,
      page: prev.page > totalPages ? 1 : prev.page
    }));
  }, [filteredItems, pagination.pageSize]);

  // Fonctions utilitaires
  const getItemsByType = useCallback((type: 'incident' | 'change' | 'request'): ITSMItem[] => {
    return allItems.filter(item => item.type === type);
  }, [allItems]);

  const getItemsByStatus = useCallback((status: string): ITSMItem[] => {
    return allItems.filter(item => item.status === status);
  }, [allItems]);

  const getItemsByPriority = useCallback((priority: string): ITSMItem[] => {
    return allItems.filter(item => item.priority === priority);
  }, [allItems]);

  const getAssignedItems = useCallback((userId: string): ITSMItem[] => {
    return allItems.filter(item => item.assigned_to === userId);
  }, [allItems]);

  const getCreatedItems = useCallback((userId: string): ITSMItem[] => {
    return allItems.filter(item => item.created_by === userId);
  }, [allItems]);

  const getFilteredItems = useCallback(() => {
    return enablePagination ? paginatedItems : filteredItems;
  }, [enablePagination, paginatedItems, filteredItems]);

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setPagination(prev => ({ 
      ...prev, 
      pageSize, 
      page: 1,
      totalPages: Math.ceil(prev.total / pageSize)
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Effet pour charger les données
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    items: getFilteredItems(),
    loading,
    error,
    filters,
    pagination,
    setFilters,
    setPage,
    setPageSize,
    refresh: fetchItems,
    getItemsByType,
    getItemsByStatus,
    getItemsByPriority,
    getAssignedItems,
    getCreatedItems,
    getFilteredItems,
    clearFilters
  };
}; 