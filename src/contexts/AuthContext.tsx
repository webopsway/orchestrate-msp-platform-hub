import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SessionContext {
  current_organization_id?: string;
  current_team_id?: string;
  is_msp?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  sessionContext: SessionContext | null;
  loading: boolean;
  initializeSession: (organizationId?: string, teamId?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionContext, setSessionContext] = useState<SessionContext | null>(null);
  const [loading, setLoading] = useState(true);

  const initializeSession = async (organizationId?: string, teamId?: string) => {
    if (!session) return;

    try {
      console.log('Initializing session with org:', organizationId, 'team:', teamId);
      
      const { data, error } = await supabase.functions.invoke('init-user-session', {
        body: {
          organization_id: organizationId,
          team_id: teamId
        }
      });

      if (error) {
        console.error('Session initialization error:', error);
        toast.error('Erreur lors de l\'initialisation de la session');
        return;
      }

      if (data?.session_context) {
        setSessionContext(data.session_context);
        console.log('Session initialized:', data);
        
        // Log PostgreSQL session variables for debugging
        if (data.postgresql_session) {
          console.log('PostgreSQL session variables:', data.postgresql_session);
        }
        
        toast.success('Session initialisée avec succès');
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
      toast.error('Échec de l\'initialisation de la session');
    }
  };

  const signOut = async () => {
    try {
      // Clear session context
      setSessionContext(null);
      
      // Clean up auth state
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Attempt global sign out
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.warn('Global signout failed:', err);
      }
      
      toast.success('Déconnexion réussie');
      
      // Force page reload for clean state
      window.location.href = '/auth';
    } catch (error) {
      console.error('Signout error:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Defer session initialization to prevent deadlocks
          setTimeout(() => {
            initializeSession();
          }, 100);
        } else if (event === 'SIGNED_OUT') {
          setSessionContext(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Initialize session context for existing session
        setTimeout(() => {
          initializeSession();
        }, 100);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    session,
    sessionContext,
    loading,
    initializeSession,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};