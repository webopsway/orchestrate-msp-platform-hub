import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SessionContext {
  current_organization_id?: string;
  current_team_id?: string;
  is_msp?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_msp_admin?: boolean;
  default_organization_id?: string;
  default_team_id?: string;
}

class SessionService {
  private static instance: SessionService;
  private sessionContext: SessionContext | null = null;
  private userProfile: UserProfile | null = null;
  private listeners: Set<(context: SessionContext | null) => void> = new Set();

  static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  // Subscribe to session changes
  subscribe(callback: (context: SessionContext | null) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.sessionContext));
  }

  // Get current session context
  getSessionContext(): SessionContext | null {
    return this.sessionContext;
  }

  // Get current user profile
  getUserProfile(): UserProfile | null {
    return this.userProfile;
  }

  // Check if user has required context
  hasValidContext(): boolean {
    return !!(this.sessionContext?.current_team_id && this.sessionContext?.current_organization_id);
  }

  // Initialize session for authenticated user
  async initializeSession(organizationId?: string, teamId?: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        this.clearSession();
        return false;
      }

      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Failed to load user profile:', profileError);
        this.clearSession();
        return false;
      }

      this.userProfile = profile;

      // Try to get existing session from database first (more reliable)
      console.log('Loading session for user:', user.id);
      const { data: existingSession, error: sessionError } = await supabase
        .from('user_sessions')
        .select('current_organization_id, current_team_id, is_msp, expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('Existing session data:', existingSession, 'Error:', sessionError);

      if (existingSession && new Date(existingSession.expires_at) > new Date()) {
        // Session is valid
        this.sessionContext = existingSession;
        console.log('Using existing valid session:', this.sessionContext);
      } else {
        // Try to initialize session with edge function as fallback
        console.log('No valid session found, trying edge function...');
        const { data, error } = await supabase.functions.invoke('init-user-session', {
          body: {
            organization_id: organizationId || profile.default_organization_id,
            team_id: teamId || profile.default_team_id
          }
        });

        if (error || !data?.session_context) {
          console.error('Edge function failed:', error);
          // As last resort, create a basic session context for MSP admin
          if (profile.is_msp_admin && profile.default_organization_id && profile.default_team_id) {
            this.sessionContext = {
              current_organization_id: profile.default_organization_id,
              current_team_id: profile.default_team_id,
              is_msp: true
            };
            console.log('Created fallback session for MSP admin:', this.sessionContext);
          } else {
            this.clearSession();
            return false;
          }
        } else {
          this.sessionContext = data.session_context;
        }
      }

      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Session initialization failed:', error);
      this.clearSession();
      return false;
    }
  }

  // Clear session data
  clearSession(): void {
    this.sessionContext = null;
    this.userProfile = null;
    this.notifyListeners();
  }

  // Check if user is MSP admin
  isMspAdmin(): boolean {
    return this.userProfile?.is_msp_admin === true;
  }

  // Get current team ID with validation
  getCurrentTeamId(): string | null {
    if (!this.sessionContext?.current_team_id) {
      toast.error('Aucune équipe sélectionnée');
      return null;
    }
    return this.sessionContext.current_team_id;
  }

  // Get current organization ID with validation
  getCurrentOrganizationId(): string | null {
    if (!this.sessionContext?.current_organization_id) {
      toast.error('Aucune organisation sélectionnée');
      return null;
    }
    return this.sessionContext.current_organization_id;
  }

  // Switch to different team/organization
  async switchContext(organizationId: string, teamId: string): Promise<boolean> {
    return this.initializeSession(organizationId, teamId);
  }
}

export const sessionService = SessionService.getInstance();