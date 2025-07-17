import React, { useState, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DocumentContentBlock, MarkdownData } from "@/types/documentBlocks";
import { Edit, Eye, Save, X } from 'lucide-react';

interface MarkdownBlockProps {
  block: DocumentContentBlock;
  onUpdate: (updates: Partial<DocumentContentBlock>) => void;
}

export const MarkdownBlock: React.FC<MarkdownBlockProps> = ({ block, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(block.title || '');
  const [editContent, setEditContent] = useState((block.content as MarkdownData)?.content || '');

  useEffect(() => {
    setEditTitle(block.title || '');
    setEditContent((block.content as MarkdownData)?.content || '');
  }, [block]);

  const handleSave = () => {
    onUpdate({
      title: editTitle,
      content: { content: editContent }
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(block.title || '');
    setEditContent((block.content as MarkdownData)?.content || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Titre du bloc"
            className="max-w-md"
          />
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
            <Button onClick={handleCancel} variant="outline" size="sm">
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          </div>
        </div>
        
        <div data-color-mode="light">
          <MDEditor
            value={editContent}
            onChange={(value) => setEditContent(value || '')}
            height={400}
            preview="edit"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{block.title}</h4>
        <Button onClick={() => setIsEditing(true)} variant="ghost" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </div>
      
      <div className="prose max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {(block.content as MarkdownData)?.content || ''}
        </ReactMarkdown>
      </div>
    </div>
  );
};