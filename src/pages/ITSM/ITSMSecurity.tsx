import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  PageHeader, 
  DataGrid,
  CreateDialog,
  EditDialog,
  DeleteDialog,
  DetailDialog
} from "@/components/common";
import { CommentsSection } from "@/components/itsm/CommentsSection";
import { useITSMCrud } from "@/hooks/useITSMCrud";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  Plus, 
  Search, 
  User,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { toast } from "sonner";

interface SecurityVulnerability {
  id: string;
  title: string;
  description: string;
  cve_id?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: string;
  discovered_at: string;
  remediated_at?: string;
  cloud_asset_id?: string;
  affected_instances?: string[];
  metadata?: any;
}

const ITSMSecurity = () => {
  const { userProfile, user } = useAuth();
  const [vulnerabilities, setVulnerabilities] = useState<SecurityVulnerability[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const fetchVulnerabilities = async () => {
    if (!user) {
      console.log('No user available, skipping vulnerabilities load');
      setVulnerabilities([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Check if user is MSP admin directly from auth context
      const { data: profile } = await supabase.from('profiles')
        .select('is_msp_admin, default_organization_id, default_team_id')
        .eq('id', user.id)
        .single();
      
      // For MSP admins, create a minimal session context if none exists
      let workingSessionContext = userProfile;
      if (!workingSessionContext && profile?.is_msp_admin) {
        console.log('Creating temporary MSP session context for vulnerabilities loading');
        workingSessionContext = {
          id: user.id,
          email: user.email || '',
          default_organization_id: profile.default_organization_id,
          default_team_id: profile.default_team_id,
          is_msp_admin: true
        };
      }

      let query = supabase
        .from('security_vulnerabilities')
        .select('*');

      // Filter by team if not MSP admin
      const teamId = workingSessionContext?.default_team_id;
      if (teamId && !workingSessionContext?.is_msp_admin) {
        query = query.eq('team_id', teamId);
      }

      const { data, error } = await query.order('discovered_at', { ascending: false });

      if (error) throw error;
      setVulnerabilities((data || []) as SecurityVulnerability[]);
    } catch (error) {
      console.error('Error fetching vulnerabilities:', error);
      toast.error('Erreur lors du chargement des vulnérabilités');
    } finally {
      setLoading(false);
    }
  };

  const {
    selectedItem: selectedVulnerability,
    isCreateOpen,
    isEditOpen,
    isDeleteOpen,
    isDetailOpen,
    openCreate,
    openEdit,
    openDelete,
    openDetail,
    closeAll,
    handleCreate,
    handleUpdate,
    handleDelete
  } = useITSMCrud<SecurityVulnerability>({ onRefresh: fetchVulnerabilities });

  useEffect(() => {
    if (user) {
      fetchVulnerabilities();
    }
  }, [user, userProfile]);

  const updateVulnerabilityStatus = async (vulnId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'resolved') {
        updateData.remediated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('security_vulnerabilities')
        .update(updateData)
        .eq('id', vulnId);

      if (error) throw error;

      toast.success('Statut mis à jour');
      fetchVulnerabilities();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "secondary";
      case "medium": return "default";
      case "low": return "outline";
      default: return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
      case "closed":
        return "default";
      case "in_progress":
        return "secondary";
      case "open":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
      case "closed":
        return <CheckCircle className="h-4 w-4" />;
      case "in_progress":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const filteredVulnerabilities = vulnerabilities.filter(vuln => {
    const matchesSearch = vuln.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vuln.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (vuln.cve_id && vuln.cve_id.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || vuln.status === statusFilter;
    const matchesSeverity = severityFilter === "all" || vuln.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const stats = [
    {
      title: "Vulnérabilités critiques",
      value: vulnerabilities.filter(v => v.severity === 'critical' && ['open', 'in_progress'].includes(v.status)).length.toString(),
      icon: AlertTriangle,
      color: "text-red-500"
    },
    {
      title: "En cours de traitement",
      value: vulnerabilities.filter(v => v.status === 'in_progress').length.toString(),
      icon: Shield,
      color: "text-yellow-500"
    },
    {
      title: "Résolues",
      value: vulnerabilities.filter(v => ['resolved', 'closed'].includes(v.status)).length.toString(),
      icon: CheckCircle,
      color: "text-green-500"
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Sécurité"
          description="Gestion des vulnérabilités de sécurité"
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
        title="Sécurité"
        description="Gestion des vulnérabilités et incidents de sécurité"
        action={{
          label: "Créer une vulnérabilité",
          icon: Plus,
          onClick: openCreate
        }}
      />

      {/* Statistiques */}
      <DataGrid columns={3}>
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

      {/* Filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des vulnérabilités..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="open">Ouvert</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="resolved">Résolu</SelectItem>
                  <SelectItem value="closed">Fermé</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sévérité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Basse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tableau */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>CVE</TableHead>
                  <TableHead>Sévérité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Assigné</TableHead>
                  <TableHead>Découverte</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVulnerabilities.map((vuln) => (
                  <TableRow key={vuln.id}>
                    <TableCell className="font-mono text-sm">
                      SEC-{vuln.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{vuln.title}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {vuln.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {vuln.cve_id ? (
                        <Badge variant="outline" className="font-mono">
                          {vuln.cve_id}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSeverityColor(vuln.severity)}>
                        {vuln.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(vuln.status)}
                        <Badge variant={getStatusColor(vuln.status)}>
                          {vuln.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {vuln.assigned_to ? (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span className="text-sm">{vuln.assigned_to}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Non assigné</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">
                          {new Date(vuln.discovered_at).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetail(vuln)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(vuln)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDelete(vuln)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Formulaires CRUD */}
      <CreateDialog
        isOpen={isCreateOpen}
        onClose={closeAll}
        onCreate={async (data) => {
          const success = await handleCreate(async (formData) => {
            const { error } = await supabase
              .from('security_vulnerabilities')
              .insert([{
                ...formData,
                team_id: userProfile?.default_team_id
              }]);
            
            if (error) throw error;
            return true;
          }, data);
          
          return success;
        }}
        title="Créer une vulnérabilité"
        sections={[
          {
            title: "Informations générales",
            fields: [
              {
                key: "title",
                label: "Titre",
                type: "text",
                required: true,
                placeholder: "Titre de la vulnérabilité"
              },
              {
                key: "description",
                label: "Description",
                type: "textarea",
                placeholder: "Description détaillée de la vulnérabilité"
              },
              {
                key: "cve_id",
                label: "CVE ID",
                type: "text",
                placeholder: "CVE-YYYY-NNNN"
              }
            ]
          },
          {
            title: "Classification",
            fields: [
              {
                key: "severity",
                label: "Sévérité",
                type: "select",
                required: true,
                options: [
                  { value: "low", label: "Basse" },
                  { value: "medium", label: "Moyenne" },
                  { value: "high", label: "Haute" },
                  { value: "critical", label: "Critique" }
                ]
              },
              {
                key: "status",
                label: "Statut",
                type: "select",
                required: true,
                options: [
                  { value: "open", label: "Ouvert" },
                  { value: "in_progress", label: "En cours" },
                  { value: "resolved", label: "Résolu" },
                  { value: "closed", label: "Fermé" }
                ]
              }
            ]
          }
        ]}
      />

      <EditDialog
        isOpen={isEditOpen}
        onClose={closeAll}
        onSave={async (data) => {
          const success = await handleUpdate(async (formData) => {
            const { error } = await supabase
              .from('security_vulnerabilities')
              .update(formData)
              .eq('id', selectedVulnerability?.id);
            
            if (error) throw error;
            return true;
          }, data);
          
          return success;
        }}
        title="Modifier la vulnérabilité"
        data={selectedVulnerability}
        sections={[
          {
            title: "Informations générales",
            fields: [
              {
                key: "title",
                label: "Titre",
                type: "text",
                required: true
              },
              {
                key: "description",
                label: "Description",
                type: "textarea"
              },
              {
                key: "cve_id",
                label: "CVE ID",
                type: "text"
              }
            ]
          },
          {
            title: "Classification",
            fields: [
              {
                key: "severity",
                label: "Sévérité",
                type: "select",
                required: true,
                options: [
                  { value: "low", label: "Basse" },
                  { value: "medium", label: "Moyenne" },
                  { value: "high", label: "Haute" },
                  { value: "critical", label: "Critique" }
                ]
              },
              {
                key: "status",
                label: "Statut",
                type: "select",
                required: true,
                options: [
                  { value: "open", label: "Ouvert" },
                  { value: "in_progress", label: "En cours" },
                  { value: "resolved", label: "Résolu" },
                  { value: "closed", label: "Fermé" }
                ]
              }
            ]
          }
        ]}
      />

      <DeleteDialog
        isOpen={isDeleteOpen}
        onClose={closeAll}
        onDelete={async () => {
          return await handleDelete(async () => {
            const { error } = await supabase
              .from('security_vulnerabilities')
              .delete()
              .eq('id', selectedVulnerability?.id);
            
            if (error) throw error;
            return true;
          });
        }}
        title="Supprimer la vulnérabilité"
        itemName={selectedVulnerability?.title || ""}
        displayFields={[
          { key: "title", label: "Titre" },
          { key: "cve_id", label: "CVE ID" },
          { key: "severity", label: "Sévérité" },
          { key: "status", label: "Statut" },
          { key: "discovered_at", label: "Découverte le", render: (value) => new Date(value).toLocaleDateString() }
        ]}
        data={selectedVulnerability}
      />

      <DetailDialog
        isOpen={isDetailOpen}
        onClose={closeAll}
        title="Détails de la vulnérabilité"
        data={selectedVulnerability}
        sections={[
          {
            title: "Informations générales",
            fields: [
              { key: "title", label: "Titre", type: "text" },
              { key: "description", label: "Description", type: "text" },
              { key: "cve_id", label: "CVE ID", type: "text" },
              { key: "severity", label: "Sévérité", type: "badge" },
              { key: "status", label: "Statut", type: "badge" }
            ]
          },
          {
            title: "Suivi",
            fields: [
              { key: "assigned_to", label: "Assigné à", type: "text" },
              { key: "discovered_at", label: "Découverte le", type: "date" },
              { key: "remediated_at", label: "Corrigée le", type: "date" },
              { key: "cloud_asset_id", label: "Asset Cloud", type: "text" }
            ]
          }
        ]}
        className="max-w-4xl"
      />
    </div>
  );
};

export default ITSMSecurity;