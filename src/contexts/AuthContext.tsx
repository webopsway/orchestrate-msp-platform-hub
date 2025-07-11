import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { sessionService, SessionContext } from '@/services/sessionService';
import { toast } from 'sonner';

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
    if (!session?.user) {
      console.log('No valid session or user available for initialization');
      setSessionContext(null);
      sessionService.clearSession();
      return;
    }

    try {
      const success = await sessionService.initializeSession(organizationId, teamId);
      if (success) {
        setSessionContext(sessionService.getSessionContext());
        toast.success('Session initialisée avec succès');
      } else {
        setSessionContext(null);
        toast.error('Erreur lors de l\'initialisation de la session');
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setSessionContext(null);
      toast.error('Échec de l\'initialisation de la session');
    }
  };

  const signOut = async () => {
    try {
      // Clear session context
      setSessionContext(null);
      sessionService.clearSession();
      
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
          console.log('User signed in, initializing session...');
          // Defer session initialization to prevent deadlocks
          setTimeout(async () => {
            await initializeSession();
            
            // Check if this is a first-time MSP admin setup
            const { data: profile } = await supabase
              .from('profiles')
              .select('is_msp_admin, default_organization_id, default_team_id')
              .eq('id', session.user.id)
              .single();
              
            if (profile?.is_msp_admin && profile.default_organization_id && profile.default_team_id) {
              // Check if organization still has default name
              const { data: org } = await supabase
                .from('organizations')
                .select('name')
                .eq('id', profile.default_organization_id)
                .single();
                
              if (org?.name === 'Mon Organisation MSP') {
                // Redirect to setup page for customization
                window.location.href = '/setup';
                return;
              }
            }
          }, 100);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing session context');
          setSessionContext(null);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed, session should be maintained');
        } else if (event === 'INITIAL_SESSION' && session?.user) {
          console.log('Initial session detected, initializing...');
          setTimeout(async () => {
            await initializeSession();
          }, 100);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('Getting existing session:', session?.user?.id, error);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('Existing session found, initializing context...');
        // Initialize session context for existing session
        setTimeout(() => {
          initializeSession();
        }, 100);
      } else {
        console.log('No existing session found');
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