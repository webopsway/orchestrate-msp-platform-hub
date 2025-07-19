import React, { useState, useEffect, useMemo } from 'react';
import { TipTapEditor } from './TipTapEditor';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Plus,
  Save,
  Eye,
  Edit,
  Download,
  Share2,
  Clock,
  User,
  Tag,
  ChevronLeft,
  MoreVertical,
  Copy,
  Archive,
  Star,
  BookOpen,
  Zap,
  Layout,
  FileTemplate
} from 'lucide-react';
import { toast } from 'sonner';

interface Document {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  category: string;
  tags: string[];
  team_id: string;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  is_favorite?: boolean;
}

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  content: any;
  category: string;
}

const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'blank',
    name: 'Document vierge',
    description: 'Commencez avec un document vide',
    icon: FileText,
    category: 'general',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Nouveau Document' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Commencez à écrire votre documentation ici...' }]
        }
      ]
    }
  },
  {
    id: 'specification',
    name: 'Spécification Technique',
    description: 'Template pour spécifications techniques',
    icon: BookOpen,
    category: 'technical',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Spécification Technique' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '1. Vue d\'ensemble' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Description générale du projet ou de la fonctionnalité.' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '2. Objectifs' }]
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Objectif principal' }] }]
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Objectif secondaire' }] }]
            }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '3. Exigences Techniques' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Détaillez ici les exigences techniques...' }]
        }
      ]
    }
  },
  {
    id: 'process',
    name: 'Procédure / Process',
    description: 'Template pour documenter des procédures',
    icon: Zap,
    category: 'process',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Procédure: [Nom de la Procédure]' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Objectif' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Expliquez l\'objectif de cette procédure.' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Prérequis' }]
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Prérequis 1' }] }]
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Prérequis 2' }] }]
            }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Étapes' }]
        },
        {
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Première étape' }] }]
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Deuxième étape' }] }]
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Troisième étape' }] }]
            }
          ]
        }
      ]
    }
  },
  {
    id: 'meeting',
    name: 'Compte-rendu de Réunion',
    description: 'Template pour comptes-rendus de réunions',
    icon: User,
    category: 'meeting',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Compte-rendu de Réunion' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Date: ' },
            { type: 'text', marks: [{ type: 'bold' }], text: '[Date]' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Participants: ' },
            { type: 'text', marks: [{ type: 'bold' }], text: '[Liste des participants]' }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Ordre du jour' }]
        },
        {
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Point 1' }] }]
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Point 2' }] }]
            }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Décisions prises' }]
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Décision 1' }] }]
            }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Actions à suivre' }]
        },
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Action' }] }] },
                { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Responsable' }] }] },
                { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Échéance' }] }] }
              ]
            },
            {
              type: 'tableRow',
              content: [
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Action 1' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '[Nom]' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '[Date]' }] }] }
              ]
            }
          ]
        }
      ]
    }
  }
];

export interface ClientDocumentationEditorProps {
  teamId?: string;
  onDocumentChange?: (document: Document | null) => void;
}

export const ClientDocumentationEditor: React.FC<ClientDocumentationEditorProps> = ({
  teamId,
  onDocumentChange
}) => {
  const { userProfile } = useAuth();
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentCategory, setDocumentCategory] = useState('general');
  const [documentTags, setDocumentTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const categories = [
    { value: 'general', label: 'Général' },
    { value: 'technical', label: 'Technique' },
    { value: 'process', label: 'Procédures' },
    { value: 'meeting', label: 'Réunions' },
    { value: 'specification', label: 'Spécifications' }
  ];

  const handleCreateFromTemplate = async (template: DocumentTemplate) => {
    if (!documentTitle.trim()) {
      toast.error('Veuillez saisir un titre pour le document');
      return;
    }

    setIsCreating(true);
    try {
      const newDoc = {
        title: documentTitle,
        content: JSON.stringify(template.content),
        status: 'draft' as const,
        category: documentCategory,
        tags: documentTags,
        team_id: teamId || userProfile?.default_team_id || '',
        created_by: userProfile?.id || '',
      };

      const { data, error } = await supabase
        .from('team_documents')
        .insert([newDoc])
        .select()
        .single();

      if (error) throw error;

      const document: Document = {
        ...data,
        tags: data.tags || [],
        is_favorite: false
      };

      setCurrentDocument(document);
      onDocumentChange?.(document);
      setIsTemplateDialogOpen(false);
      setDocumentTitle('');
      setDocumentTags([]);
      
      toast.success('Document créé avec succès !');
    } catch (error) {
      console.error('Error creating document:', error);
      toast.error('Erreur lors de la création du document');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveDocument = async (content: any) => {
    if (!currentDocument) return;

    const { error } = await supabase
      .from('team_documents')
      .update({
        content: JSON.stringify(content),
        updated_by: userProfile?.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentDocument.id);

    if (error) throw error;

    setCurrentDocument(prev => prev ? {
      ...prev,
      content: JSON.stringify(content),
      updated_at: new Date().toISOString()
    } : null);
  };

  const addTag = () => {
    if (newTag.trim() && !documentTags.includes(newTag.trim())) {
      setDocumentTags([...documentTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setDocumentTags(documentTags.filter(tag => tag !== tagToRemove));
  };

  if (currentDocument) {
    const parsedContent = useMemo(() => {
      try {
        return currentDocument.content ? JSON.parse(currentDocument.content) : null;
      } catch (e) {
        console.error('Error parsing document content:', e);
        return null;
      }
    }, [currentDocument.content]);

    return (
      <div className="h-full flex flex-col">
        {/* Header du document */}
        <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentDocument(null);
                onDocumentChange?.(null);
              }}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Retour
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{currentDocument.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={currentDocument.status === 'published' ? 'default' : 'secondary'}>
                  {currentDocument.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Modifié le {new Date(currentDocument.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Exporter PDF
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="mr-2 h-4 w-4" />
                  Partager
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="mr-2 h-4 w-4" />
                  Dupliquer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Archive className="mr-2 h-4 w-4" />
                  Archiver
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Éditeur */}
        <div className="flex-1 overflow-hidden">
          <TipTapEditor
            content={parsedContent}
            onSave={handleSaveDocument}
            editable={true}
            autoSave={false}
            autoSaveDelay={10000}
            showAutoSaveToggle={true}
            placeholder="Utilisez '/' pour insérer des blocs ou commencez à écrire..."
            className="h-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Page d'accueil - Sélection de template */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Créer un nouveau document</h1>
            <p className="text-muted-foreground">
              Choisissez un template pour commencer ou créez un document vierge
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DOCUMENT_TEMPLATES.map((template) => {
              const Icon = template.icon;
              return (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setDocumentCategory(template.category);
                    setIsTemplateDialogOpen(true);
                  }}
                >
                  <CardHeader className="text-center">
                    <Icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground text-center">
                      {template.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dialog de configuration du document */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurer votre document</DialogTitle>
            <DialogDescription>
              Donnez un titre et configurez votre nouveau document
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre du document</Label>
              <Input
                id="title"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Ex: Spécification fonctionnelle v1.0"
              />
            </div>
            
            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Select value={documentCategory} onValueChange={setDocumentCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {documentTags.map(tag => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag} ×
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Ajouter un tag"
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button size="sm" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={() => handleCreateFromTemplate(DOCUMENT_TEMPLATES[0])}
              disabled={!documentTitle.trim() || isCreating}
            >
              {isCreating ? 'Création...' : 'Créer le document'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 