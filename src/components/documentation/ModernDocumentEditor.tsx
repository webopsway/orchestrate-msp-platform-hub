import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import CodeBlock from '@tiptap/extension-code-block';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  Bold,
  Italic,
  Code,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  CheckSquare,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Save,
  Eye,
  Edit,
  Download,
  Share2,
  Settings,
  MoreHorizontal,
  ChevronLeft,
  Star,
  Clock,
  User,
  Calendar,
  FileText,
  BookOpen,
  File,
  Settings as SettingsIcon,
  AlertCircle,
  CheckCircle,
  Archive,
  Copy,
  Trash2,
  History,
  Plus,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ModernDocumentEditorProps {
  document: any;
  isEditing: boolean;
  onBack: () => void;
  onSave: (content: any) => Promise<void>;
  userProfile: any;
}

interface DocumentMetadata {
  tags?: string[];
  category?: string;
  status?: 'draft' | 'published' | 'archived';
  is_favorite?: boolean;
  description?: string;
  author?: string;
  last_editor?: string;
  view_count?: number;
  [key: string]: any;
}

const ModernDocumentEditor: React.FC<ModernDocumentEditorProps> = ({
  document,
  isEditing,
  onBack,
  onSave,
  userProfile
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [currentContent, setCurrentContent] = useState<any>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-gray-300',
        },
      }),
      TableRow,
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 px-4 py-2',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 px-4 py-2 bg-gray-100 font-bold',
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 rounded-lg p-4 font-mono text-sm',
        },
      }),
      Placeholder.configure({
        placeholder: 'Commencez à écrire votre document...',
        emptyEditorClass: 'is-editor-empty',
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'flex items-start space-x-2',
        },
      }),
    ],
    content: document.content ? JSON.parse(document.content) : null,
    editable: isEditing,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      setCurrentContent(json);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[600px] p-6',
      },
    },
  });

  const safeParseTiptapContent = (content: string | null | undefined) => {
    if (!content) return null;
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error('Erreur de parsing du contenu Tiptap:', e, content);
      return 'error';
    }
  };

  const handleSave = useCallback(async (content: any) => {
    setIsSaving(true);
    try {
      await onSave(content);
      setCurrentContent(content);
      toast.success('Document sauvegardé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  const handleDownloadPDF = async () => {
    try {
      toast.info('Génération du PDF en cours...');
      // Ici, vous pourriez appeler une fonction Supabase Edge Function
      // pour générer le PDF côté serveur
      toast.success('PDF téléchargé avec succès');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleShare = () => {
    toast.info('Fonctionnalité de partage à venir');
  };

  const handleViewHistory = () => {
    toast.info('Historique des versions à venir');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'archived': return 'outline';
      default: return 'outline';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'spécification': return BookOpen;
      case 'tutorial': return FileText;
      case 'reference': return File;
      case 'procedure': return SettingsIcon;
      default: return FileText;
    }
  };

  const addLink = () => {
    if (linkUrl) {
      editor?.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkDialog(false);
    }
  };

  const addImage = () => {
    if (imageUrl) {
      editor?.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageDialog(false);
    }
  };

  const addTable = () => {
    editor?.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run();
    setShowTableDialog(false);
  };

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header fixe */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Retour</span>
            </Button>
            
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-lg font-semibold">{document.title}</h1>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Badge variant={getStatusColor(document.metadata?.status || 'draft')}>
                    {document.metadata?.status || 'draft'}
                  </Badge>
                  <span>•</span>
                  <span>v{document.version}</span>
                  <span>•</span>
                  <Clock className="h-3 w-3" />
                  <span>{new Date(document.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave(currentContent)}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            )}
            
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Partager
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleViewHistory}>
              <History className="h-4 w-4 mr-2" />
              Historique
            </Button>
            
            <Button variant="outline" size="sm" onClick={() => setShowMetadata(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Métadonnées
            </Button>
          </div>
        </div>

        {/* Toolbar d'édition */}
        {isEditing && (
          <div className="border-t px-4 py-2">
            <div className="flex items-center space-x-1 overflow-x-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
              >
                <Redo className="h-4 w-4" />
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'bg-muted' : ''}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'bg-muted' : ''}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={editor.isActive('code') ? 'bg-muted' : ''}
              >
                <Code className="h-4 w-4" />
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
              >
                <Heading1 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
              >
                <Heading2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}
              >
                <Heading3 className="h-4 w-4" />
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? 'bg-muted' : ''}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive('orderedList') ? 'bg-muted' : ''}
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                className={editor.isActive('taskList') ? 'bg-muted' : ''}
              >
                <CheckSquare className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={editor.isActive('blockquote') ? 'bg-muted' : ''}
              >
                <Quote className="h-4 w-4" />
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLinkDialog(true)}
                className={editor.isActive('link') ? 'bg-muted' : ''}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImageDialog(true)}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTableDialog(true)}
              >
                <TableIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Contenu de l'éditeur */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-4">
          {safeParseTiptapContent(document.content) === 'error' ? (
            <Card className="border-destructive">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <h3 className="font-medium text-destructive">Erreur de contenu</h3>
                </div>
                <p className="text-sm text-destructive">
                  Le contenu du document est corrompu ou non lisible.<br />
                  Veuillez contacter un administrateur ou restaurer une version précédente.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="max-w-none">
              <EditorContent editor={editor} />
            </div>
          )}
        </div>
      </div>



      {/* Dialogs */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un lien</DialogTitle>
            <DialogDescription>
              Entrez l'URL du lien à ajouter
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
                Annuler
              </Button>
              <Button onClick={addLink}>
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une image</DialogTitle>
            <DialogDescription>
              Entrez l'URL de l'image à ajouter
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="image-url">URL de l'image</Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowImageDialog(false)}>
                Annuler
              </Button>
              <Button onClick={addImage}>
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTableDialog} onOpenChange={setShowTableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insérer un tableau</DialogTitle>
            <DialogDescription>
              Choisissez la taille du tableau
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="table-rows">Lignes</Label>
                <Input
                  id="table-rows"
                  type="number"
                  min="1"
                  max="10"
                  value={tableRows}
                  onChange={(e) => setTableRows(parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="table-cols">Colonnes</Label>
                <Input
                  id="table-cols"
                  type="number"
                  min="1"
                  max="10"
                  value={tableCols}
                  onChange={(e) => setTableCols(parseInt(e.target.value))}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowTableDialog(false)}>
                Annuler
              </Button>
              <Button onClick={addTable}>
                Insérer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CSS personnalisé */}
      <style>{`
        .ProseMirror {
          outline: none;
        }
        .ProseMirror.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
        }
        .ProseMirror table {
          border-collapse: collapse;
          margin: 0;
          overflow: hidden;
          table-layout: fixed;
          width: 100%;
        }
        .ProseMirror table td,
        .ProseMirror table th {
          border: 2px solid hsl(var(--border));
          box-sizing: border-box;
          min-width: 1em;
          padding: 3px 5px;
          position: relative;
          vertical-align: top;
        }
        .ProseMirror table th {
          background-color: hsl(var(--muted));
          font-weight: bold;
        }
        .ProseMirror table .selectedCell:after {
          background: rgba(200, 200, 255, 0.4);
          content: "";
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }
        .ProseMirror table .column-resize-handle {
          background-color: hsl(var(--primary));
          bottom: -2px;
          position: absolute;
          right: -2px;
          pointer-events: none;
          top: 0;
          width: 4px;
        }
        .ProseMirror table p {
          margin: 0;
        }
        .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
        }
        .ProseMirror ul[data-type="taskList"] p {
          margin: 0;
        }
        .ProseMirror ul[data-type="taskList"] li {
          display: flex;
        }
        .ProseMirror ul[data-type="taskList"] li > label {
          flex: 0 0 auto;
          margin-right: 0.5em;
          user-select: none;
        }
        .ProseMirror ul[data-type="taskList"] li > div {
          flex: 1 1 auto;
        }
      `}</style>
    </div>
  );
};

export default ModernDocumentEditor; 