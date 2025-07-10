import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, Shield, Users, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [teamBranding, setTeamBranding] = useState({
    logo: "",
    name: "MSP Platform",
    primaryColor: "#3b82f6",
    accentColor: "#1e40af"
  });
  const navigate = useNavigate();
  const { sessionContext } = useAuth();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate]);

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
        await supabase.auth.signOut({ scope: 'global' });
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
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              {teamBranding.logo ? (
                <img 
                  src={teamBranding.logo} 
                  alt="Logo" 
                  className="h-12"
                />
              ) : (
                <div 
                  className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: teamBranding.primaryColor }}
                >
                  <Shield className="h-6 w-6" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl font-bold">
              {teamBranding.name}
            </CardTitle>
            <CardDescription>
              Connectez-vous à votre espace de travail
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      required
                      className="h-11"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="h-11 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-11 px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-11" 
                    disabled={loading}
                    style={{ backgroundColor: teamBranding.primaryColor }}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Se connecter
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-firstname">Prénom</Label>
                      <Input
                        id="signup-firstname"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Jean"
                        required
                        className="h-11"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-lastname">Nom</Label>
                      <Input
                        id="signup-lastname"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Dupont"
                        required
                        className="h-11"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      required
                      className="h-11"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="h-11 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-11 px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-11" 
                    disabled={loading}
                    style={{ backgroundColor: teamBranding.primaryColor }}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Créer un compte
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;