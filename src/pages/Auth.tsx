import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Users, Building2, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TeamBranding {
  logo: string;
  name: string;
  primaryColor: string;
  accentColor: string;
}

interface AuthFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

const Auth = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  
  const [teamBranding, setTeamBranding] = useState<TeamBranding>({
    logo: "",
    name: "Plateforme MSP",
    primaryColor: "#3b82f6",
    accentColor: "#1e40af"
  });

  // Redirection si déjà connecté
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  // Chargement du branding par équipe
  useEffect(() => {
    const loadTeamBranding = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const teamId = urlParams.get('team');
      
      if (teamId) {
        const teamColors = {
          'team1': { primary: '#3b82f6', accent: '#1e40af', name: 'Équipe Alpha' },
          'team2': { primary: '#10b981', accent: '#047857', name: 'Équipe Beta' },
          'team3': { primary: '#f59e0b', accent: '#d97706', name: 'Équipe Gamma' }
        };
        
        const colors = teamColors[teamId as keyof typeof teamColors] || teamColors.team1;
        setTeamBranding({
          logo: "",
          name: colors.name,
          primaryColor: colors.primary,
          accentColor: colors.accent
        });
      }
    };
    
    loadTeamBranding();
  }, []);

  const cleanupAuthState = useCallback(() => {
    // Nettoyer les clés d'authentification Supabase du localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
  }, []);

  const validateForm = useCallback((isSignUp: boolean = false): boolean => {
    if (!formData.email || !formData.password) {
      setError("Email et mot de passe requis");
      return false;
    }

    if (isSignUp && (!formData.firstName || !formData.lastName)) {
      setError("Tous les champs sont requis pour l'inscription");
      return false;
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Format d'email invalide");
      return false;
    }

    // Validation mot de passe
    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return false;
    }

    return true;
  }, [formData]);

  const handleSignUp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(true)) return;
    
    setLoading(true);
    setError("");

    try {
      cleanupAuthState();
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Compte créé avec succès ! Vérifiez votre email.");
        
        // Si la confirmation email est désactivée, rediriger immédiatement
        if (data.session) {
          window.location.href = '/';
        } else {
          // Réinitialiser le formulaire après inscription réussie
          setFormData({
            email: '',
            password: '',
            firstName: '',
            lastName: ''
          });
          setActiveTab('signin');
          toast.info("Vérifiez votre email pour confirmer votre compte");
        }
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      
      // Gestion d'erreurs spécifiques
      if (error.message.includes('already registered')) {
        setError("Un compte avec cet email existe déjà");
      } else if (error.message.includes('password')) {
        setError("Le mot de passe ne respecte pas les critères de sécurité");
      } else {
        setError(error.message || "Erreur lors de la création du compte");
      }
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, cleanupAuthState]);

  const handleSignIn = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      cleanupAuthState();
      
      // Tentative de déconnexion globale d'abord
      try {
        await signOut();
      } catch (err) {
        // Continuer même si cela échoue
        console.warn('Global signout failed:', err);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Connexion réussie !");
        // Redirection avec remplacement pour éviter le retour en arrière
        window.location.href = '/';
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Gestion d'erreurs spécifiques
      if (error.message.includes("Invalid login credentials")) {
        setError("Email ou mot de passe incorrect");
      } else if (error.message.includes("Email not confirmed")) {
        setError("Veuillez confirmer votre email avant de vous connecter");
      } else if (error.message.includes("Too many requests")) {
        setError("Trop de tentatives. Veuillez réessayer plus tard");
      } else {
        setError(error.message || "Erreur de connexion");
      }
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, cleanupAuthState, signOut]);

  const handleInputChange = useCallback((field: keyof AuthFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (error) {
      setError('');
    }
  }, [error]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    setError('');
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: ''
    });
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // Mémoriser les fonctionnalités pour éviter les re-renders
  const features = useMemo(() => [
    {
      icon: Users,
      title: "Gestion d'équipes",
      description: "Isolation complète des données par équipe"
    },
    {
      icon: Building2,
      title: "Multi-organisation",
      description: "Support clients, ESN et MSP"
    },
    {
      icon: Shield,
      title: "Sécurité avancée",
      description: "RBAC et isolation des données"
    }
  ], []);

  // Si l'utilisateur est déjà connecté, afficher un loader
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar avec branding */}
      <div 
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br p-8 items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${teamBranding.primaryColor}15 0%, ${teamBranding.accentColor}15 100%)`
        }}
      >
        <div className="text-center space-y-6 max-w-md">
          <div className="space-y-4">
            {teamBranding.logo ? (
              <img 
                src={teamBranding.logo} 
                alt="Logo" 
                className="h-16 mx-auto"
              />
            ) : (
              <div 
                className="h-16 w-16 mx-auto rounded-xl flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: teamBranding.primaryColor }}
              >
                <Shield className="h-8 w-8" />
              </div>
            )}
            <h1 className="text-4xl font-bold" style={{ color: teamBranding.primaryColor }}>
              {teamBranding.name}
            </h1>
            <p className="text-lg text-muted-foreground">
              Plateforme de gestion multi-tenant pour MSP
            </p>
          </div>
          
          <div className="space-y-4 text-left">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-white/10">
                  <feature.icon className="h-5 w-5" style={{ color: teamBranding.primaryColor }} />
                </div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formulaire de connexion */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Connexion</h2>
            <p className="text-muted-foreground mt-2">
              Accédez à votre plateforme MSP
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Connexion</CardTitle>
                  <CardDescription>
                    Connectez-vous avec vos identifiants
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="votre@email.com"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="pl-10"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Mot de passe</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className="pl-10 pr-10"
                          required
                          disabled={loading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={togglePasswordVisibility}
                          disabled={loading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Connexion...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          Se connecter
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Inscription</CardTitle>
                  <CardDescription>
                    Créez votre compte MSP
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-firstname">Prénom</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-firstname"
                            type="text"
                            placeholder="Prénom"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className="pl-10"
                            required
                            disabled={loading}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-lastname">Nom</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-lastname"
                            type="text"
                            placeholder="Nom"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            className="pl-10"
                            required
                            disabled={loading}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="votre@email.com"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="pl-10"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Mot de passe</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className="pl-10 pr-10"
                          required
                          disabled={loading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={togglePasswordVisibility}
                          disabled={loading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Création...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          Créer le compte
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;