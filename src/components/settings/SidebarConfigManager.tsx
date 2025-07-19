import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSettings } from '@/hooks/useAppSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Navigation,
  Settings,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { NavigationItem, NavigationGroup, SidebarConfig } from '@/components/layout/sidebar/types';
import { defaultNavigationItems, defaultGroups, iconMap } from '@/components/layout/sidebar/navigationConfig';

interface SidebarConfigManagerProps {
  className?: string;
}

export const SidebarConfigManager: React.FC<SidebarConfigManagerProps> = ({ className }) => {
  const { userProfile } = useAuth();
  const { getSetting, setSetting } = useAppSettings();
  
  const [sidebarConfig, setSidebarConfig] = useState<SidebarConfig>({
    items: defaultNavigationItems,
    groups: defaultGroups
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHiddenItems, setShowHiddenItems] = useState(false);
  const [editingItem, setEditingItem] = useState<NavigationItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddSectionDialogOpen, setIsAddSectionDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<NavigationItem>>({
    title: '',
    url: '',
    icon: 'Settings',
    group: 'main',
    order: 1
  });
  const [newSection, setNewSection] = useState<Partial<NavigationGroup>>({
    title: '',
    order: sidebarConfig.groups.length + 1
  });

  // Charger la configuration depuis les paramètres
  useEffect(() => {
    const loadSidebarConfig = async () => {
      try {
        setLoading(true);
        const teamId = userProfile?.default_team_id || userProfile?.default_organization_id || null;
        const config = await getSetting(teamId, 'ui', 'sidebar_config');
        
        if (config) {
          setSidebarConfig(config);
        }
      } catch (error) {
        console.log('Using default sidebar configuration');
      } finally {
        setLoading(false);
      }
    };

    if (userProfile?.is_msp_admin || userProfile?.default_team_id) {
      loadSidebarConfig();
    }
  }, [userProfile, getSetting]);

  // Sauvegarder la configuration
  const saveSidebarConfig = async () => {
    try {
      setSaving(true);
      const teamId = userProfile?.default_team_id || userProfile?.default_organization_id || null;
      await setSetting(teamId, 'ui', 'sidebar_config', sidebarConfig);
      toast.success('Configuration de la sidebar sauvegardée');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Réinitialiser à la configuration par défaut
  const resetToDefault = () => {
    setSidebarConfig({
      items: defaultNavigationItems,
      groups: defaultGroups
    });
    toast.success('Configuration réinitialisée aux valeurs par défaut');
  };

  // Toggle visibilité d'un élément
  const toggleItemVisibility = (itemId: string) => {
    setSidebarConfig(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId 
          ? { ...item, hidden: !item.hidden }
          : item
      )
    }));
  };

  // Modifier l'ordre d'un élément
  const moveItem = (itemId: string, direction: 'up' | 'down') => {
    setSidebarConfig(prev => {
      const items = [...prev.items];
      const currentIndex = items.findIndex(item => item.id === itemId);
      
      if (currentIndex === -1) return prev;
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (newIndex < 0 || newIndex >= items.length) return prev;
      
      // Échanger les éléments
      [items[currentIndex], items[newIndex]] = [items[newIndex], items[currentIndex]];
      
      // Mettre à jour l'ordre
      items[currentIndex].order = currentIndex + 1;
      items[newIndex].order = newIndex + 1;
      
      return { ...prev, items };
    });
  };

  // Modifier un élément
  const handleEditItem = (item: NavigationItem) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  // Sauvegarder les modifications d'un élément
  const handleSaveEdit = () => {
    if (!editingItem) return;
    
    setSidebarConfig(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === editingItem.id ? editingItem : item
      )
    }));
    
    setIsEditDialogOpen(false);
    setEditingItem(null);
    toast.success('Élément modifié');
  };

  // Ajouter un nouvel élément
  const handleAddItem = () => {
    if (!newItem.title || !newItem.url || !newItem.group) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    const newItemComplete: NavigationItem = {
      id: `custom-${Date.now()}`,
      title: newItem.title!,
      url: newItem.url!,
      icon: newItem.icon || 'Settings',
      group: newItem.group!,
      order: sidebarConfig.items.filter(item => item.group === newItem.group).length + 1
    };

    setSidebarConfig(prev => ({
      ...prev,
      items: [...prev.items, newItemComplete]
    }));

    setNewItem({
      title: '',
      url: '',
      icon: 'Settings',
      group: 'main',
      order: 1
    });
    setIsAddDialogOpen(false);
    toast.success('Nouvel élément ajouté');
  };

  // Supprimer un élément
  const handleDeleteItem = (itemId: string) => {
    setSidebarConfig(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
    toast.success('Élément supprimé');
  };

  // Ajouter une nouvelle section
  const handleAddSection = () => {
    if (!newSection.title) {
      toast.error('Veuillez saisir un titre pour la section');
      return;
    }

    const newSectionComplete: NavigationGroup = {
      id: `section-${Date.now()}`,
      title: newSection.title,
      order: newSection.order || sidebarConfig.groups.length + 1
    };

    setSidebarConfig(prev => ({
      ...prev,
      groups: [...prev.groups, newSectionComplete]
    }));

    setNewSection({
      title: '',
      order: sidebarConfig.groups.length + 2
    });
    setIsAddSectionDialogOpen(false);
    toast.success('Nouvelle section ajoutée');
  };

  // Supprimer une section
  const handleDeleteSection = (sectionId: string) => {
    // Vérifier s'il y a des éléments dans cette section
    const itemsInSection = sidebarConfig.items.filter(item => item.group === sectionId);
    
    if (itemsInSection.length > 0) {
      toast.error('Impossible de supprimer une section contenant des éléments');
      return;
    }

    setSidebarConfig(prev => ({
      ...prev,
      groups: prev.groups.filter(group => group.id !== sectionId)
    }));
    toast.success('Section supprimée');
  };

  // Filtrer les éléments selon la visibilité
  const filteredItems = showHiddenItems 
    ? sidebarConfig.items 
    : sidebarConfig.items.filter(item => !item.hidden);

  // Grouper les éléments
  const groupedItems = sidebarConfig.groups
    .sort((a, b) => a.order - b.order)
    .map(group => ({
      ...group,
      items: filteredItems
        .filter(item => item.group === group.id)
        .sort((a, b) => a.order - b.order)
    }))
    .filter(group => group.items.length > 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center space-x-2">
            <Navigation className="h-6 w-6" />
            <span>Configuration de la Sidebar</span>
          </h2>
          <p className="text-muted-foreground">
            Personnalisez l'ordre et la visibilité des éléments de navigation
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowHiddenItems(!showHiddenItems)}
          >
            {showHiddenItems ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showHiddenItems ? 'Masquer' : 'Afficher'} les éléments cachés
          </Button>
          <Button variant="outline" onClick={resetToDefault}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <Button onClick={saveSidebarConfig} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>



      {/* Gestion des sections */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Gestion des sections</span>
            </CardTitle>
            <div className="flex space-x-2">
              <Dialog open={isAddSectionDialogOpen} onOpenChange={setIsAddSectionDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle section
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter une nouvelle section</DialogTitle>
                    <DialogDescription>
                      Créez une nouvelle section dans la sidebar
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="section-title">Titre de la section *</Label>
                      <Input
                        id="section-title"
                        value={newSection.title}
                        onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                        placeholder="Nom de la section"
                      />
                    </div>
                    <div>
                      <Label htmlFor="section-order">Ordre</Label>
                      <Input
                        id="section-order"
                        type="number"
                        value={newSection.order}
                        onChange={(e) => setNewSection({ ...newSection, order: parseInt(e.target.value) || 1 })}
                        placeholder="Ordre d'affichage"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddSectionDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleAddSection}>
                      Ajouter
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sidebarConfig.groups
              .sort((a, b) => a.order - b.order)
              .map((group) => {
                const itemsInGroup = sidebarConfig.items.filter(item => item.group === group.id);
                return (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-background"
                  >
                    <div className="flex items-center space-x-3">
                      <Settings className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{group.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Ordre {group.order} • {itemsInGroup.length} élément{itemsInGroup.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {group.id.startsWith('section-') ? 'Personnalisée' : 'Système'}
                      </Badge>
                      {group.id.startsWith('section-') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSection(group.id)}
                          className="text-red-600 hover:text-red-700"
                          disabled={itemsInGroup.length > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Ajouter un nouvel élément */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Ajouter un élément</span>
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvel élément
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un élément de navigation</DialogTitle>
                  <DialogDescription>
                    Créez un nouvel élément dans la sidebar
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Titre *</Label>
                    <Input
                      id="title"
                      value={newItem.title}
                      onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                      placeholder="Nom de l'élément"
                    />
                  </div>
                  <div>
                    <Label htmlFor="url">URL *</Label>
                    <Input
                      id="url"
                      value={newItem.url}
                      onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                      placeholder="/mon-chemin"
                    />
                  </div>
                  <div>
                    <Label htmlFor="icon">Icône</Label>
                    <Select value={newItem.icon} onValueChange={(value) => setNewItem({ ...newItem, icon: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(iconMap).map(iconName => (
                          <SelectItem key={iconName} value={iconName}>
                            <div className="flex items-center space-x-2">
                              {React.createElement(iconMap[iconName], { className: "h-4 w-4" })}
                              <span>{iconName}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="group">Section *</Label>
                    <Select value={newItem.group} onValueChange={(value) => setNewItem({ ...newItem, group: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sidebarConfig.groups
                          .sort((a, b) => a.order - b.order)
                          .map(group => (
                          <SelectItem key={group.id} value={group.id}>
                            <div className="flex items-center space-x-2">
                              <span>{group.title}</span>
                              {group.id.startsWith('section-') && (
                                <Badge variant="outline" className="text-xs">Personnalisée</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleAddItem}>
                    Ajouter
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Configuration par groupes */}
      {groupedItems.map((group) => (
        <Card key={group.id}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>{group.title}</span>
              <Badge variant="outline">{group.items.length} élément{group.items.length > 1 ? 's' : ''}</Badge>
            </CardTitle>
            <CardDescription>
              Groupe d'ordre {group.order}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {group.items.map((item, index) => {
                const IconComponent = iconMap[item.icon];
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      item.hidden ? 'bg-muted/50 opacity-60' : 'bg-background'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      <IconComponent className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.url}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {item.hidden && (
                        <Badge variant="secondary" className="text-xs">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Caché
                        </Badge>
                      )}
                      
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveItem(item.id, 'up')}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveItem(item.id, 'down')}
                          disabled={index === group.items.length - 1}
                        >
                          ↓
                        </Button>
                      </div>
                      
                      <Switch
                        checked={!item.hidden}
                        onCheckedChange={() => toggleItemVisibility(item.id)}
                      />
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      
                      {item.id.startsWith('custom-') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Dialog d'édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'élément</DialogTitle>
            <DialogDescription>
              Modifiez les propriétés de cet élément de navigation
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Titre</Label>
                <Input
                  id="edit-title"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-url">URL</Label>
                <Input
                  id="edit-url"
                  value={editingItem.url}
                  onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-icon">Icône</Label>
                <Select 
                  value={editingItem.icon} 
                  onValueChange={(value) => setEditingItem({ ...editingItem, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(iconMap).map(iconName => (
                      <SelectItem key={iconName} value={iconName}>
                        <div className="flex items-center space-x-2">
                          {React.createElement(iconMap[iconName], { className: "h-4 w-4" })}
                          <span>{iconName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-group">Section</Label>
                <Select 
                  value={editingItem.group} 
                  onValueChange={(value) => setEditingItem({ ...editingItem, group: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sidebarConfig.groups
                      .sort((a, b) => a.order - b.order)
                      .map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        <div className="flex items-center space-x-2">
                          <span>{group.title}</span>
                          {group.id.startsWith('section-') && (
                            <Badge variant="outline" className="text-xs">Personnalisée</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit}>
              Sauvegarder
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 