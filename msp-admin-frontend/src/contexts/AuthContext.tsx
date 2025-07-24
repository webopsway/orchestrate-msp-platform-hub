import apiClient from '@/services/apiClient';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_msp_admin?: boolean;
  default_organization_id?: string;
  default_team_id?: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger le profil utilisateur depuis l'API
  const loadUserProfile = async (userId: string) => {
    try {
      const response = await apiClient.get(`/users/${userId}`);
      if (response.data.success && response.data.data) {
        const profile: UserProfile = {
          id: response.data.data.id,
          email: response.data.data.email,
          first_name: response.data.data.first_name,
          last_name: response.data.data.last_name,
          is_msp_admin: response.data.data.is_msp_admin,
          default_organization_id: response.data.data.default_organization_id,
          default_team_id: response.data.data.default_team_id,
        };
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast.error('Erreur lors du chargement du profil utilisateur');
    }
  };

  // Fonction de connexion
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/auth/login', { email, password });

      if (response.data.success && response.data.data) {
        const { token, user: userData } = response.data.data;

        // Stocker le token
        localStorage.setItem('auth_token', token);

        // Définir l'utilisateur
        const authUser: AuthUser = {
          id: userData.id,
          email: userData.email
        };
        setUser(authUser);

        // Charger le profil complet
        await loadUserProfile(userData.id);

        toast.success('Connexion réussie');
      } else {
        throw new Error(response.data.error || 'Erreur de connexion');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.error || error.message || 'Erreur de connexion');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setUserProfile(null);
    toast.success('Déconnexion réussie');
  };

  // Rafraîchir le profil
  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  };

  // Vérifier la session existante au démarrage
  useEffect(() => {
    const checkExistingSession = async () => {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Pour le développement, créer un utilisateur de test
        if (token === 'dev') {
          const testUser: AuthUser = {
            id: 'test-user-id',
            email: 'admin@msp.local'
          };

          const testProfile: UserProfile = {
            id: 'test-user-id',
            email: 'admin@msp.local',
            first_name: 'Admin',
            last_name: 'MSP',
            is_msp_admin: true,
            default_organization_id: 'org-1',
            default_team_id: 'team-1'
          };

          setUser(testUser);
          setUserProfile(testProfile);
          setLoading(false);
          return;
        }

        // Vérifier le token avec l'API
        const response = await apiClient.get('/auth/me');

        if (response.data.success && response.data.data) {
          const userData = response.data.data;
          const authUser: AuthUser = {
            id: userData.id,
            email: userData.email
          };
          setUser(authUser);
          await loadUserProfile(userData.id);
        } else {
          // Token invalide
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        console.error('Session verification error:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
