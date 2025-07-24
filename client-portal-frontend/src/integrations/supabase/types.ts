// STUB TEMPORAIRE - Types Supabase minimaux
console.warn('⚠️  ATTENTION: Utilisation des types Supabase stub temporaires');

// Types de base
export interface Database {
  public: {
    Tables: Record<string, any>;
    Views: Record<string, any>;
    Functions: Record<string, any>;
    Enums: Record<string, any>;
    CompositeTypes: Record<string, any>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T];
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Types génériques pour éviter les erreurs
export interface User {
  id: string;
  email: string;
  [key: string]: any;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  user: User;
  [key: string]: any;
}
