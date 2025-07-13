import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  AlertTriangle, 
  Clock,
  Plus,
  Calendar,
  Wrench,
  Activity,
  Server,
  Search,
  Filter,
  Download,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";
import { 
  PageHeader, 
  StatsCard, 
  SearchAndFilters, 
  DataGrid,
  EmptyState,
  ActionButtons
} from "@/components/common";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { usePatchManagement } from "@/hooks/usePatchManagement";
import { PatchForm } from "@/components/forms/PatchForm";

const SecurityPatchManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPatchType, setSelectedPatchType] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedPatch, setSelectedPatch] = useState<any>(null);
  
  const { toast } = useToast();
  const {
    patches,
    loading,
    createPatch,
    updatePatch,
    deletePatch,
    executePatch,
    loadPatches,
    stats
  } = usePatchManagement();

  useEffect(() => {
    loadPatches();
  }, [loadPatches]);

  const handleCreate = async (data: any) => {
    const success = await createPatch(data);
    if (success) {
      setShowCreateDialog(false);
      toast({
        title: "Patch créé",
        description: "Le patch a été créé avec succès",
      });
    }
    return success;
  };

  const handleEdit = async (data: any) => {
    const success = await updatePatch(selectedPatch.id, data);
    if (success) {
      setShowEditDialog(false);
      setSelectedPatch(null);
      toast({
        title: "Patch modifié",
        description: "Le patch a été modifié avec succès",
      });
    }
    return success;
  };

  const handleDelete = async () => {
    const success = await deletePatch(selectedPatch.id);
    if (success) {
      setShowDeleteDialog(false);
      setSelectedPatch(null);
      toast({
        title: "Patch supprimé",
        description: "Le patch a été supprimé avec succès",
      });
    }
    return success;
  };

  const handleExecute = async (patch: any) => {
    const success = await executePatch(patch.id);
    if (success) {
      toast({
        title: "Patch exécuté",
        description: `Le patch ${patch.description || 'sans nom'} a été exécuté avec succès`,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "default";
      case "running": return "secondary";
      case "completed": return "default";
      case "failed": return "destructive";
      case "cancelled": return "outline";
      default: return "outline";
    }
  };

  const getPriorityColor = (patchType: string) => {
    switch (patchType) {
      case "critical": return "destructive";
      case "security": return "secondary";
      case "maintenance": return "default";
      case "feature": return "outline";
      default: return "outline";
    }
  };

  const filteredPatches = patches.filter(patch => {
    const matchesSearch = 
      patch.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patch.cloud_asset?.asset_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !selectedStatus || patch.status === selectedStatus;
    const matchesType = !selectedPatchType || patch.patch_type === selectedPatchType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const statCards = [
    {
      title: "Patchs planifiés",
      value: stats.scheduled.toString(),
      description: "À exécuter",
      icon: Clock,
      trend: `+${stats.todayScheduled} aujourd'hui`,
      trendColor: "blue" as const
    },
    {
      title: "Patchs en cours",
      value: stats.running.toString(),
      description: "En exécution",
      icon: Activity,
      trend: "Temps moyen: 45m",
      trendColor: "blue" as const
    },
    {
      title: "Patchs complétés",
      value: stats.completed.toString(),
      description: "Ce mois",
      icon: Shield,
      trend: `+${stats.monthCompleted} ce mois`,
      trendColor: "green" as const
    },
    {
      title: "Taux de succès",
      value: `${stats.successRate}%`,
      description: "Derniers 30 jours",
      icon: AlertTriangle,
      trend: "+2% vs mois dernier",
      trendColor: "green" as const
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Patches"
        description="Planification, exécution et historisation des patches de sécurité"
        action={{
          label: "Nouveau patch",
          icon: Plus,
          onClick: () => setShowCreateDialog(true)
        }}
      />

      <DataGrid columns={4}>
        {statCards.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            trend={stat.trend}
            trendColor={stat.trendColor}
          />
        ))}
      </DataGrid>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchAndFilters
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Rechercher un patch..."
          />
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau patch
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <DataGrid columns={1}>
          {filteredPatches.map((patch) => (
            <Card key={patch.id} className="hover:shadow-md transition-shadow animate-fade-in">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getPriorityColor(patch.patch_type)}>
                        {patch.patch_type}
                      </Badge>
                      <Badge variant={getStatusColor(patch.status)}>
                        {patch.status}
                      </Badge>
                      {patch.metadata?.severity && (
                        <Badge variant="outline">
                          Sévérité: {patch.metadata.severity}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">
                      {patch.description || 'Patch sans description'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Asset: {patch.cloud_asset?.asset_name || 'Asset inconnu'}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPatch(patch);
                        setShowEditDialog(true);
                      }}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedPatch(patch);
                        setShowDeleteDialog(true);
                      }}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {new Date(patch.scheduled_at).toLocaleString()}
                        </p>
                        <p className="text-muted-foreground">Planifié</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {patch.cloud_asset?.asset_type || 'Type inconnu'}
                        </p>
                        <p className="text-muted-foreground">Type d'asset</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {patch.completed_at ? 
                            new Date(patch.completed_at).toLocaleString() : 
                            'Non exécuté'
                          }
                        </p>
                        <p className="text-muted-foreground">Exécution</p>
                      </div>
                    </div>
                  </div>

                  {patch.error_message && (
                    <div className="p-3 bg-destructive/10 rounded-lg">
                      <p className="text-sm text-destructive font-medium">Erreur:</p>
                      <p className="text-sm text-destructive">{patch.error_message}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">
                      ID: {patch.id.slice(0, 8)}...
                    </span>
                    
                    <div className="flex gap-2">
                      {patch.status === 'scheduled' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleExecute(patch)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Exécuter
                        </Button>
                      )}
                      
                      {patch.status === 'running' && (
                        <Button variant="outline" size="sm" disabled>
                          <Pause className="h-4 w-4 mr-1" />
                          En cours...
                        </Button>
                      )}
                      
                      {patch.status === 'failed' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleExecute(patch)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Relancer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </DataGrid>

        {filteredPatches.length === 0 && (
          <EmptyState
            icon={Wrench}
            title="Aucun patch trouvé"
            description="Aucun patch ne correspond à vos critères de recherche"
            action={{
              label: "Créer un patch",
              onClick: () => setShowCreateDialog(true)
            }}
          />
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un nouveau patch</DialogTitle>
            <DialogDescription>
              Planifier un nouveau patch pour un asset cloud
            </DialogDescription>
          </DialogHeader>
          <PatchForm onSubmit={handleCreate} />
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le patch</DialogTitle>
            <DialogDescription>
              Modifier les informations du patch
            </DialogDescription>
          </DialogHeader>
          <PatchForm
            initialData={selectedPatch}
            onSubmit={handleEdit}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le patch</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce patch ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SecurityPatchManagement;