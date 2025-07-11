import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Building2, Users } from 'lucide-react';

export default function Setup() {
  const { user, sessionContext } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [organizationName, setOrganizationName] = useState('Mon Organisation MSP');
  const [teamName, setTeamName] = useState('Équipe MSP');

  useEffect(() => {
    if (!user || !sessionContext?.is_msp) {
      navigate('/');
      return;
    }
  }, [user, sessionContext, navigate]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionContext?.current_organization_id || !sessionContext?.current_team_id) return;

    setLoading(true);
    try {
      // Mettre à jour le nom de l'organisation
      const { error: orgError } = await supabase
        .from('organizations')
        .update({ name: organizationName })
        .eq('id', sessionContext.current_organization_id);

      if (orgError) throw orgError;

      // Mettre à jour le nom de l'équipe
      const { error: teamError } = await supabase
        .from('teams')
        .update({ name: teamName })
        .eq('id', sessionContext.current_team_id);

      if (teamError) throw teamError;

      toast.success('Configuration terminée avec succès !');
      navigate('/');
    } catch (error: any) {
      console.error('Erreur lors de la configuration:', error);
      toast.error('Erreur lors de la configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  if (!user || !sessionContext?.is_msp) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Configuration initiale</CardTitle>
          <CardDescription>
            Personnalisez votre organisation et équipe MSP
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organization" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Nom de votre organisation
              </Label>
              <Input
                id="organization"
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Mon Organisation MSP"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Nom de votre équipe principale
              </Label>
              <Input
                id="team"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Équipe MSP"
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                className="flex-1"
              >
                Ignorer
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Terminer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}