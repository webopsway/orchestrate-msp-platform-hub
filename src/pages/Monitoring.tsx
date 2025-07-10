import React, { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatsCard } from "@/components/common/StatsCard";
import { SearchAndFilters } from "@/components/common/SearchAndFilters";
import { DataGrid } from "@/components/common/DataGrid";
import { ActionCard } from "@/components/common/ActionCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMonitoring } from "@/hooks/useMonitoring";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Server,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Zap,
  Plus,
  Play,
  Eye,
  Trash2
} from "lucide-react";

const Monitoring = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [newUptimeCheck, setNewUptimeCheck] = useState({
    name: "",
    url: "",
    method: "GET",
    check_interval: 300,
    timeout_seconds: 30
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const { 
    alerts, 
    uptimeChecks, 
    stats, 
    loading, 
    error, 
    createUptimeCheck, 
    acknowledgeAlert, 
    runUptimeCheck, 
    deleteUptimeCheck 
  } = useMonitoring();

  const handleCreateUptimeCheck = async () => {
    if (!newUptimeCheck.name || !newUptimeCheck.url) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const { error } = await createUptimeCheck(newUptimeCheck);
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Uptime check created successfully"
      });
      setIsCreateDialogOpen(false);
      setNewUptimeCheck({
        name: "",
        url: "",
        method: "GET",
        check_interval: 300,
        timeout_seconds: 30
      });
    }
  };

  const handleAcknowledgeAlert = async (id: string) => {
    const { error } = await acknowledgeAlert(id);
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Alert acknowledged"
      });
    }
  };

  const handleRunCheck = async (id: string) => {
    const { error } = await runUptimeCheck(id);
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Check executed successfully"
      });
    }
  };

  const handleDeleteCheck = async (id: string) => {
    const { error } = await deleteUptimeCheck(id);
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Uptime check deleted"
      });
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "up":
        return "bg-green-100 text-green-800 border-green-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "down":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getMetricClass = (value: string | number): string => {
    if (typeof value === 'string' && (value.includes("Timeout") || value.includes("Error"))) {
      return "text-red-600";
    }
    const numValue = typeof value === 'string' ? parseInt(value) : value;
    if (numValue > 1000) {
      return "text-red-600";
    }
    if (numValue > 500) {
      return "text-yellow-600";
    }
    return "text-green-600";
  };

  const filteredUptimeChecks = uptimeChecks.filter(check =>
    check.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    check.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    check.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAlerts = alerts.filter(alert =>
    alert.alert_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (alert.message && alert.message.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Chart data for response times
  const chartData = uptimeChecks
    .filter(check => check.response_time)
    .slice(0, 10)
    .map(check => ({
      name: check.name.substring(0, 15) + '...',
      responseTime: check.response_time || 0
    }));

  const statsCards = [
    {
      title: "Active Alerts",
      value: stats.activeAlerts.toString(),
      description: "Critical issues requiring attention",
      icon: AlertTriangle,
      trend: `${stats.totalAlerts - stats.activeAlerts} resolved`
    },
    {
      title: "Uptime Checks",
      value: stats.uptimeChecks.toString(),
      description: "Services being monitored",
      icon: CheckCircle,
      trend: `${uptimeChecks.filter(c => c.status === 'up').length} up`
    },
    {
      title: "Avg Response Time",
      value: `${stats.avgResponseTime}ms`,
      description: "Average response time",
      icon: Clock,
      trend: "Last 24 hours"
    },
    {
      title: "Total Alerts",
      value: stats.totalAlerts.toString(),
      description: "All alerts in system",
      icon: TrendingUp,
      trend: "All time"
    }
  ];

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Monitoring"
        description="Monitor system health, performance metrics, and service availability"
      />
      
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Uptime Check
          </Button>
        </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Uptime Check</DialogTitle>
                <DialogDescription>
                  Add a new uptime check to monitor service availability
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="My API Service"
                    value={newUptimeCheck.name}
                    onChange={(e) => setNewUptimeCheck(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    placeholder="https://api.example.com/health"
                    value={newUptimeCheck.url}
                    onChange={(e) => setNewUptimeCheck(prev => ({ ...prev, url: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="method">Method</Label>
                  <Select value={newUptimeCheck.method} onValueChange={(value) => setNewUptimeCheck(prev => ({ ...prev, method: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="HEAD">HEAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interval">Check Interval (seconds)</Label>
                    <Input
                      id="interval"
                      type="number"
                      value={newUptimeCheck.check_interval}
                      onChange={(e) => setNewUptimeCheck(prev => ({ ...prev, check_interval: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeout">Timeout (seconds)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      value={newUptimeCheck.timeout_seconds}
                      onChange={(e) => setNewUptimeCheck(prev => ({ ...prev, timeout_seconds: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateUptimeCheck}>
                  Create Check
                </Button>
              </DialogFooter>
            </DialogContent>
      </Dialog>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Search and Filters */}
      <SearchAndFilters
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search checks, alerts, or status..."
      />

      {/* Response Time Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Response Time Trends
            </CardTitle>
            <CardDescription>
              Recent response times across monitored services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="responseTime" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Uptime Checks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Uptime Checks
            </CardTitle>
            <CardDescription>
              Real-time monitoring of all services and endpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUptimeChecks.map((check) => (
                <div
                  key={check.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <span className="font-medium">{check.name}</span>
                    </div>
                    <Badge className={`${getStatusColor(check.status)} border`}>
                      {check.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-sm text-muted-foreground text-right">
                      <div className={`font-medium ${getMetricClass(check.response_time || 0)}`}>
                        {check.response_time ? `${check.response_time}ms` : 'N/A'}
                      </div>
                      <div>Response Time</div>
                    </div>
                    <div className="text-sm text-muted-foreground text-right">
                      <div className="font-medium">{check.status_code || 'N/A'}</div>
                      <div>Status Code</div>
                    </div>
                    <div className="text-sm text-muted-foreground text-right">
                      <div className="font-medium">
                        {check.checked_at ? new Date(check.checked_at).toLocaleTimeString() : 'Never'}
                      </div>
                      <div>Last Check</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleRunCheck(check.id)}>
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteCheck(check.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredUptimeChecks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No uptime checks found. Create your first check to start monitoring.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts and Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActionCard
          icon={AlertCircle}
          title="Recent Alerts"
          description="Latest system alerts and notifications"
        >
          <div className="space-y-3">
            {filteredAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  alert.severity === 'high' ? 'bg-red-50 border-red-200' :
                  alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`h-4 w-4 ${
                    alert.severity === 'high' ? 'text-red-600' :
                    alert.severity === 'medium' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`} />
                  <div>
                    <div className={`font-medium ${
                      alert.severity === 'high' ? 'text-red-900' :
                      alert.severity === 'medium' ? 'text-yellow-900' :
                      'text-blue-900'
                    }`}>
                      {alert.alert_name}
                    </div>
                    <div className={`text-sm ${
                      alert.severity === 'high' ? 'text-red-700' :
                      alert.severity === 'medium' ? 'text-yellow-700' :
                      'text-blue-700'
                    }`}>
                      {alert.message?.substring(0, 50)}...
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className={`${
                    alert.severity === 'high' ? 'bg-red-100 text-red-800 border-red-200' :
                    alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                    'bg-blue-100 text-blue-800 border-blue-200'
                  } border`}>
                    {alert.severity}
                  </Badge>
                  {alert.status === 'active' && (
                    <Button size="sm" variant="outline" onClick={() => handleAcknowledgeAlert(alert.id)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {filteredAlerts.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No recent alerts
              </div>
            )}
          </div>
        </ActionCard>

        <ActionCard
          icon={TrendingUp}
          title="Performance Overview"
          description="System performance metrics summary"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Services Up</span>
              <span className="text-sm text-muted-foreground">
                {uptimeChecks.filter(c => c.status === 'up').length}/{uptimeChecks.length}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-600 rounded-full" 
                style={{ 
                  width: uptimeChecks.length > 0 
                    ? `${(uptimeChecks.filter(c => c.status === 'up').length / uptimeChecks.length) * 100}%` 
                    : '0%' 
                }} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Avg Response Time</span>
              <span className="text-sm text-muted-foreground">{stats.avgResponseTime}ms</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  stats.avgResponseTime > 1000 ? 'bg-red-600' :
                  stats.avgResponseTime > 500 ? 'bg-yellow-600' :
                  'bg-green-600'
                }`}
                style={{ width: Math.min((stats.avgResponseTime / 1000) * 100, 100) + '%' }} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Alerts</span>
              <span className="text-sm text-muted-foreground">{stats.activeAlerts}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-600 rounded-full" 
                style={{ width: stats.totalAlerts > 0 ? `${(stats.activeAlerts / stats.totalAlerts) * 100}%` : '0%' }} 
              />
            </div>
            
            <div className="pt-2 text-xs text-muted-foreground">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </ActionCard>
      </div>
    </div>
  );
};

export default Monitoring;