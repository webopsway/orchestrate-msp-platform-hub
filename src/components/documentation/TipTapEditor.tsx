import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
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
} from 'lucide-react';

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
  const editorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
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

  if (!editor) {
    return <div>Chargement de l'éditeur...</div>;
  }

  return (
    <div className="relative">
      {/* Toolbar simple */}
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
        </div>
      )}

      {/* Éditeur */}
      <div ref={editorRef} className="relative">
        <EditorContent editor={editor} />
      </div>

      {/* CSS pour le placeholder */}
      <style>{`
        .ProseMirror[data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          position: absolute;
        }
        .ProseMirror {
          outline: none;
        }
      `}</style>
    </div>
  );
};