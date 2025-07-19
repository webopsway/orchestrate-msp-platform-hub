import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  BookOpen, 
  File, 
  Settings, 
  Tag, 
  Plus, 
  X,
  Calendar,
  User,
  Clock,
  Star
} from 'lucide-react';

interface EditDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: any;
  onSubmit: () => void;
}

const EditDocumentModal: React.FC<EditDocumentModalProps> = ({
  open,
  onOpenChange,
  document,
  onSubmit
}) => {
  const [editedDocument, setEditedDocument] = useState<any>(null);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (document) {
      setEditedDocument({
        title: document.title,
        metadata: {
          ...document.metadata,
          tags: [...(document.metadata?.tags || [])]
        }
      });
    }
  }, [document]);

  const addTag = () => {
    if (newTag.trim() && !editedDocument?.metadata?.tags?.includes(newTag.trim())) {
      setEditedDocument({
        ...editedDocument,
        metadata: {
          ...editedDocument.metadata,
          tags: [...(editedDocument.metadata?.tags || []), newTag.trim()]
        }
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditedDocument({
      ...editedDocument,
      metadata: {
        ...editedDocument.metadata,
        tags: editedDocument.metadata?.tags?.filter((tag: string) => tag !== tagToRemove) || []
      }
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'spécification': return BookOpen;
      case 'tutorial': return FileText;
      case 'reference': return File;
      case 'procedure': return Settings;
      default: return FileText;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedDocument) {
      // Mettre à jour le document avec les nouvelles métadonnées
      Object.assign(document, editedDocument);
      onSubmit();
    }
  };

  if (!document || !editedDocument) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier les métadonnées</DialogTitle>
          <DialogDescription>
            Modifiez les informations du document
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={editedDocument.title}
                onChange={(e) => setEditedDocument({ ...editedDocument, title: e.target.value })}
                placeholder="Titre du document"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editedDocument.metadata?.description || ''}
                onChange={(e) => setEditedDocument({
                  ...editedDocument,
                  metadata: { ...editedDocument.metadata, description: e.target.value }
                })}
                placeholder="Description courte du document"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select 
                  value={editedDocument.metadata?.category || ''} 
                  onValueChange={(value) => setEditedDocument({
                    ...editedDocument,
                    metadata: { ...editedDocument.metadata, category: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spécification">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4" />
                        <span>Spécification</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="tutorial">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Tutoriels</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="reference">
                      <div className="flex items-center space-x-2">
                        <File className="h-4 w-4" />
                        <span>Référence</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="procedure">
                      <div className="flex items-center space-x-2">
                        <Settings className="h-4 w-4" />
                        <span>Procédure</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Statut</Label>
                <Select 
                  value={editedDocument.metadata?.status || 'draft'} 
                  onValueChange={(value: 'draft' | 'published' | 'archived') => 
                    setEditedDocument({
                      ...editedDocument,
                      metadata: { ...editedDocument.metadata, status: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="published">Publié</SelectItem>
                    <SelectItem value="archived">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {editedDocument.metadata?.tags?.map((tag: string, index: number) => (
                <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                  <Tag className="h-3 w-3" />
                  <span>{tag}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex space-x-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Ajouter un tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Informations système */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informations système</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Créé par:</span>
                  <span>{document.created_by}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Créé le:</span>
                  <span>{new Date(document.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Modifié le:</span>
                  <span>{new Date(document.updated_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Version:</span>
                  <span>{document.version}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">
              Sauvegarder
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDocumentModal; 