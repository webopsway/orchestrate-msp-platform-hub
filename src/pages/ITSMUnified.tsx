import React, { useState } from 'react';
import { useITSMItems, useITSMCrud } from '@/modules/itsm';
import { ITSMDashboard } from '@/components/itsm/ITSMDashboard';
import { 
  CreateIncidentDialog, 
  CreateChangeDialog,
  EditIncidentDialog,
  EditChangeDialog,
  ViewIncidentDialog,
  ViewChangeDialog,
  DeleteIncidentDialog,
  DeleteChangeDialog
} from '@/components/itsm';
import { IncidentService } from '@/services/incidentService';
import { ChangeService } from '@/services/changeService';
import { ServiceRequestService } from '@/services/serviceRequestService';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ITSMBadge } from '@/components/itsm/ITSMBadge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  AlertTriangle, 
  FileText, 
  Clock, 
  Plus,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

const ITSMUnified: React.FC = () => {
  const { user, userProfile } = useAuth();
  const { items, loading, refresh } = useITSMItems();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Gestion des dialogues CRUD
  const {
    selectedItem,
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
  } = useITSMCrud({ onRefresh: refresh });

  // Fonctions de création selon le type
  const handleCreateItem = (type: 'incident' | 'change' | 'request') => {
    // Stocker le type sélectionné pour la création
    (window as any).__ITSM_CREATE_TYPE__ = type;
    openCreate();
  };

  const createItem = async (data: any) => {
    const type = (window as any).__ITSM_CREATE_TYPE__ || 'incident';
    
    switch (type) {
      case 'incident':
        return await IncidentService.createIncident(data, user, userProfile);
      case 'change':
        return await ChangeService.createChange(data, user, userProfile);
      case 'request':
        return await ServiceRequestService.createRequest(data, user, userProfile);
      default:
        return false;
    }
  };

  const updateItem = async (data: any) => {
    if (!selectedItem) return false;
    
    switch (selectedItem.type) {
      case 'incident':
        return await IncidentService.updateIncident(selectedItem.id, data, user);
      case 'change':
        return await ChangeService.updateChange(selectedItem.id, data, user);
      case 'request':
        return await ServiceRequestService.updateRequest(selectedItem.id, data, user);
      default:
        return false;
    }
  };

  const deleteItem = async () => {
    if (!selectedItem) return false;
    
    switch (selectedItem.type) {
      case 'incident':
        return await IncidentService.deleteIncident(selectedItem.id, user);
      case 'change':
        return await ChangeService.deleteChange(selectedItem.id, user);
      case 'request':
        return await ServiceRequestService.deleteRequest(selectedItem.id, user);
      default:
        return false;
    }
  };

  // Fonctions utilitaires pour filtrer les données
  const getItemsByType = (type: 'incident' | 'change' | 'request') => {
    return items.filter(item => item.type === type);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'incident':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'change':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'request':
        return <Clock className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'incident':
        return 'Incident';
      case 'change':
        return 'Changement';
      case 'request':
        return 'Demande';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion ITSM"
        description="Gestion unifiée des incidents, changements et demandes de service"
        actions={
          <div className="flex gap-2">
            <Button onClick={() => handleCreateItem('incident')} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Incident
            </Button>
            <Button onClick={() => handleCreateItem('change')} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Changement
            </Button>
            <Button onClick={() => handleCreateItem('request')} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Demande
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="changes">Changements</TabsTrigger>
          <TabsTrigger value="requests">Demandes</TabsTrigger>
          <TabsTrigger value="all">Tous</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <ITSMDashboard
            items={items}
            loading={loading}
            onCreateItem={handleCreateItem}
            onViewItem={openDetail}
            showCreateButtons={false}
          />
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Assigné</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getItemsByType('incident').map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span className="text-sm">{getTypeLabel(item.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      <ITSMBadge type="priority" value={item.priority} />
                    </TableCell>
                    <TableCell>
                      <ITSMBadge type="status" value={item.status} category={item.type} />
                    </TableCell>
                    <TableCell>
                      {item.assigned_to_profile?.email || item.assigned_to || '-'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.created_at), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetail(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDelete(item)}
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
        </TabsContent>

        <TabsContent value="changes" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Assigné</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getItemsByType('change').map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span className="text-sm">{getTypeLabel(item.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      <ITSMBadge type="priority" value={item.priority} />
                    </TableCell>
                    <TableCell>
                      <ITSMBadge type="status" value={item.status} category={item.type} />
                    </TableCell>
                    <TableCell>
                      {item.assigned_to_profile?.email || item.assigned_to || '-'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.created_at), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetail(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDelete(item)}
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
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Assigné</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getItemsByType('request').map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span className="text-sm">{getTypeLabel(item.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      <ITSMBadge type="priority" value={item.priority} />
                    </TableCell>
                    <TableCell>
                      <ITSMBadge type="status" value={item.status} category={item.type} />
                    </TableCell>
                    <TableCell>
                      {item.assigned_to_profile?.email || item.assigned_to || '-'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.created_at), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetail(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDelete(item)}
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
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Assigné</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span className="text-sm">{getTypeLabel(item.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      <ITSMBadge type="priority" value={item.priority} />
                    </TableCell>
                    <TableCell>
                      <ITSMBadge type="status" value={item.status} category={item.type} />
                    </TableCell>
                    <TableCell>
                      {item.assigned_to_profile?.email || item.assigned_to || '-'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.created_at), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetail(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDelete(item)}
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
        </TabsContent>
      </Tabs>

      {/* Dialogues CRUD */}
      {isCreateOpen && (
        <CreateIncidentDialog
          isOpen={isCreateOpen}
          onClose={closeAll}
          onSubmit={createItem}
        />
      )}

      {isEditOpen && selectedItem && (
        <EditIncidentDialog
          isOpen={isEditOpen}
          onClose={closeAll}
          onSubmit={updateItem}
          incident={selectedItem}
        />
      )}

      {isDetailOpen && selectedItem && (
        <ViewIncidentDialog
          isOpen={isDetailOpen}
          onClose={closeAll}
          incident={selectedItem}
        />
      )}

      {isDeleteOpen && selectedItem && (
        <DeleteIncidentDialog
          isOpen={isDeleteOpen}
          onClose={closeAll}
          onConfirm={deleteItem}
          itemName={selectedItem.title}
        />
      )}
    </div>
  );
};

export default ITSMUnified; 