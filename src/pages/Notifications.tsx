import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { 
  PageHeader, 
  DataGrid, 
  SearchAndFilters,
  EmptyState 
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Webhook, 
  Smartphone,
  Plus, 
  Search, 
  Settings,
  Trash2,
  Eye,
  RefreshCw,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

interface NotificationTransport {
  id: string;
  team_id: string;
  channel: string;
  config: {
    smtp_host?: string;
    smtp_port?: number;
    smtp_user?: string;
    smtp_password?: string;
    from_email?: string;
    to_email?: string;
    slack_webhook?: string;
    teams_webhook?: string;
    api_url?: string;
    api_key?: string;
    [key: string]: any;
  };
  configured_by: string;
  is_active: boolean;
  scope: string;
  created_at: string;
  updated_at: string;
}

interface NotificationHistory {
  id: string;
  team_id: string;
  transport_id: string;
  event_type: string;
  payload: any;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

const Notifications = () => {
  const { userProfile } = useAuth();
  const {
    transports,
    notifications,
    loading,
    createTransport,
    updateTransport,
    deleteTransport,
    testTransport,
    retryNotification,
    fetchTransports,
    fetchNotifications
  } = useNotifications();

  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("transports");

  // États pour les modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransport, setSelectedTransport] = useState<NotificationTransport | null>(null);

  // État pour le formulaire
  const [formData, setFormData] = useState({
    channel: "smtp",
    scope: "alerts",
    config: {} as Record<string, any>,
    is_active: true
  });

  useEffect(() => {
    if (sessionContext?.current_team_id) {
      fetchTransports();
      fetchNotifications();
    }
  }, [sessionContext, fetchTransports, fetchNotifications]);

  const resetForm = () => {
    setFormData({
      channel: "smtp",
      scope: "alerts",
      config: {},
      is_active: true
    });
    setSelectedTransport(null);
  };

  const handleSubmit = async () => {
    try {
      if (selectedTransport) {
        await updateTransport(selectedTransport.id, formData);
        setIsEditModalOpen(false);
      } else {
        await createTransport(formData);
        setIsCreateModalOpen(false);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving transport:', error);
    }
  };

  const handleEdit = (transport: any) => {
    setSelectedTransport(transport);
    setFormData({
      channel: transport.channel,
      scope: transport.scope,
      config: (transport.config as any) || {},
      is_active: transport.is_active
    });
    setIsEditModalOpen(true);
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "smtp":
      case "transactional_email":
        return Mail;
      case "slack":
        return MessageSquare;
      case "teams":
        return MessageSquare;
      case "api":
        return Webhook;
      default:
        return Bell;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent": return "default";
      case "failed": return "destructive";
      case "pending": return "secondary";
      default: return "outline";
    }
  };

  const filteredTransports = transports.filter(transport => {
    const matchesSearch = transport.channel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transport.scope.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChannel = channelFilter === "all" || transport.channel === channelFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && transport.is_active) ||
                         (statusFilter === "inactive" && !transport.is_active);

    return matchesSearch && matchesChannel && matchesStatus;
  });

  const stats = [
    {
      title: "Transports actifs",
      value: transports.filter(t => t.is_active).length.toString(),
      icon: Bell,
      color: "text-green-500"
    },
    {
      title: "Notifications envoyées",
      value: notifications.filter(h => h.status === 'sent').length.toString(),
      icon: Send,
      color: "text-blue-500"
    },
    {
      title: "Échecs",
      value: notifications.filter(h => h.status === 'failed').length.toString(),
      icon: XCircle,
      color: "text-red-500"
    },
    {
      title: "En attente",
      value: notifications.filter(h => h.status === 'pending').length.toString(),
      icon: Clock,
      color: "text-yellow-500"
    }
  ];

  const renderConfigForm = () => {
    switch (formData.channel) {
      case "smtp":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtp_host">Serveur SMTP</Label>
                <Input
                  id="smtp_host"
                  value={formData.config.smtp_host || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, smtp_host: e.target.value }
                  })}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <Label htmlFor="smtp_port">Port</Label>
                <Input
                  id="smtp_port"
                  type="number"
                  value={formData.config.smtp_port || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, smtp_port: parseInt(e.target.value) }
                  })}
                  placeholder="587"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="smtp_user">Utilisateur</Label>
              <Input
                id="smtp_user"
                value={formData.config.smtp_user || ""}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, smtp_user: e.target.value }
                })}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="smtp_password">Mot de passe</Label>
              <Input
                id="smtp_password"
                type="password"
                value={formData.config.smtp_password || ""}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, smtp_password: e.target.value }
                })}
              />
            </div>
            <div>
              <Label htmlFor="from_email">Email expéditeur</Label>
              <Input
                id="from_email"
                value={formData.config.from_email || ""}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, from_email: e.target.value }
                })}
                placeholder="noreply@example.com"
              />
            </div>
            <div>
              <Label htmlFor="to_email">Email destinataire</Label>
              <Input
                id="to_email"
                value={formData.config.to_email || ""}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, to_email: e.target.value }
                })}
                placeholder="admin@example.com"
              />
            </div>
          </div>
        );

      case "slack":
        return (
          <div>
            <Label htmlFor="slack_webhook">Webhook URL Slack</Label>
            <Input
              id="slack_webhook"
              value={formData.config.slack_webhook || ""}
              onChange={(e) => setFormData({
                ...formData,
                config: { ...formData.config, slack_webhook: e.target.value }
              })}
              placeholder="https://hooks.slack.com/services/..."
            />
          </div>
        );

      case "teams":
        return (
          <div>
            <Label htmlFor="teams_webhook">Webhook URL Teams</Label>
            <Input
              id="teams_webhook"
              value={formData.config.teams_webhook || ""}
              onChange={(e) => setFormData({
                ...formData,
                config: { ...formData.config, teams_webhook: e.target.value }
              })}
              placeholder="https://outlook.office.com/webhook/..."
            />
          </div>
        );

      case "api":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="api_url">URL de l'API</Label>
              <Input
                id="api_url"
                value={formData.config.api_url || ""}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, api_url: e.target.value }
                })}
                placeholder="https://api.example.com/notifications"
              />
            </div>
            <div>
              <Label htmlFor="api_key">Clé API</Label>
              <Input
                id="api_key"
                type="password"
                value={formData.config.api_key || ""}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, api_key: e.target.value }
                })}
                placeholder="API Key"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading && transports.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Notifications"
          description="Configuration et historique des notifications"
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Configuration et historique des notifications"
        action={{
          label: "Nouveau transport",
          icon: Plus,
          onClick: () => setIsCreateModalOpen(true)
        }}
      />

      {/* Statistiques */}
      <DataGrid columns={4}>
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </DataGrid>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="transports">Transports</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="transports" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Transports de notification</CardTitle>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un transport..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="smtp">SMTP</SelectItem>
                    <SelectItem value="slack">Slack</SelectItem>
                    <SelectItem value="teams">Teams</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredTransports.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="Aucun transport trouvé"
                  description="Aucun transport ne correspond à vos critères"
                />
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Canal</TableHead>
                        <TableHead>Portée</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Créé le</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransports.map((transport) => {
                        const ChannelIcon = getChannelIcon(transport.channel);
                        return (
                          <TableRow key={transport.id}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <ChannelIcon className="h-4 w-4" />
                                <span className="font-medium">{transport.channel}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {transport.scope}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={transport.is_active ? "default" : "secondary"}>
                                {transport.is_active ? "Actif" : "Inactif"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(transport.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => testTransport(transport.id)}
                                  disabled={!transport.is_active}
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(transport)}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteTransport(transport.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique des notifications</CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="Aucune notification"
                  description="Aucune notification n'a été envoyée"
                />
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type d'événement</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notifications.map((notification) => (
                        <TableRow key={notification.id}>
                          <TableCell>
                            <Badge variant="outline">
                              {notification.event_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(notification.status)}>
                              {notification.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(notification.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {notification.status === 'failed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => retryNotification(notification.id)}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de création */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouveau transport de notification</DialogTitle>
            <DialogDescription>
              Configurez un nouveau canal de notification pour votre équipe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="channel">Canal</Label>
                <Select 
                  value={formData.channel} 
                  onValueChange={(value) => setFormData({ ...formData, channel: value, config: {} })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smtp">SMTP</SelectItem>
                    <SelectItem value="transactional_email">Email transactionnel</SelectItem>
                    <SelectItem value="slack">Slack</SelectItem>
                    <SelectItem value="teams">Microsoft Teams</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="scope">Portée</Label>
                <Select 
                  value={formData.scope} 
                  onValueChange={(value) => setFormData({ ...formData, scope: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une portée" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alerts">Alertes</SelectItem>
                    <SelectItem value="monitoring">Monitoring</SelectItem>
                    <SelectItem value="itsm">ITSM</SelectItem>
                    <SelectItem value="all">Tout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {renderConfigForm()}

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Transport actif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal d'édition */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le transport</DialogTitle>
            <DialogDescription>
              Modifiez la configuration de ce transport de notification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="channel">Canal</Label>
                <Select 
                  value={formData.channel} 
                  onValueChange={(value) => setFormData({ ...formData, channel: value, config: {} })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smtp">SMTP</SelectItem>
                    <SelectItem value="transactional_email">Email transactionnel</SelectItem>
                    <SelectItem value="slack">Slack</SelectItem>
                    <SelectItem value="teams">Microsoft Teams</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="scope">Portée</Label>
                <Select 
                  value={formData.scope} 
                  onValueChange={(value) => setFormData({ ...formData, scope: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une portée" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alerts">Alertes</SelectItem>
                    <SelectItem value="monitoring">Monitoring</SelectItem>
                    <SelectItem value="itsm">ITSM</SelectItem>
                    <SelectItem value="all">Tout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {renderConfigForm()}

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Transport actif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit}>
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notifications;