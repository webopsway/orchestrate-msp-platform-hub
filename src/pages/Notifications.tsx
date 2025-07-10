import { useEffect, useState } from "react";
import { Plus, Settings, TestTube, RotateCcw, Trash2, Bell, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/common/PageHeader";
import { DataGrid } from "@/components/common/DataGrid";
import { EmptyState } from "@/components/common/EmptyState";
import { useNotifications, type NotificationTransport, type Notification } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";

const transportSchema = z.object({
  team_id: z.string().min(1, "Team ID requis"),
  scope: z.enum(['manager', 'msp']),
  channel: z.enum(['smtp', 'transactional_email', 'slack', 'teams', 'api']),
  config: z.record(z.any()),
  is_active: z.boolean().optional(),
});

type TransportFormData = z.infer<typeof transportSchema>;

const TransportForm = ({ 
  transport, 
  onSave, 
  onClose 
}: { 
  transport?: NotificationTransport;
  onSave: (data: TransportFormData) => void;
  onClose: () => void;
}) => {
  const form = useForm<TransportFormData>({
    resolver: zodResolver(transportSchema),
    defaultValues: {
      team_id: transport?.team_id || '',
      scope: (transport?.scope as 'manager' | 'msp') || 'manager',
      channel: (transport?.channel as 'smtp' | 'transactional_email' | 'slack' | 'teams' | 'api') || 'smtp',
      config: (transport?.config as Record<string, any>) || {},
      is_active: transport?.is_active ?? true,
    },
  });

  const watchChannel = form.watch('channel');

  const renderChannelConfig = () => {
    switch (watchChannel) {
      case 'smtp':
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="config.host"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serveur SMTP</FormLabel>
                  <FormControl>
                    <Input placeholder="smtp.gmail.com" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.port"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Port</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="587" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.user"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Utilisateur</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.from"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email expéditeur</FormLabel>
                  <FormControl>
                    <Input placeholder="notifications@example.com" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        );

      case 'transactional_email':
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="config.provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fournisseur</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un fournisseur" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="mailgun">Mailgun</SelectItem>
                      <SelectItem value="ses">Amazon SES</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clé API</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.from"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email expéditeur</FormLabel>
                  <FormControl>
                    <Input placeholder="notifications@example.com" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        );

      case 'slack':
        return (
          <FormField
            control={form.control}
            name="config.webhookUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Webhook URL Slack</FormLabel>
                <FormControl>
                  <Input placeholder="https://hooks.slack.com/services/..." {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        );

      case 'teams':
        return (
          <FormField
            control={form.control}
            name="config.webhookUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Webhook URL Teams</FormLabel>
                <FormControl>
                  <Input placeholder="https://outlook.office.com/webhook/..." {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        );

      case 'api':
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="config.url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL API</FormLabel>
                  <FormControl>
                    <Input placeholder="https://api.example.com/notifications" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Méthode HTTP</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || 'POST'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.headers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Headers (JSON)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder='{"Authorization": "Bearer token"}'
                      {...field}
                      value={typeof field.value === 'object' ? JSON.stringify(field.value, null, 2) : field.value}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          field.onChange(parsed);
                        } catch {
                          field.onChange(e.target.value);
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const onSubmit = (data: TransportFormData) => {
    onSave(data);
    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="scope"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Portée</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="msp">MSP</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="channel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Canal</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="smtp">SMTP</SelectItem>
                    <SelectItem value="transactional_email">Email transactionnel</SelectItem>
                    <SelectItem value="slack">Slack</SelectItem>
                    <SelectItem value="teams">Microsoft Teams</SelectItem>
                    <SelectItem value="api">API personnalisée</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        {renderChannelConfig()}

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Actif</FormLabel>
                <FormDescription>
                  Ce transport recevra les notifications
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit">
            {transport ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default function Notifications() {
  const { user } = useAuth();
  const {
    transports,
    notifications,
    loading,
    fetchTransports,
    fetchNotifications,
    saveTransport,
    deleteTransport,
    testTransport,
    retryNotification,
  } = useNotifications();

  const [showTransportDialog, setShowTransportDialog] = useState(false);
  const [editingTransport, setEditingTransport] = useState<NotificationTransport | undefined>();

  useEffect(() => {
    if (user) {
      fetchTransports();
      fetchNotifications();
    }
  }, [user]);

  const handleSaveTransport = async (data: TransportFormData) => {
    await saveTransport({
      ...editingTransport,
      ...data,
    });
    setEditingTransport(undefined);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />Envoyé</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Échec</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Bell className="h-3 w-3" />En attente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getChannelLabel = (channel: string) => {
    const labels: Record<string, string> = {
      smtp: 'SMTP',
      transactional_email: 'Email transactionnel',
      slack: 'Slack',
      teams: 'Microsoft Teams',
      api: 'API personnalisée',
    };
    return labels[channel] || channel;
  };


  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Gérez les transports de notification et consultez l'historique des envois"
      />

      <Tabs defaultValue="transports" className="space-y-6">
        <TabsList>
          <TabsTrigger value="transports">Transports</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="transports" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Transports de notification</h3>
              <p className="text-sm text-muted-foreground">
                Configurez les canaux de notification pour votre équipe
              </p>
            </div>
            <Dialog open={showTransportDialog} onOpenChange={setShowTransportDialog}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    setEditingTransport(undefined);
                    setShowTransportDialog(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau transport
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingTransport ? 'Modifier' : 'Créer'} un transport
                  </DialogTitle>
                  <DialogDescription>
                    Configurez un canal de notification pour recevoir les alertes ITSM
                  </DialogDescription>
                </DialogHeader>
                <TransportForm
                  transport={editingTransport}
                  onSave={handleSaveTransport}
                  onClose={() => setShowTransportDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {transports.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="Aucun transport configuré"
              description="Créez votre premier transport de notification pour recevoir les alertes"
              action={{
                label: "Créer un transport",
                onClick: () => setShowTransportDialog(true),
              }}
            />
          ) : (
            <DataGrid columns={2}>
              {transports.map((transport) => (
                <Card key={transport.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {getChannelLabel(transport.channel)}
                    </CardTitle>
                    <Badge variant={transport.scope === 'msp' ? 'default' : 'secondary'}>
                      {transport.scope.toUpperCase()}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Statut</span>
                        <Badge variant={transport.is_active ? 'default' : 'secondary'}>
                          {transport.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Créé le</span>
                        <span className="text-sm">
                          {new Date(transport.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="flex space-x-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testTransport(transport.id)}
                          disabled={loading}
                        >
                          <TestTube className="h-4 w-4 mr-1" />
                          Test
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingTransport(transport);
                            setShowTransportDialog(true);
                          }}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteTransport(transport.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </DataGrid>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Historique des notifications</h3>
            <p className="text-sm text-muted-foreground">
              Consultez l'historique des notifications envoyées
            </p>
          </div>

          {notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="Aucune notification"
              description="L'historique des notifications apparaîtra ici"
            />
          ) : (
            <DataGrid columns={1}>
              {notifications.map((notification) => (
                <Card key={notification.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      <Badge variant="outline">{notification.event_type}</Badge>
                    </CardTitle>
                    {getStatusBadge(notification.status)}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Canal</span>
                        <span className="text-sm">
                          {notification.transport ? getChannelLabel(notification.transport.channel) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Créé le</span>
                        <span className="text-sm">
                          {new Date(notification.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {notification.sent_at && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Envoyé le</span>
                          <span className="text-sm">
                            {new Date(notification.sent_at).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )}
                      {notification.error_message && (
                        <div className="mt-2 p-2 bg-destructive/10 rounded text-sm text-destructive">
                          {notification.error_message}
                        </div>
                      )}
                      {notification.status === 'failed' && (
                        <div className="flex justify-end pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryNotification(notification.id)}
                            disabled={loading}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Relancer
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </DataGrid>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}