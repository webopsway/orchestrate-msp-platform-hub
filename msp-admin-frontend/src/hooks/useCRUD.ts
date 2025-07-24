import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseCRUDOptions<T> {
  table: string;
  teamId?: string;
  defaultFilters?: Record<string, any>;
  defaultSort?: { column: string; direction: 'asc' | 'desc' };
  transformData?: (data: any) => T;
  onError?: (error: any) => void;
}

interface UseCRUDReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  searchTerm: string;
  filters: Record<string, any>;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  
  // Actions
  fetchData: () => Promise<void>;
  createItem: (item: Partial<T>) => Promise<T | null>;
  updateItem: (id: string, updates: Partial<T>) => Promise<T | null>;
  deleteItem: (id: string) => Promise<boolean>;
  bulkDelete: (ids: string[]) => Promise<boolean>;
  
  // Pagination et filtres
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSearchTerm: (term: string) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSort: (column: string, direction: 'asc' | 'desc') => void;
  resetFilters: () => void;
  
  // Utilitaires
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function useCRUD<T = any>({
  table,
  teamId,
  defaultFilters = {},
  defaultSort = { column: 'created_at', direction: 'desc' as const },
  transformData,
  onError
}: UseCRUDOptions<T>): UseCRUDReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(10);
  const [searchTerm, setSearchTermState] = useState("");
  const [filters, setFiltersState] = useState<Record<string, any>>(defaultFilters);
  const [sortColumn, setSortColumn] = useState(defaultSort.column);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSort.direction);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from(table as any)
        .select('*', { count: 'exact' });

      // Appliquer le filtre d'équipe si spécifié
      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      // Appliquer les filtres par défaut
      Object.entries(defaultFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      // Appliquer les filtres dynamiques
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'string' && value.includes('%')) {
            query = query.ilike(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      // Appliquer la recherche
      if (searchTerm) {
        // Recherche dans les colonnes textuelles communes
        const searchColumns = ['name', 'title', 'description', 'email'];
        const searchConditions = searchColumns.map(col => `${col}.ilike.%${searchTerm}%`);
        query = query.or(searchConditions.join(','));
      }

      // Appliquer le tri
      query = query.order(sortColumn, { ascending: sortDirection === 'asc' });

      // Appliquer la pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: result, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      const transformedData = transformData ? result?.map(transformData) : result;
      setData((transformedData || []) as T[]);
      setTotalCount(count || 0);
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du chargement des données';
      setError(errorMessage);
      if (onError) {
        onError(err);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [table, teamId, defaultFilters, filters, searchTerm, sortColumn, sortDirection, currentPage, pageSize, transformData, onError]);

  const createItem = useCallback(async (item: Partial<T>): Promise<T | null> => {
    try {
      setError(null);
      
      const { data: result, error: createError } = await supabase
        .from(table as any)
        .insert([item as any])
        .select()
        .single();

      if (createError) throw createError;

      const transformedItem = transformData ? transformData(result) : result;
      
      // Mettre à jour les données locales
      setData(prev => [transformedItem as T, ...prev]);
      setTotalCount(prev => prev + 1);
      
      toast.success('Élément créé avec succès');
      return transformedItem as T;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la création';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    }
  }, [table, transformData]);

  const updateItem = useCallback(async (id: string, updates: Partial<T>): Promise<T | null> => {
    try {
      setError(null);
      
      const { data: result, error: updateError } = await supabase
        .from(table as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      const transformedItem = transformData ? transformData(result) : result;
      
      // Mettre à jour les données locales
      setData(prev => prev.map(item => 
        (item as any).id === id ? transformedItem as T : item
      ));
      
      toast.success('Élément mis à jour avec succès');
      return transformedItem as T;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la mise à jour';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    }
  }, [table, transformData]);

  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from(table as any)
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Mettre à jour les données locales
      setData(prev => prev.filter(item => (item as any).id !== id));
      setTotalCount(prev => prev - 1);
      
      toast.success('Élément supprimé avec succès');
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la suppression';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, [table]);

  const bulkDelete = useCallback(async (ids: string[]): Promise<boolean> => {
    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from(table as any)
        .delete()
        .in('id', ids);

      if (deleteError) throw deleteError;

      // Mettre à jour les données locales
      setData(prev => prev.filter(item => !ids.includes((item as any).id)));
      setTotalCount(prev => prev - ids.length);
      
      toast.success(`${ids.length} élément(s) supprimé(s) avec succès`);
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la suppression en masse';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, [table]);

  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1); // Retour à la première page
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
    setCurrentPage(1); // Retour à la première page
  }, []);

  const setFilters = useCallback((newFilters: Record<string, any>) => {
    setFiltersState(newFilters);
    setCurrentPage(1); // Retour à la première page
  }, []);

  const setSort = useCallback((column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    setSearchTermState("");
    setSortColumn(defaultSort.column);
    setSortDirection(defaultSort.direction);
    setCurrentPage(1);
  }, [defaultFilters, defaultSort]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Charger les données au montage et quand les dépendances changent
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    totalCount,
    currentPage,
    pageSize,
    searchTerm,
    filters,
    sortColumn,
    sortDirection,
    
    // Actions
    fetchData,
    createItem,
    updateItem,
    deleteItem,
    bulkDelete,
    
    // Pagination et filtres
    setPage,
    setPageSize,
    setSearchTerm,
    setFilters,
    setSort,
    resetFilters,
    
    // Utilitaires
    refresh,
    clearError
  };
}

// Hook spécialisé pour les profiles
export function useUsers(teamId?: string) {
  return useCRUD({
    table: 'profiles',
    teamId,
    defaultFilters: {},
    defaultSort: { column: 'created_at', direction: 'desc' },
    transformData: (user) => ({
      ...user,
      fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      statusColor: user.is_msp_admin ? 'blue' : 'green'
    })
  });
}

// Hook spécialisé pour les rôles
export function useRoles(teamId?: string) {
  return useCRUD({
    table: 'roles',
    teamId,
    defaultFilters: {},
    defaultSort: { column: 'created_at', direction: 'desc' },
    transformData: (role) => ({
      ...role,
      permissionCount: 0 // Will be populated from role_permissions join
    })
  });
}

// Hook spécialisé pour les organisations
export function useOrganizations(mspId?: string) {
  return useCRUD({
    table: 'organizations',
    teamId: mspId,
    defaultFilters: {},
    defaultSort: { column: 'created_at', direction: 'desc' },
    transformData: (org) => ({
      ...org,
      fullAddress: org.metadata?.address ? 
        `${org.metadata.address.street || ''} ${org.metadata.address.postal_code || ''} ${org.metadata.address.city || ''} ${org.metadata.address.country || ''}`.trim() : 
        ''
    })
  });
}