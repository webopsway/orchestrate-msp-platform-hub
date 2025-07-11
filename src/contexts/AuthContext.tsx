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
      
      // First, try to auto-initialize session for MSP admins
      try {
        await supabase.rpc('auto_init_msp_admin_session');
      } catch (err) {
        console.warn('Auto MSP admin session init failed:', err);
      }
      
      const { data, error } = await supabase.functions.invoke('init-user-session', {
        body: {
          organization_id: organizationId,
          team_id: teamId
        }
      });

      if (error) {
        console.error('Session initialization error:', error);
        
        // For MSP admins, try to get session context directly from database
        try {
          const { data: sessionData } = await supabase
            .from('user_sessions')
            .select('current_organization_id, current_team_id, is_msp')
            .eq('user_id', session.user.id)
            .single();
            
          if (sessionData) {
            // If MSP admin session exists but is incomplete (no team_id), fix it
            if (sessionData.is_msp && !sessionData.current_team_id && sessionData.current_organization_id) {
              console.log('MSP admin session incomplete, fixing...');
              
              // Get first team from MSP organization
              const { data: team } = await supabase
                .from('teams')
                .select('id')
                .eq('organization_id', sessionData.current_organization_id)
                .limit(1)
                .single();
                
              if (team) {
                // Update session with team_id
                const { error: updateError } = await supabase
                  .from('user_sessions')
                  .update({ 
                    current_team_id: team.id,
                    updated_at: new Date().toISOString()
                  })
                  .eq('user_id', session.user.id);
                  
                if (!updateError) {
                  setSessionContext({
                    current_organization_id: sessionData.current_organization_id,
                    current_team_id: team.id,
                    is_msp: sessionData.is_msp
                  });
                  toast.success('Session MSP admin corrigée et initialisée');
                  return;
                }
              }
            }
            
            setSessionContext({
              current_organization_id: sessionData.current_organization_id,
              current_team_id: sessionData.current_team_id,
              is_msp: sessionData.is_msp
            });
            toast.success('Session MSP admin initialisée');
            return;
          }
        } catch (dbError) {
          console.warn('Direct session fetch failed:', dbError);
        }
        
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