import React from 'react';
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
  Tag, 
  X, 
  Plus,
  FileText,
  BookOpen,
  File,
  Settings,
  Save,
  Calendar,
  User
} from 'lucide-react';
import { Document } from '@/types/documentation';

interface EditDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document | null;
  onSubmit: () => void;
}

const EditDocumentModal: React.FC<EditDocumentModalProps> = ({
  open,
  onOpenChange,
  document,
  onSubmit
}) => {
  if (!document) return null;

  const categories = [
    { value: 'spécification', label: 'Spécification', icon: BookOpen },
    { value: 'tutorial', label: 'Tutoriels', icon: FileText },
    { value: 'reference', label: 'Référence', icon: File },
    { value: 'procedure', label: 'Procédure', icon: Settings }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'archived': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Modifier le document</span>
          </DialogTitle>
          <DialogDescription>
            Modifiez les métadonnées et les propriétés du document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations du document */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informations du document</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Titre</Label>
                <Input
                  id="edit-title"
                  value={document.title}
                  placeholder="Titre du document"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-category">Catégorie</Label>
                <Select value={document.metadata?.category || ''}>
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
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={document.metadata?.description || ''}
                placeholder="Description du document"
                rows={3}
              />
            </div>
          </div>

          {/* Métadonnées */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Métadonnées</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Version</Label>
                <div className="flex items-center space-x-2 p-2 border rounded-md bg-muted">
                  <Badge variant="outline">{document.version}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={document.metadata?.status || 'draft'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">
                      <Badge variant="secondary" className="text-xs">Brouillon</Badge>
                    </SelectItem>
                    <SelectItem value="published">
                      <Badge variant="default" className="text-xs">Publié</Badge>
                    </SelectItem>
                    <SelectItem value="archived">
                      <Badge variant="outline" className="text-xs">Archivé</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Favori</Label>
                <div className="flex items-center space-x-2 p-2 border rounded-md">
                  <input
                    type="checkbox"
                    checked={document.metadata?.is_favorite || false}
                    className="rounded"
                  />
                  <span className="text-sm">Marquer comme favori</span>
                </div>
              </div>
            </div>
          </div>

          {/* Informations système */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informations système</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Créé le</Label>
                <div className="flex items-center space-x-2 p-2 border rounded-md bg-muted">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    {new Date(document.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Dernière modification</Label>
                <div className="flex items-center space-x-2 p-2 border rounded-md bg-muted">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    {new Date(document.updated_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Créé par</Label>
                <div className="flex items-center space-x-2 p-2 border rounded-md bg-muted">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{document.created_by}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Modifié par</Label>
                <div className="flex items-center space-x-2 p-2 border rounded-md bg-muted">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{document.updated_by || 'Non spécifié'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={onSubmit}>
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditDocumentModal; 