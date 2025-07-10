import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSessionTest } from '@/hooks/useSessionTest';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, TestTube, Database, Settings } from 'lucide-react';
import { toast } from 'sonner';

export const SessionTester = () => {
  const { testSessionVariables, testAppSessionVariables, loading, result, error } = useSessionTest();
  const { sessionContext, initializeSession } = useAuth();
  const [appSessionResult, setAppSessionResult] = useState<any>(null);

  const handleTestSession = async () => {
    await testSessionVariables();
    if (!error) {
      toast.success('Test des variables de session terminé');
    }
  };

  const handleTestAppSession = async () => {
    const appResult = await testAppSessionVariables();
    setAppSessionResult(appResult);
    if (appResult && !error) {
      toast.success('Test des variables app terminé');
    }
  };

  const handleReinitializeSession = async () => {
    await initializeSession();
    toast.success('Session réinitialisée');
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Testeur de Variables de Session PostgreSQL
        </CardTitle>
        <CardDescription>
          Testez les variables de session PostgreSQL pour vérifier l'isolation des données par équipe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Current Session Context */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Contexte de Session Actuel
          </h3>
          
          {sessionContext ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <span className="text-xs text-muted-foreground">Organisation:</span>
                <Badge variant="outline" className="ml-2">
                  {sessionContext.current_organization_id || 'Non définie'}
                </Badge>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Équipe:</span>
                <Badge variant="outline" className="ml-2">
                  {sessionContext.current_team_id || 'Non définie'}
                </Badge>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">MSP:</span>
                <Badge variant={sessionContext.is_msp ? 'default' : 'secondary'} className="ml-2">
                  {sessionContext.is_msp ? 'Oui' : 'Non'}
                </Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun contexte de session trouvé</p>
          )}
        </div>

        <Separator />

        {/* Test Controls */}
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={handleTestSession} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Database className="mr-2 h-4 w-4" />
            Tester Variables SQL
          </Button>
          
          <Button 
            onClick={handleTestAppSession} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <TestTube className="mr-2 h-4 w-4" />
            Tester Variables App
          </Button>
          
          <Button 
            onClick={handleReinitializeSession} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Settings className="mr-2 h-4 w-4" />
            Réinitialiser Session
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive font-medium">Erreur:</p>
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
        )}

        {/* Test Results */}
        {result && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Variables SQL PostgreSQL (test_session_variables)</h3>
            <div className="bg-muted/50 p-3 rounded-md space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">app.current_team (raw):</span>
                  <Badge variant="outline" className="ml-2">
                    {result.current_team_var || 'vide'}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">app.is_msp (raw):</span>
                  <Badge variant="outline" className="ml-2">
                    {result.is_msp_var || 'vide'}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Équipe (parsée):</span>
                  <Badge variant="secondary" className="ml-2">
                    {result.parsed_team || 'NULL'}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">MSP (parsée):</span>
                  <Badge variant={result.parsed_is_msp ? 'default' : 'secondary'} className="ml-2">
                    {result.parsed_is_msp ? 'true' : 'false'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* App Session Results */}
        {appSessionResult && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Variables App Session (get_app_session_variables)</h3>
            <div className="bg-muted/50 p-3 rounded-md space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">Équipe courante:</span>
                  <Badge variant="secondary" className="ml-2">
                    {appSessionResult.current_team || 'NULL'}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Est MSP:</span>
                  <Badge variant={appSessionResult.is_msp ? 'default' : 'secondary'} className="ml-2">
                    {appSessionResult.is_msp ? 'true' : 'false'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Instructions de Test</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Les variables <code>app.current_team</code> et <code>app.is_msp</code> sont définies lors de l'initialisation de session</li>
            <li>• Ces variables persistent pendant toute la session PostgreSQL</li>
            <li>• Toutes les requêtes ultérieures héritent automatiquement de ces variables</li>
            <li>• Les politiques RLS peuvent utiliser ces variables pour l'isolation des données</li>
          </ul>
        </div>

      </CardContent>
    </Card>
  );
};