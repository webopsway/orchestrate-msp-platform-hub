import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Image,
  Link,
  Table,
  Minus,
  FileText,
  Hash,
  CheckSquare,
  Terminal,
} from 'lucide-react';

interface BlockOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  command: (editor: Editor) => void;
  keywords: string[];
}

const BLOCK_OPTIONS: BlockOption[] = [
  {
    id: 'paragraph',
    title: 'Texte',
    description: 'Commencez à écrire avec du texte simple',
    icon: Type,
    command: (editor) => editor.chain().focus().setParagraph().run(),
    keywords: ['texte', 'paragraphe', 'p'],
  },
  {
    id: 'heading1',
    title: 'Titre 1',
    description: 'Grande section de titre',
    icon: Heading1,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    keywords: ['titre', 'h1', 'heading', 'grand'],
  },
  {
    id: 'heading2',
    title: 'Titre 2',
    description: 'Section de titre moyenne',
    icon: Heading2,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    keywords: ['titre', 'h2', 'heading', 'moyen'],
  },
  {
    id: 'heading3',
    title: 'Titre 3',
    description: 'Petite section de titre',
    icon: Heading3,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    keywords: ['titre', 'h3', 'heading', 'petit'],
  },
  {
    id: 'bulletList',
    title: 'Liste à puces',
    description: 'Créez une liste simple à puces',
    icon: List,
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
    keywords: ['liste', 'puces', 'bullet', 'ul'],
  },
  {
    id: 'orderedList',
    title: 'Liste numérotée',
    description: 'Créez une liste avec des numéros',
    icon: ListOrdered,
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
    keywords: ['liste', 'numérotée', 'numbered', 'ol', 'nombres'],
  },
  {
    id: 'blockquote',
    title: 'Citation',
    description: 'Capturez une citation ou une remarque',
    icon: Quote,
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
    keywords: ['citation', 'quote', 'remarque'],
  },
  {
    id: 'codeBlock',
    title: 'Bloc de code',
    description: 'Capturez un extrait de code avec coloration',
    icon: Terminal,
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    keywords: ['code', 'programmation', 'script', 'terminal'],
  },
  {
    id: 'code',
    title: 'Code inline',
    description: 'Formatez du code dans le texte',
    icon: Code,
    command: (editor) => editor.chain().focus().toggleCode().run(),
    keywords: ['code', 'inline', 'formatage'],
  },
  {
    id: 'image',
    title: 'Image',
    description: 'Insérez une image depuis une URL',
    icon: Image,
    command: (editor) => {
      const url = window.prompt('URL de l\'image:');
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    },
    keywords: ['image', 'photo', 'illustration', 'img'],
  },
  {
    id: 'link',
    title: 'Lien',
    description: 'Créez un lien vers une page web',
    icon: Link,
    command: (editor) => {
      const url = window.prompt('URL du lien:');
      if (url) {
        editor.chain().focus().setLink({ href: url }).run();
      }
    },
    keywords: ['lien', 'link', 'url', 'href'],
  },
  {
    id: 'table',
    title: 'Tableau',
    description: 'Insérez un tableau 3x3',
    icon: Table,
    command: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    keywords: ['tableau', 'table', 'grille', 'colonnes', 'lignes'],
  },
  {
    id: 'divider',
    title: 'Séparateur',
    description: 'Insérez une ligne horizontale',
    icon: Minus,
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
    keywords: ['séparateur', 'ligne', 'divider', 'hr', 'horizontal'],
  },
];

interface SlashMenuModernProps {
  editor: Editor;
  query: string;
  range: { from: number; to: number };
  clientRect?: () => DOMRect | null;
  onClose: () => void;
}

export const SlashMenuModern: React.FC<SlashMenuModernProps> = ({
  editor,
  query,
  range,
  clientRect,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredOptions, setFilteredOptions] = useState<BlockOption[]>(BLOCK_OPTIONS);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Filtrer les options basées sur la query
  useEffect(() => {
    const filtered = BLOCK_OPTIONS.filter((option) => {
      const searchTerm = query.toLowerCase();
      return (
        option.title.toLowerCase().includes(searchTerm) ||
        option.description.toLowerCase().includes(searchTerm) ||
        option.keywords.some((keyword) => keyword.includes(searchTerm))
      );
    });
    setFilteredOptions(filtered);
    setSelectedIndex(0);
  }, [query]);

  // Calculer la position du menu
  useEffect(() => {
    if (clientRect) {
      const rect = clientRect();
      if (rect) {
        setPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
        });
      }
    }
  }, [clientRect]);

  // Gestion des touches clavier
  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
        return true;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
        return true;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        selectOption(selectedIndex);
        return true;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return true;
      }

      return false;
    },
    [selectedIndex, filteredOptions.length, onClose]
  );

  // Écouteur d'événements clavier
  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  // Focus sur le menu au montage
  useEffect(() => {
    if (menuRef.current) {
      menuRef.current.focus();
    }
  }, []);

  const selectOption = useCallback(
    (index: number) => {
      const option = filteredOptions[index];
      if (option) {
        // Supprimer le slash et le texte de la query
        editor.chain().focus().deleteRange(range).run();
        // Exécuter la commande
        option.command(editor);
        onClose();
      }
    },
    [editor, filteredOptions, range, onClose]
  );

  if (filteredOptions.length === 0) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-72 bg-background border border-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
      style={{
        top: position.top,
        left: position.left,
      }}
      tabIndex={-1}
    >
      <div className="p-2">
        <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
          Blocs disponibles
        </div>
        <div className="max-h-80 overflow-y-auto">
          {filteredOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <div
                key={option.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
                  index === selectedIndex
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => selectOption(index)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-md ${
                    index === selectedIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">
                    {option.title}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {option.description}
                  </div>
                </div>
                {index === selectedIndex && (
                  <div className="text-xs text-muted-foreground">
                    ↵
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="border-t border-border bg-muted/30 px-3 py-2">
        <div className="text-xs text-muted-foreground">
          ↑↓ Naviguer • ↵ Sélectionner • Échap Fermer
        </div>
      </div>
    </div>
  );
}; 