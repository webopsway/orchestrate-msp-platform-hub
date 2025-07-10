import { useState } from 'react';
import { useCloudOrchestration } from '@/hooks/useCloudOrchestration';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Cloud, Database, Play, Settings, Shield, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function CloudOrchestration() {
  const {
    providers,
    credentials,
    executions,
    loading,
    saveCredentials,
    deleteCredentials,
    triggerInventory,
    triggerBackup
  } = useCloudOrchestration();

  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [credentialsConfig, setCredentialsConfig] = useState<string>('{}');
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);

  const handleSaveCredentials = async () => {
    try {
      const config = JSON.parse(credentialsConfig);
      await saveCredentials(selectedTeamId, selectedProviderId, config);
      setIsCredentialsDialogOpen(false);
      setCredentialsConfig('{}');
      setSelectedTeamId('');
      setSelectedProviderId('');
    } catch (error) {
      console.error('Invalid JSON config:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'running':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'failed':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType) {
      case 'inventory':
        return <Database className="h-4 w-4" />;
      case 'backup':
        return <Shield className="h-4 w-4" />;
      default:
        return <Cloud className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Orchestration Cloud"
        description="Gérez les credentials cloud et orchestrez les tâches d'inventaire et de sauvegarde"
      />

      <Tabs defaultValue="credentials" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="orchestration">Orchestration</TabsTrigger>
          <TabsTrigger value="executions">Exécutions</TabsTrigger>
        </TabsList>

        <TabsContent value="credentials" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Credentials Cloud</h2>
            <Dialog open={isCredentialsDialogOpen} onOpenChange={setIsCredentialsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Settings className="mr-2 h-4 w-4" />
                  Configurer Credentials
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Configurer les Credentials Cloud</DialogTitle>
                  <DialogDescription>
                    Ajoutez ou mettez à jour les credentials pour un fournisseur cloud.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="team-select">Équipe</Label>
                    <Input
                      id="team-select"
                      placeholder="Team ID (UUID)"
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="provider-select">Fournisseur Cloud</Label>
                    <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un fournisseur" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="config">Configuration (JSON)</Label>
                    <Textarea
                      id="config"
                      placeholder='{"access_key": "...", "secret_key": "..."}'
                      value={credentialsConfig}
                      onChange={(e) => setCredentialsConfig(e.target.value)}
                      rows={6}
                    />
                  </div>
                  <Button 
                    onClick={handleSaveCredentials} 
                    disabled={!selectedTeamId || !selectedProviderId || loading}
                  >
                    Sauvegarder
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {credentials.map((credential) => (
              <Card key={credential.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Cloud className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">
                        {credential.cloud_providers.display_name}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCredentials(credential.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    Équipe: {credential.team_id} • 
                    Configuré le {format(new Date(credential.created_at), 'dd MMMM yyyy', { locale: fr })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Provider: {credential.cloud_providers.name}
                  </div>
                </CardContent>
              </Card>
            ))}
            {credentials.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Cloud className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold">Aucun credential configuré</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Commencez par configurer vos credentials cloud.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="orchestration" className="space-y-6">
          <h2 className="text-2xl font-semibold">Orchestration des Tâches</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            {credentials.map((credential) => (
              <Card key={credential.id}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Cloud className="h-5 w-5" />
                    <span>{credential.cloud_providers.display_name}</span>
                  </CardTitle>
                  <CardDescription>
                    Équipe: {credential.team_id}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => triggerInventory(credential.team_id, credential.provider_id)}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Database className="mr-2 h-4 w-4" />
                      Inventaire
                    </Button>
                    <Button
                      onClick={() => triggerBackup(credential.team_id, credential.provider_id)}
                      disabled={loading}
                      size="sm"
                      className="flex-1"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Sauvegarde
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {credentials.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">Aucun credential configuré</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Configurez vos credentials cloud pour pouvoir orchestrer les tâches.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="executions" className="space-y-6">
          <h2 className="text-2xl font-semibold">Historique des Exécutions</h2>
          
          <div className="space-y-4">
            {executions.map((execution) => (
              <Card key={execution.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getTaskTypeIcon(execution.task_type)}
                      <CardTitle className="text-lg capitalize">
                        {execution.task_type === 'inventory' ? 'Inventaire' : 'Sauvegarde'}
                      </CardTitle>
                      <Badge className={getStatusColor(execution.status)}>
                        {execution.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(execution.started_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </div>
                  </div>
                  <CardDescription>
                    {execution.cloud_providers.display_name} • Équipe: {execution.team_id}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {execution.error_message && (
                    <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                      <strong>Erreur:</strong> {execution.error_message}
                    </div>
                  )}
                  {execution.result_data && (
                    <div className="text-sm">
                      <strong>Résultat:</strong>
                      <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(execution.result_data, null, 2)}
                      </pre>
                    </div>
                  )}
                  {execution.completed_at && (
                    <div className="text-sm text-muted-foreground mt-2">
                      Terminé le {format(new Date(execution.completed_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {executions.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Play className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold">Aucune exécution</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Les tâches orchestrées apparaîtront ici.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}