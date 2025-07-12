import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  PageHeader, 
  DataGrid
} from "@/components/common";
import { CommentsSection } from "@/components/itsm/CommentsSection";
import { useITSMCrud } from "@/hooks/useITSMCrud";
import { VulnerabilityForm } from "@/components/forms/VulnerabilityForm";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Trash2,
  MessageSquare
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
  const { user, userProfile } = useAuth();
  const [vulnerabilities, setVulnerabilities] = useState<SecurityVulnerability[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const fetchVulnerabilities = useCallback(async () => {
    if (!user) {
      console.log('No user available, skipping vulnerabilities load');
      setVulnerabilities([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      console.log('🔍 Debug ITSMSecurity.fetchVulnerabilities:');
      console.log('User:', user.id);
      console.log('UserProfile:', userProfile);
      console.log('Is MSP Admin:', userProfile?.is_msp_admin);
      console.log('Default Team ID:', userProfile?.default_team_id);

      let query = supabase
        .from('security_vulnerabilities')
        .select('*');

      // Filter by team if not MSP admin
      if (!userProfile?.is_msp_admin && userProfile?.default_team_id) {
        console.log('🔍 Filtrage par équipe:', userProfile.default_team_id);
        query = query.eq('team_id', userProfile.default_team_id);
      } else if (userProfile?.is_msp_admin) {
        console.log('🔍 Admin MSP - pas de filtrage par équipe');
      } else {
        console.log('🔍 Pas d\'équipe par défaut et pas admin MSP');
      }

      const { data, error } = await query.order('discovered_at', { ascending: false });

      console.log('🔍 Résultat de la requête:');
      console.log('Data count:', data?.length || 0);
      console.log('Error:', error);
      console.log('Sample data:', data?.[0]);

      if (error) {
        console.error('Error fetching vulnerabilities:', error);
        toast.error('Erreur lors du chargement des vulnérabilités');
        setVulnerabilities([]);
        return;
      }
      
      setVulnerabilities((data || []) as SecurityVulnerability[]);
    } catch (error) {
      console.error('Error fetching vulnerabilities:', error);
      toast.error('Erreur lors du chargement des vulnérabilités');
      setVulnerabilities([]);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile]);

  const [selectedVulnerability, setSelectedVulnerability] = useState<SecurityVulnerability | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const openDetail = useCallback((vulnerability: SecurityVulnerability) => {
    setSelectedVulnerability(vulnerability);
    setIsDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedVulnerability(null);
    setIsDetailOpen(false);
  }, []);

  const openCreate = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  const openEdit = useCallback((vulnerability: SecurityVulnerability) => {
    setSelectedVulnerability(vulnerability);
    setIsEditOpen(true);
  }, []);

  const openDelete = useCallback((vulnerability: SecurityVulnerability) => {
    setSelectedVulnerability(vulnerability);
    setIsDeleteOpen(true);
  }, []);

  const closeAll = useCallback(() => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsDeleteOpen(false);
    setSelectedVulnerability(null);
  }, []);

  const handleCreate = useCallback(async (data: any): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('security_vulnerabilities')
        .insert([{
          ...data,
          team_id: userProfile?.default_team_id
        }]);
      
      if (error) throw error;
      
      toast.success('Vulnérabilité créée avec succès');
      await fetchVulnerabilities();
      closeAll();
      return true;
    } catch (error) {
      console.error('Error creating vulnerability:', error);
      toast.error('Erreur lors de la création');
      return false;
    }
  }, [userProfile, fetchVulnerabilities, closeAll]);

  const handleUpdate = useCallback(async (data: any): Promise<boolean> => {
    if (!selectedVulnerability) return false;
    
    try {
      const { error } = await supabase
        .from('security_vulnerabilities')
        .update(data)
        .eq('id', selectedVulnerability.id);
      
      if (error) throw error;
      
      toast.success('Vulnérabilité mise à jour avec succès');
      await fetchVulnerabilities();
      closeAll();
      return true;
    } catch (error) {
      console.error('Error updating vulnerability:', error);
      toast.error('Erreur lors de la mise à jour');
      return false;
    }
  }, [selectedVulnerability, fetchVulnerabilities, closeAll]);

  const handleDelete = useCallback(async () => {
    if (!selectedVulnerability) return;
    
    try {
      const { error } = await supabase
        .from('security_vulnerabilities')
        .delete()
        .eq('id', selectedVulnerability.id);
      
      if (error) throw error;
      
      toast.success('Vulnérabilité supprimée avec succès');
      await fetchVulnerabilities();
      closeAll();
    } catch (error) {
      console.error('Error deleting vulnerability:', error);
      toast.error('Erreur lors de la suppression');
    }
  }, [selectedVulnerability, fetchVulnerabilities, closeAll]);

  useEffect(() => {
    if (user) {
      fetchVulnerabilities();
    } else {
      setVulnerabilities([]);
      setLoading(false);
    }
  }, [user, userProfile, fetchVulnerabilities]);

  const updateVulnerabilityStatus = useCallback(async (vulnId: string, newStatus: string) => {
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
      await fetchVulnerabilities();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }, [fetchVulnerabilities]);

  const getSeverityColor = useCallback((severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "secondary";
      case "medium": return "default";
      case "low": return "outline";
      default: return "outline";
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
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
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "resolved":
      case "closed":
        return <CheckCircle className="h-4 w-4" />;
      case "in_progress":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  }, []);

  const filteredVulnerabilities = useMemo(() => {
    return vulnerabilities.filter(vuln => {
      const matchesSearch = vuln.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (vuln.description && vuln.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (vuln.cve_id && vuln.cve_id.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || vuln.status === statusFilter;
      const matchesSeverity = severityFilter === "all" || vuln.severity === severityFilter;

      return matchesSearch && matchesStatus && matchesSeverity;
    });
  }, [vulnerabilities, searchTerm, statusFilter, severityFilter]);

  const stats = useMemo(() => [
    {
      title: "Vulnérabilités ouvertes",
      value: vulnerabilities.filter(v => v.status === 'open').length.toString(),
      icon: AlertTriangle,
      color: "text-red-500"
    },
    {
      title: "En cours de traitement",
      value: vulnerabilities.filter(v => v.status === 'in_progress').length.toString(),
      icon: AlertCircle,
      color: "text-yellow-500"
    },
    {
      title: "Résolues",
      value: vulnerabilities.filter(v => ['resolved', 'closed'].includes(v.status)).length.toString(),
      icon: CheckCircle,
      color: "text-green-500"
    }
  ], [vulnerabilities]);

  // Si l'utilisateur n'est pas connecté
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Accès non autorisé</h3>
          <p className="text-muted-foreground">Vous devez être connecté pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  // Si le profil utilisateur n'est pas encore chargé, afficher le loading
  if (!userProfile) {
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

  // Vérifier les permissions d'accès
  const canManageSecurity = useMemo(() => {
    return userProfile?.is_msp_admin || userProfile?.default_team_id;
  }, [userProfile]);

  // Si l'utilisateur n'a pas les permissions
  if (!canManageSecurity) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Permissions insuffisantes</h3>
          <p className="text-muted-foreground">Vous n'avez pas les permissions nécessaires pour gérer la sécurité.</p>
        </div>
      </div>
    );
  }

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
        description="Gestion des vulnérabilités de sécurité"
        action={{
          label: "Ajouter une vulnérabilité",
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

      {/* Filtres et Tableau */}
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
                  <TableHead>CVE ID</TableHead>
                  <TableHead>Sévérité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date découverte</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVulnerabilities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucune vulnérabilité trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVulnerabilities.map((vuln) => (
                    <TableRow key={vuln.id}>
                      <TableCell className="font-mono text-sm">
                        VULN-{vuln.id.slice(0, 8)}
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
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getSeverityColor(vuln.severity)}>
                          {vuln.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(vuln.status)}>
                          {vuln.status}
                        </Badge>
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
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetail(vuln)}
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(vuln)}
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDelete(vuln)}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de création */}
      <Dialog open={isCreateOpen} onOpenChange={closeAll}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Ajouter une vulnérabilité</DialogTitle>
          </DialogHeader>
          <VulnerabilityForm
            onSubmit={handleCreate}
            onCancel={closeAll}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition */}
      <Dialog open={isEditOpen} onOpenChange={closeAll}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Modifier la vulnérabilité</DialogTitle>
          </DialogHeader>
          {selectedVulnerability && (
            <VulnerabilityForm
              initialData={{
                title: selectedVulnerability.title,
                description: selectedVulnerability.description,
                severity: selectedVulnerability.severity,
                status: selectedVulnerability.status,
                cve_id: selectedVulnerability.cve_id
              }}
              onSubmit={handleUpdate}
              onCancel={closeAll}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
      <Dialog open={isDeleteOpen} onOpenChange={closeAll}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la vulnérabilité</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Êtes-vous sûr de vouloir supprimer la vulnérabilité "{selectedVulnerability?.title}" ?
              Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={closeAll}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Supprimer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vue détaillée */}
      {selectedVulnerability && (
        <Dialog open={isDetailOpen} onOpenChange={closeDetail}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Détails de la vulnérabilité</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">CVE ID</h4>
                  <p className="text-muted-foreground">{selectedVulnerability.cve_id || "N/A"}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Sévérité</h4>
                  <Badge variant={getSeverityColor(selectedVulnerability.severity)}>
                    {selectedVulnerability.severity}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold">Statut</h4>
                  <Badge variant={getStatusColor(selectedVulnerability.status)}>
                    {selectedVulnerability.status}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold">Date de découverte</h4>
                  <p className="text-muted-foreground">
                    {new Date(selectedVulnerability.discovered_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-muted-foreground">{selectedVulnerability.description}</p>
              </div>
              
              <CommentsSection
                ticketId={selectedVulnerability.id}
                ticketType="vulnerability"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ITSMSecurity;