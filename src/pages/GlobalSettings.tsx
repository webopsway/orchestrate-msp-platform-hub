import { useState, useEffect } from 'react';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useAuth } from '@/contexts/AuthContext';
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
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, Settings, Plus, Edit3, Trash2, Globe, Users, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function GlobalSettings() {
  const { user } = useAuth();
  const [isMspAdmin, setIsMspAdmin] = useState<boolean>(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const {
    namespaces,
    keys,
    settings,
    loading,
    fetchNamespaces,
    fetchKeys,
    fetchSettings,
    setSetting,
    deleteSetting
  } = useAppSettings();

  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [newNamespace, setNewNamespace] = useState<string>('');
  const [newKey, setNewKey] = useState<string>('');
  const [newValue, setNewValue] = useState<string>('{}');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<any>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  // Check if user is MSP admin
  useEffect(() => {
    const checkMspAdmin = async () => {
      if (!user) {
        setLoadingProfile(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_msp_admin')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
          setIsMspAdmin(false);
        } else {
          setIsMspAdmin(data?.is_msp_admin || false);
        }
      } catch (error) {
        console.error('Error checking MSP admin status:', error);
        setIsMspAdmin(false);
      } finally {
        setLoadingProfile(false);
      }
    };
    
    checkMspAdmin();
  }, [user]);

  // Show loading while checking profile
  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect if not MSP admin
  if (!isMspAdmin) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchNamespaces();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (selectedNamespace) {
      fetchKeys(selectedNamespace);
    }
  }, [selectedNamespace]);

  const handleAddSetting = async () => {
    try {
      const namespace = newNamespace || selectedNamespace;
      const key = newKey || selectedKey;
      
      if (!namespace || !key) {
        return;
      }

      let parsedValue;
      try {
        parsedValue = JSON.parse(newValue);
      } catch {
        parsedValue = newValue; // If not valid JSON, treat as string
      }

      await setSetting(null, namespace, key, parsedValue);
      setIsAddDialogOpen(false);
      setNewNamespace('');
      setNewKey('');
      setNewValue('{}');
      setSelectedNamespace('');
      setSelectedKey('');
    } catch (error) {
      console.error('Error adding setting:', error);
    }
  };

  const handleEditSetting = (setting: any) => {
    setEditingSetting(setting);
    setEditingValue(JSON.stringify(setting.value, null, 2));
  };

  const handleSaveEdit = async () => {
    if (!editingSetting) return;

    try {
      let parsedValue;
      try {
        parsedValue = JSON.parse(editingValue);
      } catch {
        parsedValue = editingValue; // If not valid JSON, treat as string
      }

      await setSetting(
        editingSetting.team_id,
        editingSetting.namespace,
        editingSetting.key,
        parsedValue
      );
      setEditingSetting(null);
      setEditingValue('');
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  const handleDeleteSetting = async (setting: any) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le paramètre ${setting.namespace}.${setting.key} ?`)) {
      try {
        await deleteSetting(setting.team_id, setting.namespace, setting.key);
      } catch (error) {
        console.error('Error deleting setting:', error);
      }
    }
  };

  const formatValue = (value: any): string => {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value, null, 2);
  };

  const globalSettings = settings.filter(s => s.team_id === null);
  const teamSettings = settings.filter(s => s.team_id !== null);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Paramètres Globaux MSP"
        description="Configuration globale de la plateforme - Accessible uniquement aux administrateurs MSP"
      />

      <div className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-400">
          <Globe className="h-5 w-5" />
          <span className="font-medium">Mode Administrateur MSP</span>
          <Badge variant="secondary" className="ml-2">
            Accès Global
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="global" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="global">Paramètres Globaux</TabsTrigger>
          <TabsTrigger value="namespaces">Namespaces</TabsTrigger>
          <TabsTrigger value="teams">Paramètres Équipes</TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Paramètres Globaux</h2>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau Paramètre
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Ajouter un Paramètre Global</DialogTitle>
                  <DialogDescription>
                    Créer un nouveau paramètre global qui s'appliquera à toutes les équipes.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="namespace">Namespace</Label>
                    <div className="flex space-x-2">
                      <Select value={selectedNamespace} onValueChange={setSelectedNamespace}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Sélectionner un namespace existant" />
                        </SelectTrigger>
                        <SelectContent>
                          {namespaces.map((ns) => (
                            <SelectItem key={ns.namespace} value={ns.namespace}>
                              {ns.namespace}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="self-center text-muted-foreground">ou</span>
                      <Input
                        placeholder="Nouveau namespace"
                        value={newNamespace}
                        onChange={(e) => setNewNamespace(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="key">Clé</Label>
                    <div className="flex space-x-2">
                      <Select value={selectedKey} onValueChange={setSelectedKey}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Sélectionner une clé existante" />
                        </SelectTrigger>
                        <SelectContent>
                          {keys.map((key) => (
                            <SelectItem key={key.key} value={key.key}>
                              {key.key}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="self-center text-muted-foreground">ou</span>
                      <Input
                        placeholder="Nouvelle clé"
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="value">Valeur (JSON)</Label>
                    <Textarea
                      id="value"
                      placeholder='{"example": "value"}'
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <Button onClick={handleAddSetting} disabled={loading}>
                    <Save className="mr-2 h-4 w-4" />
                    Sauvegarder
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {globalSettings.map((setting) => (
              <Card key={`${setting.namespace}-${setting.key}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-5 w-5 text-blue-500" />
                      <CardTitle className="text-lg">
                        {setting.namespace}.{setting.key}
                      </CardTitle>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Global MSP
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSetting(setting)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSetting(setting)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    Créé le {format(new Date(setting.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    {setting.updated_at !== setting.created_at && (
                      <> • Modifié le {format(new Date(setting.updated_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}</>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-3 rounded text-sm font-mono">
                    <pre className="whitespace-pre-wrap">{formatValue(setting.value)}</pre>
                  </div>
                </CardContent>
              </Card>
            ))}
            {globalSettings.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Settings className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold">Aucun paramètre global</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Créez votre premier paramètre global pour configurer la plateforme.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="namespaces" className="space-y-6">
          <h2 className="text-2xl font-semibold">Namespaces Disponibles</h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {namespaces.map((namespace) => (
              <Card key={namespace.namespace}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>{namespace.namespace}</span>
                  </CardTitle>
                  <CardDescription>
                    {namespace.setting_count} paramètre{namespace.setting_count > 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {namespace.is_global && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Globe className="mr-1 h-3 w-3" />
                          Global
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedNamespace(namespace.namespace);
                        fetchKeys(namespace.namespace);
                      }}
                    >
                      Explorer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          <h2 className="text-2xl font-semibold">Paramètres par Équipe</h2>
          
          <div className="grid gap-4">
            {teamSettings.map((setting) => (
              <Card key={`${setting.team_id}-${setting.namespace}-${setting.key}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-green-500" />
                      <CardTitle className="text-lg">
                        {setting.namespace}.{setting.key}
                      </CardTitle>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Équipe: {setting.team_id}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>
                    Paramètre spécifique à l'équipe {setting.team_id}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-3 rounded text-sm font-mono">
                    <pre className="whitespace-pre-wrap">{formatValue(setting.value)}</pre>
                  </div>
                </CardContent>
              </Card>
            ))}
            {teamSettings.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold">Aucun paramètre d'équipe</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Les paramètres spécifiques aux équipes apparaîtront ici.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingSetting} onOpenChange={() => setEditingSetting(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Modifier {editingSetting?.namespace}.{editingSetting?.key}
            </DialogTitle>
            <DialogDescription>
              {editingSetting?.team_id ? `Paramètre d'équipe ${editingSetting.team_id}` : 'Paramètre global MSP'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-value">Valeur (JSON)</Label>
              <Textarea
                id="edit-value"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                rows={8}
                className="font-mono"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleSaveEdit} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder
              </Button>
              <Button variant="outline" onClick={() => setEditingSetting(null)}>
                <X className="mr-2 h-4 w-4" />
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}