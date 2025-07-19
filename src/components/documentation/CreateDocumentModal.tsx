import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Tag, 
  X, 
  Plus,
  FileText,
  BookOpen,
  File,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface CreateDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newDocument: {
    title: string;
    category: string;
    team_id: string;
    tags: string[];
    status: 'draft' | 'published' | 'archived';
    description: string;
  };
  setNewDocument: (doc: any) => void;
  onSubmit: () => void;
  organizationData: any;
  teamsLoading: boolean;
}

const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  open,
  onOpenChange,
  newDocument,
  setNewDocument,
  onSubmit,
  organizationData,
  teamsLoading
}) => {
  const [newTag, setNewTag] = useState('');

  const categories = [
    { value: 'spécification', label: 'Spécification', icon: BookOpen },
    { value: 'tutorial', label: 'Tutoriels', icon: FileText },
    { value: 'reference', label: 'Référence', icon: File },
    { value: 'procedure', label: 'Procédure', icon: Settings }
  ];

  const handleAddTag = () => {
    if (newTag.trim() && !newDocument.tags.includes(newTag.trim())) {
      setNewDocument({
        ...newDocument,
        tags: [...newDocument.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewDocument({
      ...newDocument,
      tags: newDocument.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const resetForm = () => {
    setNewDocument({
      title: '',
      category: '',
      team_id: '',
      tags: [],
      status: 'draft',
      description: ''
    });
    setNewTag('');
  };

  const handleSubmit = () => {
    if (!newDocument.title.trim()) {
      toast.error('Le titre est requis');
      return;
    }
    if (!newDocument.team_id) {
      toast.error('Veuillez sélectionner une équipe');
      return;
    }
    onSubmit();
    resetForm();
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Nouveau document</span>
          </DialogTitle>
          <DialogDescription>
            Créez un nouveau document de documentation avec tous les détails nécessaires
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informations de base</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doc-title">Titre *</Label>
                <Input
                  id="doc-title"
                  value={newDocument.title}
                  onChange={(e) => setNewDocument({...newDocument, title: e.target.value})}
                  placeholder="Titre du document"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-category">Catégorie</Label>
                <Select 
                  value={newDocument.category} 
                  onValueChange={(value) => setNewDocument({...newDocument, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => {
                      const Icon = category.icon;
                      return (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4" />
                            <span>{category.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-description">Description</Label>
              <Textarea
                id="doc-description"
                value={newDocument.description}
                onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
                placeholder="Description courte du document"
                rows={3}
              />
            </div>
          </div>

          {/* Équipe et statut */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Organisation</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="team-select">
                  <Building2 className="h-4 w-4 inline mr-2" />
                  Équipe cliente *
                </Label>
                {teamsLoading ? (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground p-3 border rounded-md">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>Chargement des équipes...</span>
                  </div>
                ) : !organizationData?.teams || organizationData.teams.length === 0 ? (
                  <div className="text-sm text-destructive p-3 border border-destructive rounded-md">
                    Aucune équipe cliente disponible. Veuillez contacter un administrateur.
                  </div>
                ) : (
                  <Select 
                    value={newDocument.team_id} 
                    onValueChange={(value) => setNewDocument({...newDocument, team_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une équipe cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizationData.teams.map((team: any) => {
                        const organization = organizationData.organizations.find((org: any) => org.id === team.organization_id);
                        return (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{organization?.name}</span>
                              <span className="text-sm text-muted-foreground">{team.name}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-status">Statut initial</Label>
                <Select 
                  value={newDocument.status} 
                  onValueChange={(value: 'draft' | 'published' | 'archived') => setNewDocument({...newDocument, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">Brouillon</Badge>
                        <span>Brouillon</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="published">
                      <div className="flex items-center space-x-2">
                        <Badge variant="default" className="text-xs">Publié</Badge>
                        <span>Publié</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="archived">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">Archivé</Badge>
                        <span>Archivé</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tags</h3>
            
            <div className="space-y-3">
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Ajouter un tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-9"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {newDocument.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newDocument.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                      <span>{tag}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTag(tag)}
                        className="h-4 w-4 p-0 hover:bg-transparent"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!newDocument.title.trim() || !newDocument.team_id || teamsLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer le document
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDocumentModal; 