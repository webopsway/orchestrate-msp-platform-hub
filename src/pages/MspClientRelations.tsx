import { useState } from 'react';
import { Building2, Plus, Users, Calendar, CheckCircle, XCircle, AlertTriangle, Network, Settings, Eye, Edit, Trash2 } from 'lucide-react';

import { useMspClientRelations, MspClientRelation } from '@/hooks/useMspClientRelations';
import { MspClientRelationForm } from '@/components/forms/MspClientRelationForm';
import { CRUDTable } from '@/components/common/CRUDTable';
import { PageHeader } from '@/components/common/PageHeader';
import { StatsCard } from '@/components/common/StatsCard';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const MspClientRelations = () => {
  const {
    relations,
    loading,
    error,
    createRelation,
    updateRelation,
    deleteRelation,
    activateRelation,
    deactivateRelation,
    fetchRelations,
    clearError
  } = useMspClientRelations();

  // États des modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRelation, setSelectedRelation] = useState<MspClientRelation | null>(null);

  // Filtres et pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'direct' | 'via_esn'>('all');

  // Calculs pour les statistiques
  const activeRelations = relations.filter(r => r.is_active);
  const directRelations = relations.filter(r => r.relation_type === 'direct');
  const viaEsnRelations = relations.filter(r => r.relation_type === 'via_esn');
  const expiredRelations = relations.filter(r => 
    r.end_date && new Date(r.end_date) < new Date()
  );

  // Filtrage des données
  const filteredRelations = relations.filter(relation => {
    const matchesSearch = !searchTerm || 
      relation.msp_organization?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relation.client_organization?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relation.esn_organization?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && relation.is_active) ||
      (statusFilter === 'inactive' && !relation.is_active);
    
    const matchesType = typeFilter === 'all' || relation.relation_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleCreateRelation = async (data: any) => {
    const success = await createRelation(data);
    if (success) {
      setIsCreateModalOpen(false);
    }
    return success;
  };

  const handleUpdateRelation = async (data: any) => {
    if (!selectedRelation) return false;
    const success = await updateRelation(selectedRelation.id, data);
    if (success) {
      setIsEditModalOpen(false);
      setSelectedRelation(null);
    }
    return success;
  };

  const handleDeleteRelation = async () => {
    if (!selectedRelation) return;
    const success = await deleteRelation(selectedRelation.id);
    if (success) {
      setIsDeleteModalOpen(false);
      setSelectedRelation(null);
    }
  };

  const handleToggleStatus = async (relation: MspClientRelation) => {
    if (relation.is_active) {
      await deactivateRelation(relation.id);
    } else {
      await activateRelation(relation.id);
    }
  };

  // Colonnes du tableau
  const columns = [
    {
      key: 'organizations',
      label: 'Organisations',
      type: 'custom' as const,
      sortable: true,
      filterable: true,
      render: (value: any, row: MspClientRelation) => (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">MSP</Badge>
            <span className="font-medium">{row.msp_organization?.name}</span>
          </div>
          {row.relation_type === 'via_esn' && row.esn_organization && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">ESN</Badge>
              <span className="text-sm">{row.esn_organization.name}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Client</Badge>
            <span className="text-sm">{row.client_organization?.name}</span>
          </div>
        </div>
      )
    },
    {
      key: 'relation_type',
      label: 'Type',
      type: 'custom' as const,
      sortable: true,
      render: (value: any, row: MspClientRelation) => (
        <div className="space-y-1">
          <Badge variant={row.relation_type === 'direct' ? 'default' : 'secondary'}>
            {row.relation_type === 'direct' ? (
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Direct
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Network className="h-3 w-3" />
                Via ESN
              </div>
            )}
          </Badge>
          <div className="text-xs text-muted-foreground">
            {row.relation_type === 'direct' 
              ? 'Gestion contractuelle directe'
              : 'Gestion via ESN intermédiaire'
            }
          </div>
        </div>
      )
    },
    {
      key: 'period',
      label: 'Période',
      type: 'custom' as const,
      sortable: true,
      render: (value: any, row: MspClientRelation) => {
        const isExpired = row.end_date && new Date(row.end_date) < new Date();
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="h-3 w-3" />
              {format(new Date(row.start_date), 'dd/MM/yyyy', { locale: fr })}
            </div>
            {row.end_date && (
              <div className={`text-xs ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
                → {format(new Date(row.end_date), 'dd/MM/yyyy', { locale: fr })}
                {isExpired && (
                  <Badge variant="destructive" className="ml-1 text-xs">
                    Expiré
                  </Badge>
                )}
              </div>
            )}
            {!row.end_date && (
              <div className="text-xs text-green-600">
                → Durée indéterminée
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Statut',
      type: 'custom' as const,
      sortable: true,
      render: (value: any, row: MspClientRelation) => (
        <div className="space-y-1">
          <Badge variant={row.is_active ? 'default' : 'secondary'}>
            {row.is_active ? (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Actif
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Inactif
              </div>
            )}
          </Badge>
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Créé le',
      type: 'date' as const,
      sortable: true,
      render: (value: any, row: MspClientRelation) => (
        <div className="space-y-1">
          <div className="text-sm">
            {format(new Date(row.created_at), 'dd/MM/yyyy', { locale: fr })}
          </div>
          <div className="text-xs text-muted-foreground">
            par {row.creator?.first_name} {row.creator?.last_name}
          </div>
        </div>
      )
    }
  ];

  const actions = [
    {
      label: 'Voir',
      icon: Eye,
      onClick: (relation: MspClientRelation) => {
        setSelectedRelation(relation);
        setIsViewModalOpen(true);
      },
      variant: 'ghost' as const
    },
    {
      label: 'Modifier',
      icon: Edit,
      onClick: (relation: MspClientRelation) => {
        setSelectedRelation(relation);
        setIsEditModalOpen(true);
      },
      variant: 'ghost' as const
    },
    {
      label: 'Basculer statut',
      icon: Settings,
      onClick: handleToggleStatus,
      variant: 'ghost' as const
    },
    {
      label: 'Supprimer',
      icon: Trash2,
      onClick: (relation: MspClientRelation) => {
        setSelectedRelation(relation);
        setIsDeleteModalOpen(true);
      },
      variant: 'destructive' as const
    }
  ];

  const emptyState = {
    icon: Network,
    title: 'Aucune relation MSP-Client',
    description: 'Commencez par créer une relation entre un MSP et un client.',
    action: {
      label: 'Créer une relation',
      onClick: () => setIsCreateModalOpen(true)
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <PageHeader
        title="Relations MSP-Client"
        description="Gérez les relations entre les MSP, ESN et clients"
        action={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle relation
          </Button>
        }
      />

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Relations actives"
          value={activeRelations.length.toString()}
          icon={CheckCircle}
          trend={`${Math.round((activeRelations.length / relations.length) * 100) || 0}% du total`}
        />
        <StatsCard
          title="Relations directes"
          value={directRelations.length.toString()}
          icon={Building2}
          trend={`${Math.round((directRelations.length / relations.length) * 100) || 0}% du total`}
        />
        <StatsCard
          title="Via ESN"
          value={viaEsnRelations.length.toString()}
          icon={Network}
          trend={`${Math.round((viaEsnRelations.length / relations.length) * 100) || 0}% du total`}
        />
        <StatsCard
          title="Relations expirées"
          value={expiredRelations.length.toString()}
          icon={AlertTriangle}
          variant={expiredRelations.length > 0 ? "destructive" : "default"}
        />
      </div>

      {/* Alerte d'erreur */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={clearError}
            >
              Fermer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filtres rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="active">Actives</TabsTrigger>
              <TabsTrigger value="inactive">Inactives</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Tableau des relations */}
      <CRUDTable
        title="Relations MSP-Client"
        columns={columns}
        data={filteredRelations}
        loading={loading}
        totalCount={filteredRelations.length}
        pageSize={pageSize}
        currentPage={currentPage}
        searchPlaceholder="Rechercher par nom d'organisation..."
        onSearch={setSearchTerm}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        onCreate={() => setIsCreateModalOpen(true)}
        onRefresh={fetchRelations}
        actions={actions}
        emptyState={emptyState}
        selectable={false}
      />

      {/* Modal de création */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle relation MSP-Client</DialogTitle>
            <DialogDescription>
              Définissez une relation entre un MSP et un client, avec ou sans ESN intermédiaire.
            </DialogDescription>
          </DialogHeader>
          <MspClientRelationForm
            onSubmit={handleCreateRelation}
            onCancel={() => setIsCreateModalOpen(false)}
            loading={loading}
          />
        </DialogContent>
      </Dialog>

      {/* Modal d'édition */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la relation MSP-Client</DialogTitle>
            <DialogDescription>
              Modifiez les paramètres de cette relation MSP-Client.
            </DialogDescription>
          </DialogHeader>
          {selectedRelation && (
            <MspClientRelationForm
              relation={selectedRelation}
              onSubmit={handleUpdateRelation}
              onCancel={() => {
                setIsEditModalOpen(false);
                setSelectedRelation(null);
              }}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de visualisation */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la relation</DialogTitle>
          </DialogHeader>
          {selectedRelation && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    Organisations impliquées
                    <Badge variant={selectedRelation.is_active ? 'default' : 'secondary'}>
                      {selectedRelation.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">MSP</Badge>
                    <span className="font-medium">{selectedRelation.msp_organization?.name}</span>
                  </div>
                  {selectedRelation.relation_type === 'via_esn' && selectedRelation.esn_organization && (
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">ESN</Badge>
                      <span>{selectedRelation.esn_organization.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">Client</Badge>
                    <span>{selectedRelation.client_organization?.name}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm font-medium">Type de relation:</span>
                    <Badge variant={selectedRelation.relation_type === 'direct' ? 'default' : 'secondary'} className="ml-2">
                      {selectedRelation.relation_type === 'direct' ? 'Direct' : 'Via ESN'}
                    </Badge>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium">Période:</span>
                    <div className="text-sm text-muted-foreground">
                      Du {format(new Date(selectedRelation.start_date), 'dd/MM/yyyy', { locale: fr })}
                      {selectedRelation.end_date && 
                        ` au ${format(new Date(selectedRelation.end_date), 'dd/MM/yyyy', { locale: fr })}`
                      }
                      {!selectedRelation.end_date && ' (durée indéterminée)'}
                    </div>
                  </div>

                  {selectedRelation.metadata?.description && (
                    <div>
                      <span className="text-sm font-medium">Description:</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedRelation.metadata.description}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-sm font-medium">Créé:</span>
                    <div className="text-sm text-muted-foreground">
                      Le {format(new Date(selectedRelation.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                      {selectedRelation.creator && 
                        ` par ${selectedRelation.creator.first_name} ${selectedRelation.creator.last_name}`
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                  Fermer
                </Button>
                <Button 
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setIsEditModalOpen(true);
                  }}
                >
                  Modifier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de suppression */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la relation</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette relation MSP-Client ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          {selectedRelation && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="text-sm">
                  <strong>MSP:</strong> {selectedRelation.msp_organization?.name}
                </div>
                {selectedRelation.esn_organization && (
                  <div className="text-sm">
                    <strong>ESN:</strong> {selectedRelation.esn_organization.name}
                  </div>
                )}
                <div className="text-sm">
                  <strong>Client:</strong> {selectedRelation.client_organization?.name}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedRelation(null);
                  }}
                >
                  Annuler
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleDeleteRelation}
                  disabled={loading}
                >
                  {loading ? 'Suppression...' : 'Supprimer'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MspClientRelations;