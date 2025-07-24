// STUB TEMPORAIRE - Sera remplacé par des appels directs à l'API Backend
console.warn('⚠️  ATTENTION: Utilisation du stub Supabase temporaire. Migration vers API Backend en cours...');


// Stub minimal pour éviter les erreurs de compilation
const mockSupabaseClient = {
  from: (table: string) => ({
    select: (query?: string) => ({
      data: [],
      error: null,
      eq: () => ({ data: [], error: null }),
      single: () => ({ data: null, error: null }),
      order: () => ({ data: [], error: null }),
      limit: () => ({ data: [], error: null }),
      range: () => ({ data: [], error: null, count: 0 }),
      in: () => ({ data: [], error: null }),
      filter: () => ({ data: [], error: null }),
      match: () => ({ data: [], error: null }),
      neq: () => ({ data: [], error: null }),
      gt: () => ({ data: [], error: null }),
      lt: () => ({ data: [], error: null }),
      gte: () => ({ data: [], error: null }),
      lte: () => ({ data: [], error: null }),
      like: () => ({ data: [], error: null }),
      ilike: () => ({ data: [], error: null }),
      is: () => ({ data: [], error: null }),
      contains: () => ({ data: [], error: null }),
      containedBy: () => ({ data: [], error: null }),
      overlaps: () => ({ data: [], error: null }),
      textSearch: () => ({ data: [], error: null }),
      then: (callback: any) => {
        console.warn(`🔄 STUB: Appel Supabase intercepté pour la table ${table}`);
        // Simuler une réponse vide pour éviter les crashes
        callback({ data: [], error: null, count: 0 });
        return Promise.resolve({ data: [], error: null, count: 0 });
      }
    }),
    insert: (data: any) => ({
      data: null,
      error: null,
      select: () => ({ data: [], error: null }),
      single: () => ({ data: null, error: null }),
      then: (callback: any) => {
        console.warn(`🔄 STUB: Insert Supabase intercepté pour la table ${table}`, data);
        callback({ data: null, error: null });
        return Promise.resolve({ data: null, error: null });
      }
    }),
    update: (data: any) => ({
      data: null,
      error: null,
      eq: () => ({ data: null, error: null }),
      match: () => ({ data: null, error: null }),
      select: () => ({ data: [], error: null }),
      single: () => ({ data: null, error: null }),
      then: (callback: any) => {
        console.warn(`🔄 STUB: Update Supabase intercepté pour la table ${table}`, data);
        callback({ data: null, error: null });
        return Promise.resolve({ data: null, error: null });
      }
    }),
    delete: () => ({
      data: null,
      error: null,
      eq: () => ({ data: null, error: null }),
      match: () => ({ data: null, error: null }),
      then: (callback: any) => {
        console.warn(`🔄 STUB: Delete Supabase intercepté pour la table ${table}`);
        callback({ data: null, error: null });
        return Promise.resolve({ data: null, error: null });
      }
    })
  }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: (callback: any) => {
      console.warn('🔄 STUB: Auth state change listener ignoré');
      return { unsubscribe: () => {} };
    }
  },
  rpc: (functionName: string, params?: any) => ({
    data: null,
    error: null,
    then: (callback: any) => {
      console.warn(`🔄 STUB: RPC Supabase intercepté: ${functionName}`, params);
      callback({ data: null, error: null });
      return Promise.resolve({ data: null, error: null });
    }
  })
};

export const supabase = mockSupabaseClient;
export default mockSupabaseClient;
