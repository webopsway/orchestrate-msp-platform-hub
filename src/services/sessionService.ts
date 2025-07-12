import { supabase } from '@/integrations/supabase/client';

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
    return !!(this.userProfile?.is_msp_admin || (this.sessionContext?.current_team_id && this.sessionContext?.current_organization_id));
  }

  // Initialize session for authenticated user using only Supabase auth
  async initializeSession(organizationId?: string, teamId?: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        this.clearSession();
        return false;
      }

      console.log('Initializing session for user:', user.id);

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
      console.log('User profile loaded:', profile);

      // Create session context based on user profile
      this.sessionContext = {
        current_organization_id: organizationId || profile.default_organization_id,
        current_team_id: teamId || profile.default_team_id,
        is_msp: profile.is_msp_admin || false
      };

      console.log('Session context created:', this.sessionContext);
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

  // Get current team ID - for MSP admin, always return their default team
  getCurrentTeamId(): string | null {
    if (this.userProfile?.is_msp_admin) {
      return this.userProfile.default_team_id || null;
    }
    return this.sessionContext?.current_team_id || null;
  }

  // Get current organization ID - for MSP admin, always return their default org
  getCurrentOrganizationId(): string | null {
    if (this.userProfile?.is_msp_admin) {
      return this.userProfile.default_organization_id || null;
    }
    return this.sessionContext?.current_organization_id || null;
  }

  // Switch to different team/organization
  async switchContext(organizationId: string, teamId: string): Promise<boolean> {
    return this.initializeSession(organizationId, teamId);
  }
}

export const sessionService = SessionService.getInstance();