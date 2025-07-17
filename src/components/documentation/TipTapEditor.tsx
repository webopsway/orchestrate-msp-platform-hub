import React, { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
  Minus
} from 'lucide-react';

const lowlight = createLowlight(common);

interface TipTapEditorProps {
  content?: any;
  onChange?: (content: any) => void;
  onSave?: (content: any) => void;
  editable?: boolean;
  className?: string;
  placeholder?: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  content,
  onChange,
  onSave,
  editable = true,
  className = '',
  placeholder = 'Commencez à écrire...',
  autoSave = false,
  autoSaveDelay = 2000
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-2 hover:text-primary/80',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full border border-border',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-border bg-muted/50 font-medium p-2',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-border p-2',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto',
        },
      }),
    ],
    content: content || '',
    editable,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange?.(json);
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[200px] ${className}`,
        'data-placeholder': placeholder,
      },
    },
  });

  // Auto-save logic
  useEffect(() => {
    if (!autoSave || !editor || !onSave) return;

    const timeoutId = setTimeout(() => {
      const json = editor.getJSON();
      onSave(json);
    }, autoSaveDelay);

    return () => clearTimeout(timeoutId);
  }, [editor?.getHTML(), autoSave, autoSaveDelay, onSave]);

  // Update content when prop changes
  useEffect(() => {
    if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const addImage = useCallback(() => {
    const url = window.prompt('URL de l\'image:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL du lien:', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="relative">
      {/* Toolbar fixe */}
      {editable && (
        <div className="sticky top-0 z-10 flex items-center gap-1 p-2 bg-background border-b border-border mb-4">
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
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'bg-muted' : ''}
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant="ghost"
            size="sm"
            onClick={setLink}
            className={editor.isActive('link') ? 'bg-muted' : ''}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={addImage}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={addTable}
          >
            <TableIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive('codeBlock') ? 'bg-muted' : ''}
          >
            <Code className="h-4 w-4" />
            <span className="ml-1 text-xs">Block</span>
          </Button>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent 
        editor={editor} 
        className="min-h-[400px] focus-within:outline-none"
      />

      {/* CSS pour le placeholder et styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .ProseMirror p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: var(--muted-foreground);
            pointer-events: none;
            height: 0;
          }
          
          .ProseMirror {
            outline: none;
          }
          
          .ProseMirror blockquote {
            border-left: 4px solid var(--border);
            padding-left: 1rem;
            margin-left: 0;
            color: var(--muted-foreground);
          }
          
          .ProseMirror hr {
            border: none;
            border-top: 2px solid var(--border);
            margin: 2rem 0;
          }
          
          .ProseMirror ul, .ProseMirror ol {
            padding-left: 1.5rem;
          }
          
          .ProseMirror li {
            margin: 0.25rem 0;
          }
          
          .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
            font-weight: 600;
            margin-top: 2rem;
            margin-bottom: 1rem;
          }
          
          .ProseMirror h1 {
            font-size: 2rem;
          }
          
          .ProseMirror h2 {
            font-size: 1.5rem;
          }
          
          .ProseMirror h3 {
            font-size: 1.25rem;
          }
          
          .ProseMirror code {
            background-color: var(--muted);
            padding: 0.25rem 0.375rem;
            border-radius: 0.25rem;
            font-size: 0.875em;
          }
          
          .ProseMirror pre {
            background-color: var(--muted);
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
          }
          
          .ProseMirror pre code {
            background-color: transparent;
            padding: 0;
          }
          
          .ProseMirror table {
            border-collapse: collapse;
            margin: 1rem 0;
            width: 100%;
            border: 1px solid var(--border);
          }
          
          .ProseMirror th {
            background-color: var(--muted);
            font-weight: 600;
            padding: 0.5rem;
            border: 1px solid var(--border);
          }
          
          .ProseMirror td {
            padding: 0.5rem;
            border: 1px solid var(--border);
          }
        `
      }} />
    </div>
  );
};