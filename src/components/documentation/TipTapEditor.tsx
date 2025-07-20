import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Focus from '@tiptap/extension-focus';
import Gapcursor from '@tiptap/extension-gapcursor';
import { common, createLowlight } from 'lowlight';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  Minus,
  Undo,
  Redo,
  Type,
  Save,
  Eye,
  EyeOff,
  Menu,
  MoreHorizontal,
} from 'lucide-react';
import { SlashCommand, slashMenuSuggestion } from './extensions/SlashCommand';
import { DragAndDropExtension } from './extensions/DragAndDropExtension';
import { EditorHelp } from './EditorHelp';

const lowlight = createLowlight(common);

export interface TipTapEditorProps {
  content?: any;
  onChange?: (content: any) => void;
  onSave?: (content: any) => void;
  editable?: boolean;
  className?: string;
  placeholder?: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
  showAutoSaveToggle?: boolean; // Nouvelle prop pour afficher le toggle
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  content,
  onChange,
  onSave,
  editable = true,
  className = '',
  placeholder = 'Tapez "/" pour voir les commandes ou commencez à écrire...',
  autoSave = false,
  autoSaveDelay = 2000,
  showAutoSaveToggle = true, // Default to true
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveRetryCount, setSaveRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wordCount, setWordCount] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [documentHistory, setDocumentHistory] = useState<{
    content: any;
    timestamp: Date;
    wordCount: number;
  }[]>([]);
  const [localAutoSave, setLocalAutoSave] = useState(autoSave);
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>('');
  const maxRetries = 3;
  const maxHistoryEntries = 10;
  
  // Délais plus raisonnables pour l'auto-save
  const getAutoSaveDelay = () => {
    // Si l'utilisateur écrit activement, attendre plus longtemps
    const baseDelay = autoSaveDelay || 10000; // 10 secondes par défaut au lieu de 2
    return hasUnsavedChanges ? baseDelay : baseDelay * 2; // 20 secondes si déjà des changements
  };

  // Détecter le statut de connexion
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSave = async (content: any, isRetry = false) => {
    if (!onSave) return;
    
    // Vérifier la connectivité
    if (!isOnline) {
      setSaveError('Pas de connexion internet');
      return;
    }
    
    setIsSaving(true);
    if (!isRetry) {
      setSaveError(null);
      setSaveRetryCount(0);
    }
    
    try {
      await onSave(content);
      setLastSaved(new Date());
      setSaveError(null);
      setSaveRetryCount(0);
      setHasUnsavedChanges(false);
      lastSavedContentRef.current = JSON.stringify(content);
      
      // Notification de succès discrète (seulement si sauvegarde manuelle)
      if (!autoSave) {
        console.log('Document sauvegardé avec succès');
      }
    } catch (error: any) {
      console.error('Save error:', error);
      
      const errorMessage = error?.message || 'Erreur de sauvegarde';
      const retryCount = saveRetryCount + 1;
      
      // Déterminer le type d'erreur et la stratégie de retry
      const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('network');
      const isServerError = errorMessage.includes('500') || errorMessage.includes('server');
      
      if ((isNetworkError || isServerError) && retryCount < maxRetries) {
        // Retry avec backoff exponentiel
        const delay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
        setSaveRetryCount(retryCount);
        setSaveError(`Tentative ${retryCount}/${maxRetries}...`);
        
        setTimeout(() => {
          handleSave(content, true);
        }, delay);
      } else {
        // Erreur finale
        if (retryCount >= maxRetries) {
          setSaveError('Échec après plusieurs tentatives');
        } else {
          setSaveError(errorMessage);
        }
        setSaveRetryCount(0);
      }
    } finally {
      if (!isRetry || saveRetryCount >= maxRetries) {
        setIsSaving(false);
      }
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Désactiver les extensions que nous configurons séparément
        link: false,
        codeBlock: false,
      }),
      SlashCommand.configure({
        suggestion: slashMenuSuggestion,
      }),
      DragAndDropExtension.configure({
        allowedNodes: ['paragraph', 'heading', 'bulletList', 'orderedList', 'blockquote', 'codeBlock'],
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto shadow-md my-4',
        },
        allowBase64: true,
        inline: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-2 hover:text-primary/80 cursor-pointer',
        },
        protocols: ['http', 'https', 'mailto'],
        defaultProtocol: 'https',
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full border border-border my-4',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-border bg-muted/50 font-medium p-2 text-left',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-border p-2 min-w-[100px]',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto my-4 border',
        },
        defaultLanguage: 'plaintext',
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Typography,
      Focus.configure({
        className: 'has-focus',
        mode: 'all',
      }),
      Gapcursor,
    ],
    content: content || '',
    editable,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const text = editor.getText();
      const currentContent = JSON.stringify(json);
      
      setWordCount(text.trim().split(/\s+/).filter(word => word.length > 0).length);
      onChange?.(json);
      
      // Détecter les changements non sauvés
      if (currentContent !== lastSavedContentRef.current) {
        setHasUnsavedChanges(true);
        
        // Créer un snapshot d'historique toutes les 50 modifications ou 2 minutes
        const lastHistoryEntry = documentHistory[documentHistory.length - 1];
        const shouldCreateSnapshot = !lastHistoryEntry || 
          (Date.now() - lastHistoryEntry.timestamp.getTime() > 2 * 60 * 1000) ||
          Math.abs(text.length - lastHistoryEntry.wordCount) > 50;
          
        if (shouldCreateSnapshot) {
          setDocumentHistory(prev => {
            const newHistory = [...prev, {
              content: json,
              timestamp: new Date(),
              wordCount: text.trim().split(/\s+/).filter(word => word.length > 0).length
            }];
            
            // Garder seulement les dernières entrées
            return newHistory.slice(-maxHistoryEntries);
          });
        }
      }
      
      // Auto-save with debounce - seulement si activé localement
      if (localAutoSave && onSave && currentContent !== lastSavedContentRef.current) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        
        // Auto-save plus intelligent : sauvegarder seulement après une pause dans l'écriture
        saveTimeoutRef.current = setTimeout(async () => {
          await handleSave(json);
        }, getAutoSaveDelay());
      }
    },
    editorProps: {
      attributes: {
        class: `prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-4 ${className}`,
      },
      handleDOMEvents: {
        keydown: (view, event) => {
          // Raccourcis clavier avancés
          if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
              case 's':
                event.preventDefault();
                if (onSave) handleSave(editor.getJSON());
                return true;
              case 'z':
                if (event.shiftKey) {
                  event.preventDefault();
                  editor.commands.redo();
                } else {
                  event.preventDefault();
                  editor.commands.undo();
                }
                return true;
              case 'k':
                event.preventDefault();
                setLink();
                return true;
              case '`':
                event.preventDefault();
                editor.chain().focus().toggleCode().run();
                return true;
              case 'b':
                if (!event.shiftKey) {
                  event.preventDefault();
                  editor.chain().focus().toggleBold().run();
                  return true;
                }
                break;
              case 'i':
                event.preventDefault();
                editor.chain().focus().toggleItalic().run();
                return true;
              case '1':
                if (event.altKey) {
                  event.preventDefault();
                  editor.chain().focus().toggleHeading({ level: 1 }).run();
                  return true;
                }
                break;
              case '2':
                if (event.altKey) {
                  event.preventDefault();
                  editor.chain().focus().toggleHeading({ level: 2 }).run();
                  return true;
                }
                break;
              case '3':
                if (event.altKey) {
                  event.preventDefault();
                  editor.chain().focus().toggleHeading({ level: 3 }).run();
                  return true;
                }
                break;
              case 'Enter':
                if (event.shiftKey) {
                  event.preventDefault();
                  editor.chain().focus().setHardBreak().run();
                  return true;
                }
                break;
            }
          }
          
          // Raccourcis avec Shift
          if (event.ctrlKey && event.shiftKey) {
            switch (event.key) {
              case '8':
                event.preventDefault();
                editor.chain().focus().toggleBulletList().run();
                return true;
              case '7':
                event.preventDefault();
                editor.chain().focus().toggleOrderedList().run();
                return true;
              case 'B':
                event.preventDefault();
                editor.chain().focus().toggleBlockquote().run();
                return true;
            }
          }
          
          return false;
        },
      },
    },
  });

  const restoreFromHistory = useCallback((historyIndex: number) => {
    const historyEntry = documentHistory[historyIndex];
    if (historyEntry && editor) {
      editor.commands.setContent(historyEntry.content);
      setHasUnsavedChanges(true);
    }
  }, [editor, documentHistory]);

  const addImage = useCallback(() => {
    const url = window.prompt('URL de l\'image:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL du lien:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  useEffect(() => {
    if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative border border-border rounded-lg bg-background">
      {/* Toolbar moderne et sticky */}
      {editable && (
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
          {/* Toolbar principal */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Toolbar Mobile (sm et moins) */}
              <div className="flex sm:hidden items-center gap-1">
                {/* Groupe essentiel mobile */}
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`h-8 w-8 p-0 transition-colors ${
                      editor.isActive('bold') 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-background'
                    }`}
                    title="Gras"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`h-8 w-8 p-0 transition-colors ${
                      editor.isActive('italic') 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-background'
                    }`}
                    title="Italique"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                </div>

                {/* Menu burger pour les autres outils */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem onClick={() => editor.chain().focus().toggleCode().run()}>
                      <Code className="mr-2 h-4 w-4" />
                      Code inline
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                      <Heading1 className="mr-2 h-4 w-4" />
                      Titre 1
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                      <Heading2 className="mr-2 h-4 w-4" />
                      Titre 2
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                      <Heading3 className="mr-2 h-4 w-4" />
                      Titre 3
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => editor.chain().focus().toggleBulletList().run()}>
                      <List className="mr-2 h-4 w-4" />
                      Liste à puces
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                      <ListOrdered className="mr-2 h-4 w-4" />
                      Liste numérotée
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                      <Quote className="mr-2 h-4 w-4" />
                      Citation
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={setLink}>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Insérer lien
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={addImage}>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Insérer image
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={addTable}>
                      <TableIcon className="mr-2 h-4 w-4" />
                      Insérer tableau
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Toolbar Tablette (md) */}
              <div className="hidden sm:flex md:hidden items-center gap-2">
                {/* Groupe: Historique */}
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    className="h-8 w-8 p-0 disabled:opacity-30"
                    title="Annuler"
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    className="h-8 w-8 p-0 disabled:opacity-30"
                    title="Refaire"
                  >
                    <Redo className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Groupe: Format de base */}
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`h-8 w-8 p-0 transition-colors ${
                      editor.isActive('bold') 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-background'
                    }`}
                    title="Gras"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`h-8 w-8 p-0 transition-colors ${
                      editor.isActive('italic') 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-background'
                    }`}
                    title="Italique"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className={`h-8 w-8 p-0 transition-colors ${
                      editor.isActive('code') 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-background'
                    }`}
                    title="Code"
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                </div>

                {/* Groupe: Titres compacts */}
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`h-8 w-8 p-0 transition-colors ${
                      editor.isActive('heading', { level: 1 }) 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-background'
                    }`}
                    title="Titre 1"
                  >
                    <Heading1 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`h-8 w-8 p-0 transition-colors ${
                      editor.isActive('heading', { level: 2 }) 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-background'
                    }`}
                    title="Titre 2"
                  >
                    <Heading2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Menu pour les outils secondaires */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem onClick={() => editor.chain().focus().toggleBulletList().run()}>
                      <List className="mr-2 h-4 w-4" />
                      Liste à puces
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                      <ListOrdered className="mr-2 h-4 w-4" />
                      Liste numérotée
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                      <Quote className="mr-2 h-4 w-4" />
                      Citation
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={setLink}>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Insérer lien
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={addImage}>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Insérer image
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={addTable}>
                      <TableIcon className="mr-2 h-4 w-4" />
                      Insérer tableau
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Toolbar Desktop (lg et plus) - Version complète existante */}
              <div className="hidden md:flex items-center gap-2 flex-wrap">
                {/* Groupe: Historique */}
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    className="h-8 w-8 p-0 disabled:opacity-30"
                    title="Annuler (Ctrl+Z)"
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    className="h-8 w-8 p-0 disabled:opacity-30"
                    title="Refaire (Ctrl+Shift+Z)"
                  >
                    <Redo className="h-4 w-4" />
                  </Button>
                </div>
                
                <Separator orientation="vertical" className="h-8" />
                
                {/* Groupe: Format de texte */}
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`h-8 w-8 p-0 transition-colors ${
                      editor.isActive('bold') 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-background'
                    }`}
                    title="Gras (Ctrl+B)"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`h-8 w-8 p-0 transition-colors ${
                      editor.isActive('italic') 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-background'
                    }`}
                    title="Italique (Ctrl+I)"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className={`h-8 w-8 p-0 transition-colors ${
                      editor.isActive('code') 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-background'
                    }`}
                    title="Code inline (Ctrl+`)"
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                </div>
                
                <Separator orientation="vertical" className="h-8" />
                
                {/* Groupe: Titres et structure */}
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().setParagraph().run()}
                    className={`h-8 w-8 p-0 transition-colors ${
                      editor.isActive('paragraph') 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-background'
                    }`}
                    title="Paragraphe normal"
                  >
                    <Type className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`h-8 w-8 p-0 transition-colors ${
                      editor.isActive('heading', { level: 1 }) 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-background'
                    }`}
                    title="Titre 1 (Ctrl+Alt+1)"
                  >
                    <Heading1 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`h-8 w-8 p-0 transition-colors ${
                      editor.isActive('heading', { level: 2 }) 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-background'
                    }`}
                    title="Titre 2 (Ctrl+Alt+2)"
                  >
                    <Heading2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`h-8 w-8 p-0 transition-colors ${
                      editor.isActive('heading', { level: 3 }) 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-background'
                    }`}
                    title="Titre 3 (Ctrl+Alt+3)"
                  >
                    <Heading3 className="h-4 w-4" />
                  </Button>
                </div>
                
                <Separator orientation="vertical" className="h-8" />
                
                {/* Groupe: Listes et citations */}
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`h-8 w-8 p-0 transition-colors ${
                      editor.isActive('bulletList') 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-background'
                    }`}
                    title="Liste à puces (Ctrl+Shift+8)"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`h-8 w-8 p-0 transition-colors ${
                      editor.isActive('orderedList') 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-background'
                    }`}
                    title="Liste numérotée (Ctrl+Shift+7)"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`h-8 w-8 p-0 transition-colors ${
                      editor.isActive('blockquote') 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-background'
                    }`}
                    title="Citation (Ctrl+Shift+B)"
                  >
                    <Quote className="h-4 w-4" />
                  </Button>
                </div>
                
                <Separator orientation="vertical" className="h-8" />
                
                {/* Groupe: Médias et éléments avancés */}
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={setLink}
                    className={`h-8 w-8 p-0 transition-colors ${
                      editor.isActive('link') 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-background'
                    }`}
                    title="Insérer/modifier un lien (Ctrl+K)"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addImage}
                    className="h-8 w-8 p-0 hover:bg-background"
                    title="Insérer une image"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addTable}
                    className="h-8 w-8 p-0 hover:bg-background"
                    title="Insérer un tableau"
                  >
                    <TableIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    className={`h-8 w-8 p-0 transition-colors ${
                      editor.isActive('codeBlock') 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-background'
                    }`}
                    title="Bloc de code (Ctrl+Alt+C)"
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    className="h-8 w-8 p-0 hover:bg-background"
                    title="Ligne de séparation"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Actions de droite */}
            <div className="flex items-center gap-2">
              {/* Toggle Auto-save */}
              {showAutoSaveToggle && onSave && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLocalAutoSave(!localAutoSave)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                      localAutoSave 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                    title={localAutoSave ? 'Désactiver l\'auto-save' : 'Activer l\'auto-save'}
                  >
                    <div className={`w-2 h-2 rounded-full ${localAutoSave ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    Auto-save
                  </button>
                  <EditorHelp />
                </div>
              )}
              
              {/* Indicateur de mode d'édition */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                Mode édition
              </div>
              
              {onSave && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSave(editor.getJSON())}
                  disabled={isSaving}
                  className="h-8 px-3 text-xs font-medium"
                  title="Sauvegarder maintenant (Ctrl+S)"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              )}
            </div>
          </div>

          {/* Barre d'info contextuelle */}
          <div className="px-3 py-2 bg-muted/30 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  {wordCount} {wordCount === 1 ? 'mot' : 'mots'}
                </span>
                
                {/* Indicateur de connectivité */}
                <span className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  {isOnline ? 'En ligne' : 'Hors ligne'}
                </span>
                
                {/* Indicateur de changements non sauvés */}
                {hasUnsavedChanges && (
                  <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                    Modifications non sauvées
                  </span>
                )}
                
                {lastSaved && !hasUnsavedChanges && (
                  <span className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    Sauvé: {lastSaved.toLocaleTimeString()}
                  </span>
                )}
                
                {saveError && (
                  <Badge variant="destructive" className="text-xs py-0 px-2 h-5 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-red-200 rounded-full"></div>
                    {saveError}
                  </Badge>
                )}
                
                {isSaving && (
                  <Badge variant="secondary" className="text-xs py-0 px-2 h-5 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                    {saveRetryCount > 0 ? `Retry ${saveRetryCount}/${maxRetries}...` : 'Sauvegarde...'}
                  </Badge>
                )}
                
                
                
                {/* Statut Auto-save */}
                {localAutoSave ? (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    Auto-save actif ({getAutoSaveDelay() / 1000}s)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                    Sauvegarde manuelle
                  </span>
                )}
                
                {/* Historique des versions */}
                {documentHistory.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-5 px-2 text-xs">
                        Historique ({documentHistory.length})
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                      <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                        Versions précédentes
                      </div>
                      <DropdownMenuSeparator />
                      {documentHistory.slice().reverse().map((entry, index) => {
                        const reverseIndex = documentHistory.length - 1 - index;
                        return (
                          <DropdownMenuItem
                            key={reverseIndex}
                            onClick={() => restoreFromHistory(reverseIndex)}
                            className="flex flex-col items-start gap-1 p-3"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-sm font-medium">
                                Version {reverseIndex + 1}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {entry.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {entry.wordCount} mots
                            </span>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              <div className="hidden lg:flex items-center gap-4 text-xs">
                <span>
                  Tapez <kbd className="px-1.5 py-0.5 bg-background border border-border rounded">{"/"}</kbd> pour insérer
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-background border border-border rounded">Ctrl</kbd>
                  <span className="mx-1">+</span>
                  <kbd className="px-1.5 py-0.5 bg-background border border-border rounded">S</kbd>
                  <span className="ml-1">sauvegarder</span>
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-background border border-border rounded">Ctrl</kbd>
                  <span className="mx-1">+</span>
                  <kbd className="px-1.5 py-0.5 bg-background border border-border rounded">K</kbd>
                  <span className="ml-1">lien</span>
                </span>
              </div>
              
              <div className="hidden md:block lg:hidden">
                <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs">{"/"}</kbd> pour insérer des blocs
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Éditeur principal */}
      <div ref={editorRef} className="relative">
        <EditorContent editor={editor} />
      </div>

      {/* Styles CSS avancés */}
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
        
        .ProseMirror .has-focus {
          border-radius: 6px;
          box-shadow: 0 0 0 2px hsl(var(--ring));
        }
        
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .ProseMirror blockquote {
          border-left: 4px solid hsl(var(--primary));
          padding-left: 1rem;
          margin: 1.5rem 0;
          font-style: italic;
          background: hsl(var(--muted)/20);
          border-radius: 0 6px 6px 0;
          padding: 1rem 1rem 1rem 1.5rem;
        }
        
        .ProseMirror hr {
          border: none;
          border-top: 2px solid hsl(var(--border));
          margin: 2rem 0;
        }
        
        .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
          font-weight: 600;
          margin-top: 2rem;
          margin-bottom: 1rem;
          line-height: 1.2;
        }
        
        .ProseMirror h1 { font-size: 2.5rem; }
        .ProseMirror h2 { font-size: 2rem; }
        .ProseMirror h3 { font-size: 1.5rem; }
        
        /* Responsive typography */
        @media (max-width: 768px) {
          .ProseMirror h1 { font-size: 2rem; }
          .ProseMirror h2 { font-size: 1.75rem; }
          .ProseMirror h3 { font-size: 1.25rem; }
          .ProseMirror { padding: 1rem !important; }
        }
        
        .ProseMirror code {
          background-color: hsl(var(--muted));
          padding: 0.25rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
        }
        
        .ProseMirror pre {
          background-color: hsl(var(--muted));
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem;
          padding: 1rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        
        /* Responsive code blocks */
        @media (max-width: 640px) {
          .ProseMirror pre {
            padding: 0.75rem;
            font-size: 0.875rem;
          }
        }
        
        .ProseMirror pre code {
          background-color: transparent;
          padding: 0;
          border-radius: 0;
        }
        
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 1rem 0;
        }
        
        /* Mobile list adjustments */
        @media (max-width: 640px) {
          .ProseMirror ul, .ProseMirror ol {
            padding-left: 1rem;
          }
        }
        
        .ProseMirror li {
          margin: 0.25rem 0;
          line-height: 1.6;
        }
        
        .ProseMirror table {
          margin: 1.5rem 0;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          overflow: hidden;
          width: 100%;
        }
        
        /* Responsive table */
        @media (max-width: 768px) {
          .ProseMirror table {
            font-size: 0.875rem;
            margin: 1rem 0;
          }
          .ProseMirror th, .ProseMirror td {
            padding: 0.5rem !important;
          }
        }
        
        .ProseMirror th {
          background-color: hsl(var(--muted));
          font-weight: 600;
        }
        
        .ProseMirror p {
          line-height: 1.7;
          margin: 0.75rem 0;
        }
        
        .ProseMirror a {
          transition: color 0.2s ease;
        }
        
        .ProseMirror a:hover {
          color: hsl(var(--primary)/80);
        }
        
        /* Drag handles */
        .drag-handle-container {
          position: relative;
        }
        
        .drag-handle {
          position: absolute;
          left: -2rem;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0;
          transition: opacity 0.2s ease;
          z-index: 10;
        }
        
        .ProseMirror-widget:hover .drag-handle,
        .ProseMirror p:hover + .drag-handle,
        .ProseMirror h1:hover + .drag-handle,
        .ProseMirror h2:hover + .drag-handle,
        .ProseMirror h3:hover + .drag-handle {
          opacity: 1;
        }
        
        /* Mobile drag handle adjustments */
        @media (max-width: 768px) {
          .drag-handle {
            left: -1.5rem;
            opacity: 0.3;
          }
        }
        
        /* Drop indicators */
        .drop-indicator {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: hsl(var(--primary));
          border-radius: 1px;
          opacity: 0;
          transition: opacity 0.2s ease;
          z-index: 20;
        }
        
        .drop-indicator.active {
          opacity: 1;
        }
        
        /* Dragging state */
        .dragging {
          opacity: 0.5 !important;
          transform: rotate(2deg);
          transition: all 0.2s ease;
        }
        
        /* Focus improvements */
        .ProseMirror:focus-within {
          box-shadow: 0 0 0 2px hsl(var(--ring)/20);
          border-radius: 6px;
        }
        
        /* Selection styling */
        .ProseMirror ::selection {
          background-color: hsl(var(--primary)/20);
        }
        
        /* Mobile touch improvements */
        @media (max-width: 768px) {
          .ProseMirror {
            -webkit-touch-callout: none;
            -webkit-user-select: text;
            -khtml-user-select: text;
            -moz-user-select: text;
            -ms-user-select: text;
            user-select: text;
          }
          
          /* Larger touch targets */
          .ProseMirror a {
            min-height: 44px;
            display: inline-flex;
            align-items: center;
          }
        }
        
        /* Loading state */
        .editor-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
        }
        
        /* Smooth scrolling */
        .ProseMirror {
          scroll-behavior: smooth;
        }
        
        /* Accessibility improvements */
        .ProseMirror:focus {
          outline: 2px solid hsl(var(--ring));
          outline-offset: 2px;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .ProseMirror, .drag-handle, .drop-indicator {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};