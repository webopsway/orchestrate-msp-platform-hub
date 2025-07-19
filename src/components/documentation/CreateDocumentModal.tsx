import React, { useState } from 'react';
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
  X 
} from 'lucide-react';

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

  const addTag = () => {
    if (newTag.trim() && !newDocument.tags.includes(newTag.trim())) {
      setNewDocument({
        ...newDocument,
        tags: [...newDocument.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewDocument({
      ...newDocument,
      tags: newDocument.tags.filter(tag => tag !== tagToRemove)
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
    onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Nouveau document</span>
          </DialogTitle>
          <DialogDescription>
            Créez un nouveau document avec les informations de base
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={newDocument.title}
                onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                placeholder="Titre du document"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newDocument.description}
                onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                placeholder="Description courte du document"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select 
                  value={newDocument.category} 
                  onValueChange={(value) => setNewDocument({ ...newDocument, category: value })}
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
                  value={newDocument.status} 
                  onValueChange={(value: 'draft' | 'published' | 'archived') => 
                    setNewDocument({ ...newDocument, status: value })
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

            <div>
              <Label htmlFor="team">Équipe *</Label>
              <Select 
                value={newDocument.team_id} 
                onValueChange={(value) => setNewDocument({ ...newDocument, team_id: value })}
                disabled={teamsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={teamsLoading ? "Chargement..." : "Sélectionner une équipe"} />
                </SelectTrigger>
                <SelectContent>
                  {organizationData?.teams?.map((team: any) => {
                    const organization = organizationData.organizations.find((org: any) => org.id === team.organization_id);
                    return (
                      <SelectItem key={team.id} value={team.id}>
                        {organization?.name} - {team.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {newDocument.tags.map((tag, index) => (
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

          {/* Aperçu */}
          {newDocument.title && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Aperçu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(newDocument.category)}
                  <span className="font-medium">{newDocument.title}</span>
                </div>
                {newDocument.description && (
                  <p className="text-sm text-muted-foreground">{newDocument.description}</p>
                )}
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{newDocument.status}</Badge>
                  {newDocument.category && (
                    <>
                      <span>•</span>
                      <span>{newDocument.category}</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!newDocument.title || !newDocument.team_id}>
              Créer le document
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDocumentModal; 