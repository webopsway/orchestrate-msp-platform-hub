import React, { useState } from "react";
import { Plus, Shield, Bug, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, DataGrid, EmptyState, DeleteDialog } from "@/components/common";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VulnerabilityCard } from "@/components/security/VulnerabilityCard";
import { VulnerabilityDetailDialog } from "@/components/security/VulnerabilityDetailDialog";
import { VulnerabilityForm } from "@/components/forms/VulnerabilityForm";
import { useVulnerabilities } from "@/hooks/useVulnerabilities";

const Vulnerabilities = () => {
  const {
    vulnerabilities,
    loading,
    createVulnerability,
    updateVulnerability,
    deleteVulnerability,
    scanVulnerabilities,
  } = useVulnerabilities();

  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedVulnerability, setSelectedVulnerability] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Filtrage des vulnérabilités
  const filteredVulnerabilities = vulnerabilities.filter(vuln => {
    const matchesSearch = 
      vuln.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vuln.cve_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vuln.cloud_asset?.asset_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = severityFilter === "all" || vuln.severity === severityFilter;
    const matchesStatus = statusFilter === "all" || vuln.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  // Statistiques
  const stats = {
    total: vulnerabilities.length,
    critical: vulnerabilities.filter(v => v.severity === 'critical').length,
    high: vulnerabilities.filter(v => v.severity === 'high').length,
    open: vulnerabilities.filter(v => v.status === 'open').length,
    resolved: vulnerabilities.filter(v => v.status === 'resolved').length,
  };

  const handleCreateVulnerability = async (data: any) => {
    const success = await createVulnerability(data);
    if (success) {
      setIsCreateDialogOpen(false);
    }
    return success;
  };

  const handleUpdateVulnerability = async (data: any) => {
    if (!selectedVulnerability) return false;
    const success = await updateVulnerability(selectedVulnerability.id, data);
    if (success) {
      setIsEditDialogOpen(false);
      setSelectedVulnerability(null);
    }
    return success;
  };

  const handleDeleteVulnerability = async () => {
    if (!selectedVulnerability) return false;
    const success = await deleteVulnerability(selectedVulnerability.id);
    if (success) {
      setIsDeleteDialogOpen(false);
      setSelectedVulnerability(null);
    }
    return success;
  };

  const handleView = (vulnerability: any) => {
    setSelectedVulnerability(vulnerability);
    setIsDetailDialogOpen(true);
  };

  const handleEdit = (vulnerability: any) => {
    setSelectedVulnerability(vulnerability);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (vulnerability: any) => {
    setSelectedVulnerability(vulnerability);
    setIsDeleteDialogOpen(true);
  };

  const exportVulnerabilities = () => {
    const csvContent = [
      ['Titre', 'Sévérité', 'Statut', 'CVE ID', 'Asset', 'Découvert', 'Résolu'].join(','),
      ...filteredVulnerabilities.map(vuln => [
        `"${vuln.title}"`,
        vuln.severity,
        vuln.status || '',
        vuln.cve_id || '',
        `"${vuln.cloud_asset?.asset_name || ''}"`,
        vuln.discovered_at ? new Date(vuln.discovered_at).toLocaleDateString('fr-FR') : '',
        vuln.remediated_at ? new Date(vuln.remediated_at).toLocaleDateString('fr-FR') : '',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vulnerabilites_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Vulnérabilités"
        description="Suivi et gestion des vulnérabilités de sécurité détectées"
        action={{
          label: "Nouvelle vulnérabilité",
          icon: Plus,
          onClick: () => setIsCreateDialogOpen(true)
        }}
      />

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          <div className="text-sm text-muted-foreground">Critiques</div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
          <div className="text-sm text-muted-foreground">Élevées</div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="text-2xl font-bold text-red-500">{stats.open}</div>
          <div className="text-sm text-muted-foreground">Ouvertes</div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          <div className="text-sm text-muted-foreground">Résolues</div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Rechercher par titre, CVE ID ou nom d'asset..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sévérité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes sévérités</SelectItem>
              <SelectItem value="critical">Critique</SelectItem>
              <SelectItem value="high">Élevée</SelectItem>
              <SelectItem value="medium">Moyenne</SelectItem>
              <SelectItem value="low">Faible</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="open">Ouvert</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="resolved">Résolu</SelectItem>
              <SelectItem value="closed">Fermé</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={scanVulnerabilities}>
            <Shield className="h-4 w-4 mr-2" />
            Scanner
          </Button>

          <Button variant="outline" onClick={exportVulnerabilities}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Liste des vulnérabilités */}
      {filteredVulnerabilities.length > 0 ? (
        <DataGrid columns={2}>
          {filteredVulnerabilities.map((vulnerability) => (
            <VulnerabilityCard
              key={vulnerability.id}
              vulnerability={vulnerability}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </DataGrid>
      ) : (
        <EmptyState
          icon={Bug}
          title="Aucune vulnérabilité trouvée"
          description={
            searchTerm || severityFilter !== "all" || statusFilter !== "all"
              ? "Aucune vulnérabilité ne correspond à vos critères de recherche"
              : "Aucune vulnérabilité détectée pour le moment"
          }
          action={{
            label: searchTerm || severityFilter !== "all" || statusFilter !== "all" 
              ? "Réinitialiser les filtres" 
              : "Scanner les vulnérabilités",
            onClick: searchTerm || severityFilter !== "all" || statusFilter !== "all"
              ? () => {
                  setSearchTerm("");
                  setSeverityFilter("all");
                  setStatusFilter("all");
                }
              : scanVulnerabilities
          }}
        />
      )}

      {/* Dialogs */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle vulnérabilité</DialogTitle>
            <DialogDescription>
              Créer une nouvelle vulnérabilité de sécurité
            </DialogDescription>
          </DialogHeader>
          <VulnerabilityForm
            onSubmit={handleCreateVulnerability}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la vulnérabilité</DialogTitle>
            <DialogDescription>
              Mettre à jour les informations de la vulnérabilité
            </DialogDescription>
          </DialogHeader>
          <VulnerabilityForm
            initialData={selectedVulnerability}
            onSubmit={handleUpdateVulnerability}
            onCancel={() => {
              setIsEditDialogOpen(false);
              setSelectedVulnerability(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedVulnerability(null);
        }}
        onDelete={handleDeleteVulnerability}
        title="Supprimer la vulnérabilité"
        itemName={selectedVulnerability?.title || ""}
        confirmText="Cette action est irréversible."
      />

      <VulnerabilityDetailDialog
        vulnerability={selectedVulnerability}
        open={isDetailDialogOpen}
        onClose={() => {
          setIsDetailDialogOpen(false);
          setSelectedVulnerability(null);
        }}
        onEdit={handleEdit}
      />
    </div>
  );
};

export default Vulnerabilities;