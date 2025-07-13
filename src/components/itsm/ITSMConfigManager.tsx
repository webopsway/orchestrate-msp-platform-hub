import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Settings, Eye, EyeOff } from 'lucide-react';
import { 
  useITSMDynamicConfig, 
  useCreateITSMDynamicConfig, 
  useUpdateITSMDynamicConfig, 
  useDeleteITSMDynamicConfig,
  ITSMConfigItem,
  CreateConfigData,
  getConfigLabel,
  getConfigColor,
  getConfigCategory,
  getConfigDescription 
} from '@/hooks/useITSMDynamicConfig';

interface ConfigFormData {
  config_key: string;
  label: string;
  color: string;
  category?: string;
  description?: string;
}

const defaultColors = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

const ConfigItemCard: React.FC<{
  item: ITSMConfigItem;
  onEdit: (item: ITSMConfigItem) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}> = ({ item, onEdit, onDelete, onToggleActive }) => {
  const label = getConfigLabel(item);
  const color = getConfigColor(item);
  const category = getConfigCategory(item);
  const description = getConfigDescription(item);

  return (
    <Card className={`transition-all ${item.is_active ? '' : 'opacity-60'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: color }}
            />
            <div>
              <div className="font-medium">{label}</div>
              <div className="text-sm text-muted-foreground">
                Clé: {item.config_key}
                {category && ` • Catégorie: ${category}`}
              </div>
              {description && (
                <div className="text-sm text-muted-foreground mt-1">{description}</div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleActive(item.id, !item.is_active)}
            >
              {item.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(item)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer la configuration</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer "{label}" ? Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(item.id)}>
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ConfigForm: React.FC<{
  type: 'priorities' | 'statuses' | 'categories' | 'ticket_types';
  initialData?: ITSMConfigItem;
  onSubmit: (data: ConfigFormData) => void;
  onCancel: () => void;
}> = ({ type, initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<ConfigFormData>({
    config_key: initialData?.config_key || '',
    label: getConfigLabel(initialData!) || '',
    color: getConfigColor(initialData!) || defaultColors[0],
    category: getConfigCategory(initialData!) || '',
    description: getConfigDescription(initialData!) || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="config_key">Clé de configuration</Label>
        <Input
          id="config_key"
          value={formData.config_key}
          onChange={(e) => setFormData(prev => ({ ...prev, config_key: e.target.value }))}
          placeholder="ex: high, open, hardware"
          required
          disabled={!!initialData}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Utilisée pour identifier la configuration dans le code
        </p>
      </div>

      <div>
        <Label htmlFor="label">Libellé d'affichage</Label>
        <Input
          id="label"
          value={formData.label}
          onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
          placeholder="ex: Priorité élevée, Ouvert, Matériel"
          required
        />
      </div>

      <div>
        <Label htmlFor="color">Couleur</Label>
        <div className="flex items-center space-x-2 mt-1">
          <Input
            id="color"
            type="color"
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            className="w-12 h-8 p-1"
          />
          <Input
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            placeholder="#000000"
            className="flex-1"
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {defaultColors.map(color => (
            <button
              key={color}
              type="button"
              className="w-6 h-6 rounded border-2 border-muted"
              style={{ backgroundColor: color }}
              onClick={() => setFormData(prev => ({ ...prev, color }))}
            />
          ))}
        </div>
      </div>

      {type === 'statuses' && (
        <div>
          <Label htmlFor="category">Catégorie</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="incident">Incident</SelectItem>
              <SelectItem value="service_request">Demande de service</SelectItem>
              <SelectItem value="change_request">Demande de changement</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Description optionnelle..."
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {initialData ? 'Mettre à jour' : 'Créer'}
        </Button>
      </DialogFooter>
    </form>
  );
};

const ConfigTypeManager: React.FC<{
  type: 'priorities' | 'statuses' | 'categories' | 'ticket_types';
  title: string;
  description: string;
}> = ({ type, title, description }) => {
  const { data: configs = [], isLoading } = useITSMDynamicConfig(type);
  const createMutation = useCreateITSMDynamicConfig();
  const updateMutation = useUpdateITSMDynamicConfig();
  const deleteMutation = useDeleteITSMDynamicConfig();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ITSMConfigItem | null>(null);

  const handleCreate = (data: ConfigFormData) => {
    const createData: CreateConfigData = {
      config_type: type,
      config_key: data.config_key,
      label: data.label,
      color: data.color,
      category: data.category,
      description: data.description,
    };

    createMutation.mutate(createData, {
      onSuccess: () => {
        setDialogOpen(false);
      }
    });
  };

  const handleUpdate = (data: ConfigFormData) => {
    if (!editingItem) return;

    updateMutation.mutate({
      id: editingItem.id,
      updates: {
        label: data.label,
        color: data.color,
        category: data.category,
        description: data.description,
      }
    }, {
      onSuccess: () => {
        setEditingItem(null);
        setDialogOpen(false);
      }
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    updateMutation.mutate({
      id,
      updates: { is_active: isActive }
    });
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const openEditDialog = (item: ITSMConfigItem) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Modifier' : 'Créer'} - {title}
                </DialogTitle>
                <DialogDescription>
                  {editingItem ? 'Modifiez' : 'Créez'} une configuration {title.toLowerCase()}.
                </DialogDescription>
              </DialogHeader>
              <ConfigForm
                type={type}
                initialData={editingItem || undefined}
                onSubmit={editingItem ? handleUpdate : handleCreate}
                onCancel={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {configs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune configuration trouvée. Commencez par en créer une.
            </div>
          ) : (
            configs.map(item => (
              <ConfigItemCard
                key={item.id}
                item={item}
                onEdit={openEditDialog}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const ITSMConfigManager: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center">
          <Settings className="h-6 w-6 mr-2" />
          Configuration ITSM Dynamique
        </h2>
        <p className="text-muted-foreground mt-1">
          Gérez les priorités, statuts, catégories et types de tickets ITSM de votre équipe.
        </p>
      </div>

      <Tabs defaultValue="priorities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="priorities">Priorités</TabsTrigger>
          <TabsTrigger value="statuses">Statuts</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="ticket_types">Types de tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="priorities">
          <ConfigTypeManager
            type="priorities"
            title="Priorités"
            description="Définissez les niveaux de priorité pour vos tickets ITSM."
          />
        </TabsContent>

        <TabsContent value="statuses">
          <ConfigTypeManager
            type="statuses"
            title="Statuts"
            description="Configurez les statuts disponibles pour vos incidents, demandes de service et changements."
          />
        </TabsContent>

        <TabsContent value="categories">
          <ConfigTypeManager
            type="categories"
            title="Catégories"
            description="Organisez vos tickets par catégories métier."
          />
        </TabsContent>

        <TabsContent value="ticket_types">
          <ConfigTypeManager
            type="ticket_types"
            title="Types de tickets"
            description="Définissez les différents types de tickets disponibles."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};