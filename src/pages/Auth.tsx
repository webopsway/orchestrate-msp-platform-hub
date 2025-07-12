import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Users, Building2, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TeamBranding {
  logo: string;
  name: string;
  primaryColor: string;
  accentColor: string;
}

const Auth = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teamBranding, setTeamBranding] = useState<TeamBranding>({
    logo: "",
    name: "Plateforme MSP",
    primaryColor: "#3b82f6",
    accentColor: "#1e40af"
  });

  useEffect(() => {
    // Check if user is already logged in
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Simuler la récupération du branding par équipe
  useEffect(() => {
    // TODO: Récupérer le branding depuis app_settings basé sur l'URL ou le domaine
    const urlParams = new URLSearchParams(window.location.search);
    const teamId = urlParams.get('team');
    
    if (teamId) {
      // Simuler des couleurs différentes par équipe
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
  }, []);

  const cleanupAuthState = () => {
    // Remove all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName) {
      setError("Tous les champs sont requis");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      cleanupAuthState();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Compte créé avec succès ! Vérifiez votre email.");
        // If email confirmation is disabled, redirect immediately
        if (data.session) {
          window.location.href = '/';
        }
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      setError(error.message || "Erreur lors de la création du compte");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email et mot de passe requis");
      return;
    }

    setLoading(true);
    setError("");

    try {
      cleanupAuthState();
      
      // Attempt global sign out first
      try {
        await signOut();
      } catch (err) {
        // Continue even if this fails
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Connexion réussie !");
        // Force page reload for clean state
        window.location.href = '/';
      }
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.message.includes("Invalid login credentials")) {
        setError("Email ou mot de passe incorrect");
      } else {
        setError(error.message || "Erreur de connexion");
      }
    } finally {
      setLoading(false);
    }
  };

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
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-white/10">
                <Users className="h-5 w-5" style={{ color: teamBranding.primaryColor }} />
              </div>
              <div>
                <h3 className="font-semibold">Gestion d'équipes</h3>
                <p className="text-sm text-muted-foreground">Isolation complète des données par équipe</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-white/10">
                <Building2 className="h-5 w-5" style={{ color: teamBranding.primaryColor }} />
              </div>
              <div>
                <h3 className="font-semibold">Multi-organisation</h3>
                <p className="text-sm text-muted-foreground">Support clients, ESN et MSP</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-white/10">
                <Shield className="h-5 w-5" style={{ color: teamBranding.primaryColor }} />
              </div>
              <div>
                <h3 className="font-semibold">Sécurité avancée</h3>
                <p className="text-sm text-muted-foreground">RBAC et isolation des données</p>
              </div>
            </div>
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

          <Tabs defaultValue="signin" className="w-full">
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
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="votre@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Mot de passe</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                          required
                        />
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
                        <Label htmlFor="firstName">Prénom</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="firstName"
                            type="text"
                            placeholder="Prénom"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Nom</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="lastName"
                            type="text"
                            placeholder="Nom"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="pl-10"
                            required
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
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Mot de passe</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                          required
                        />
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