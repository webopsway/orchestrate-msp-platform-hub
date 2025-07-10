import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  BarChart3, 
  Activity, 
  Server, 
  Globe, 
  Plus, 
  Search, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Settings,
  Trash2,
  Eye,
  RefreshCw,
  Zap,
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { toast } from "sonner";

interface UptimeCheck {
  id: string;
  team_id: string;
  name: string;
  url: string;
  method: string;
  status: 'up' | 'down' | 'unknown';
  response_time: number;
  status_code: number;
  checked_at: string;
  next_check: string;
  check_interval: number;
  timeout_seconds: number;
  expected_status_codes: number[];
  metadata: any;
  created_at: string;
  updated_at: string;
}

interface MetricData {
  timestamp: string;
  value: number;
  label: string;
}

interface NotificationConfig {
  id: string;
  team_id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: {
    email?: string;
    slack_webhook?: string;
    webhook_url?: string;
    phone?: string;
    [key: string]: any;
  };
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

const Monitoring = () => {
  const { sessionContext } = useAuth();
  const [uptimeChecks, setUptimeChecks] = useState<UptimeCheck[]>([]);
  const [notifications, setNotifications] = useState<NotificationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("overview");

  // État pour les modals
  const [isUptimeModalOpen, setIsUptimeModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<UptimeCheck | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // État pour les formulaires
  const [newUptimeCheck, setNewUptimeCheck] = useState({
    name: "",
    url: "",
    method: "GET",
    check_interval: 300,
    timeout_seconds: 30,
    expected_status_codes: [200]
  });

  const [newNotification, setNewNotification] = useState({
    name: "",
    type: "email" as const,
    config: {} as Record<string, any>,
    enabled: true
  });

  // Données simulées pour les graphiques
  const [cpuData, setCpuData] = useState<MetricData[]>([]);
  const [memoryData, setMemoryData] = useState<MetricData[]>([]);
  const [networkData, setNetworkData] = useState<MetricData[]>([]);

  useEffect(() => {
    fetchMonitoringData();
    generateMockMetrics();
  }, [sessionContext]);

  const fetchMonitoringData = async () => {
    if (!sessionContext?.current_team_id) return;

    try {
      setLoading(true);
      
      // Récupérer les uptime checks
      const { data: uptimeData, error: uptimeError } = await supabase
        .from('uptime_checks')
        .select('*')
        .eq('team_id', sessionContext.current_team_id);

      if (uptimeError) throw uptimeError;
      setUptimeChecks((uptimeData as any) || []);

      // Récupérer les notifications
      const { data: notificationData, error: notificationError } = await supabase
        .from('notification_transports')
        .select('*')
        .eq('team_id', sessionContext.current_team_id);

      if (notificationError) throw notificationError;
      setNotifications((notificationData as any) || []);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const generateMockMetrics = () => {
    const now = new Date();
    const data: MetricData[] = [];
    
    for (let i = 24; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({
        timestamp: timestamp.toISOString(),
        value: Math.random() * 100,
        label: timestamp.toLocaleTimeString()
      });
    }
    
    setCpuData(data.map(d => ({ ...d, value: 20 + Math.random() * 60 })));
    setMemoryData(data.map(d => ({ ...d, value: 40 + Math.random() * 40 })));
    setNetworkData(data.map(d => ({ ...d, value: Math.random() * 100 })));
  };

  const createUptimeCheck = async () => {
    if (!sessionContext?.current_team_id) return;

    try {
      setLoading(true);
      
      const checkData = {
        team_id: sessionContext.current_team_id,
        name: newUptimeCheck.name,
        url: newUptimeCheck.url,
        method: newUptimeCheck.method,
        check_interval: newUptimeCheck.check_interval,
        timeout_seconds: newUptimeCheck.timeout_seconds,
        expected_status_codes: newUptimeCheck.expected_status_codes,
        status: 'unknown' as const
      };
      
      const { data, error } = await supabase
        .from('uptime_checks')
        .insert([checkData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Uptime check créé avec succès');
      setIsUptimeModalOpen(false);
      resetUptimeForm();
      fetchMonitoringData();
    } catch (error) {
      console.error('Error creating uptime check:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const createNotification = async () => {
    if (!sessionContext?.current_team_id) return;

    try {
      setLoading(true);
      
      const notificationData = {
        team_id: sessionContext.current_team_id,
        name: newNotification.name,
        type: newNotification.type,
        config: newNotification.config,
        enabled: newNotification.enabled
      };
      
      const notificationInsert = {
        team_id: sessionContext.current_team_id,
        channel: newNotification.type,
        config: newNotification.config,
        configured_by: '00000000-0000-0000-0000-000000000000',
        scope: 'alerts',
        is_active: newNotification.enabled
      };
      
      const { data, error } = await supabase
        .from('notification_transports')
        .insert([notificationInsert])
        .select()
        .single();

      if (error) throw error;

      toast.success('Notification créée avec succès');
      setIsNotificationModalOpen(false);
      resetNotificationForm();
      fetchMonitoringData();
    } catch (error) {
      console.error('Error creating notification:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const resetUptimeForm = () => {
    setNewUptimeCheck({
      name: "",
      url: "",
      method: "GET",
      check_interval: 300,
      timeout_seconds: 30,
      expected_status_codes: [200]
    });
    setSelectedCheck(null);
    setIsEditing(false);
  };

  const resetNotificationForm = () => {
    setNewNotification({
      name: "",
      type: "email",
      config: {},
      enabled: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "up": return "default";
      case "down": return "destructive";
      case "unknown": return "outline";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "up": return <CheckCircle className="h-4 w-4" />;
      case "down": return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getResponseTimeColor = (time: number) => {
    if (time < 1000) return "text-green-500";
    if (time < 3000) return "text-yellow-500";
    return "text-red-500";
  };

  const filteredUptimeChecks = uptimeChecks.filter(check => {
    const matchesSearch = check.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         check.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || check.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = [
    {
      title: "Uptime checks",
      value: uptimeChecks.length.toString(),
      icon: Globe,
      color: "text-blue-500"
    },
    {
      title: "Services up",
      value: uptimeChecks.filter(c => c.status === 'up').length.toString(),
      icon: CheckCircle,
      color: "text-green-500"
    },
    {
      title: "Services down",
      value: uptimeChecks.filter(c => c.status === 'down').length.toString(),
      icon: XCircle,
      color: "text-red-500"
    },
    {
      title: "Notifications",
      value: notifications.filter(n => n.enabled).length.toString(),
      icon: Activity,
      color: "text-purple-500"
    }
  ];

  const SimpleChart = ({ data, title, color }: { data: MetricData[], title: string, color: string }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-sm text-muted-foreground">
          {data[data.length - 1]?.value.toFixed(1)}%
        </span>
      </div>
      <div className="h-20 flex items-end space-x-1">
        {data.slice(-12).map((point, i) => (
          <div
            key={i}
            className="flex-1 bg-muted rounded-t"
            style={{
              height: `${point.value}%`,
              backgroundColor: color
            }}
          />
        ))}
      </div>
    </div>
  );

  if (loading && uptimeChecks.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Monitoring"
          description="Surveillance et métriques des services"
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
        title="Monitoring"
        description="Surveillance et métriques des services"
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

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="uptime">Uptime Checks</TabsTrigger>
          <TabsTrigger value="metrics">Métriques</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Graphiques de métriques */}
            <Card>
              <CardHeader>
                <CardTitle>Métriques système</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <SimpleChart data={cpuData} title="CPU" color="#3b82f6" />
                <SimpleChart data={memoryData} title="Mémoire" color="#10b981" />
                <SimpleChart data={networkData} title="Réseau" color="#f59e0b" />
              </CardContent>
            </Card>

            {/* Statut des services */}
            <Card>
              <CardHeader>
                <CardTitle>Statut des services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {uptimeChecks.slice(0, 5).map((check) => (
                    <div key={check.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(check.status)}
                        <div>
                          <p className="font-medium">{check.name}</p>
                          <p className="text-sm text-muted-foreground">{check.url}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getStatusColor(check.status)}>
                          {check.status}
                        </Badge>
                        <p className={`text-sm ${getResponseTimeColor(check.response_time)}`}>
                          {check.response_time}ms
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="uptime" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Uptime Checks</CardTitle>
                <Button onClick={() => setIsUptimeModalOpen(true)}>
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
                      placeholder="Rechercher un check..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="up">Up</SelectItem>
                    <SelectItem value="down">Down</SelectItem>
                    <SelectItem value="unknown">Inconnu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredUptimeChecks.length === 0 ? (
                <EmptyState
                  icon={Globe}
                  title="Aucun uptime check"
                  description="Configurez vos premiers checks de disponibilité"
                />
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Temps de réponse</TableHead>
                        <TableHead>Dernier check</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUptimeChecks.map((check) => (
                        <TableRow key={check.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{check.name}</p>
                              <p className="text-sm text-muted-foreground">{check.method}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-mono">{check.url}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(check.status)}
                              <Badge variant={getStatusColor(check.status)}>
                                {check.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`text-sm ${getResponseTimeColor(check.response_time)}`}>
                              {check.response_time}ms
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <span className="text-sm">
                                {new Date(check.checked_at).toLocaleString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

        <TabsContent value="metrics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>CPU - 24h</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleChart data={cpuData} title="Utilisation CPU" color="#3b82f6" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Mémoire - 24h</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleChart data={memoryData} title="Utilisation mémoire" color="#10b981" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Configuration des notifications</CardTitle>
                <Button onClick={() => setIsNotificationModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="Aucune notification"
                  description="Configurez vos premiers canaux de notification"
                />
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${notification.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <Activity className={`h-4 w-4 ${notification.enabled ? 'text-green-600' : 'text-gray-600'}`} />
                        </div>
                        <div>
                          <p className="font-medium">{notification.name}</p>
                          <p className="text-sm text-muted-foreground">{notification.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch checked={notification.enabled} />
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Uptime Check */}
      <Dialog open={isUptimeModalOpen} onOpenChange={setIsUptimeModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajouter un uptime check</DialogTitle>
            <DialogDescription>
              Configurez la surveillance d'un service
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="check-name">Nom</Label>
              <Input
                id="check-name"
                value={newUptimeCheck.name}
                onChange={(e) => setNewUptimeCheck({...newUptimeCheck, name: e.target.value})}
                placeholder="Mon service web"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="check-url">URL</Label>
              <Input
                id="check-url"
                value={newUptimeCheck.url}
                onChange={(e) => setNewUptimeCheck({...newUptimeCheck, url: e.target.value})}
                placeholder="https://example.com"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="check-method">Méthode</Label>
                <Select value={newUptimeCheck.method} onValueChange={(value) => setNewUptimeCheck({...newUptimeCheck, method: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="HEAD">HEAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="check-interval">Intervalle (secondes)</Label>
                <Input
                  id="check-interval"
                  type="number"
                  value={newUptimeCheck.check_interval}
                  onChange={(e) => setNewUptimeCheck({...newUptimeCheck, check_interval: parseInt(e.target.value)})}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsUptimeModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={createUptimeCheck} disabled={!newUptimeCheck.name || !newUptimeCheck.url}>
                Créer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Notification */}
      <Dialog open={isNotificationModalOpen} onOpenChange={setIsNotificationModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajouter une notification</DialogTitle>
            <DialogDescription>
              Configurez un canal de notification
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notification-name">Nom</Label>
              <Input
                id="notification-name"
                value={newNotification.name}
                onChange={(e) => setNewNotification({...newNotification, name: e.target.value})}
                placeholder="Mon équipe"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notification-type">Type</Label>
              <Select value={newNotification.type} onValueChange={(value: any) => setNewNotification({...newNotification, type: value, config: {}})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="slack">Slack</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newNotification.type === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="notification-email">Email</Label>
                <Input
                  id="notification-email"
                  type="email"
                  value={newNotification.config.email || ''}
                  onChange={(e) => setNewNotification({
                    ...newNotification, 
                    config: {...newNotification.config, email: e.target.value}
                  })}
                  placeholder="equipe@example.com"
                />
              </div>
            )}

            {(newNotification.type as string) === 'slack' && (
              <div className="space-y-2">
                <Label htmlFor="notification-webhook">Webhook Slack</Label>
                <Input
                  id="notification-webhook"
                  value={newNotification.config.slack_webhook || ''}
                  onChange={(e) => setNewNotification({
                    ...newNotification, 
                    config: {...newNotification.config, slack_webhook: e.target.value}
                  })}
                  placeholder="https://hooks.slack.com/services/..."
                />
              </div>
            )}

            {(newNotification.type as string) === 'webhook' && (
              <div className="space-y-2">
                <Label htmlFor="notification-webhook-url">URL Webhook</Label>
                <Input
                  id="notification-webhook-url"
                  value={newNotification.config.webhook_url || ''}
                  onChange={(e) => setNewNotification({
                    ...newNotification, 
                    config: {...newNotification.config, webhook_url: e.target.value}
                  })}
                  placeholder="https://api.example.com/webhook"
                />
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsNotificationModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={createNotification} disabled={!newNotification.name}>
                Créer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Monitoring;