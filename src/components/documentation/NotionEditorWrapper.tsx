import React from 'react';
import { NotionClone } from './NotionClone';
import { useNotionEditor } from '../../hooks/useNotionEditor';
import { Loader2 } from 'lucide-react';

interface NotionEditorWrapperProps {
  documentId: string;
  teamId: string;
  readOnly?: boolean;
}

export function NotionEditorWrapper({ 
  documentId, 
  teamId, 
  readOnly = false 
}: NotionEditorWrapperProps) {
  const { blocks, loading, isSaving, handleSave } = useNotionEditor(documentId, teamId);

  const handleNotionSave = (editorBlocks: any[]) => {
    // Convertir au format EditorJS OutputData
    const outputData = {
      version: "2.28.2",
      time: Date.now(),
      blocks: editorBlocks.map(block => ({
        id: block.id,
        type: block.type === 'paragraph' ? 'paragraph' : 
              block.type.startsWith('heading') ? 'header' :
              block.type.includes('list') ? 'list' :
              block.type,
        data: convertBlockToEditorData(block)
      }))
    };
    
    handleSave(outputData);
  };

  const convertBlockToEditorData = (block: any) => {
    switch (block.type) {
      case 'heading1':
      case 'heading2':
      case 'heading3':
        return { 
          text: block.content.text || '', 
          level: parseInt(block.type.replace('heading', '')) 
        };
      case 'bulleted-list':
        return { 
          style: 'unordered', 
          items: [block.content.text || ''] 
        };
      case 'numbered-list':
        return { 
          style: 'ordered', 
          items: [block.content.text || ''] 
        };
      case 'quote':
        return { 
          text: block.content.text || '', 
          caption: '' 
        };
      case 'code':
        return { 
          code: block.content.text || '' 
        };
      case 'todo':
        return { 
          text: block.content.text || '', 
          checked: block.content.checked || false 
        };
      default:
        return { 
          text: block.content.text || '' 
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {isSaving && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-background border rounded-md px-3 py-1 shadow-md">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Saving...</span>
        </div>
      )}
      
      <NotionClone
        documentId={documentId}
        teamId={teamId}
        blocks={blocks}
        onSave={handleNotionSave}
        readOnly={readOnly}
      />
    </div>
  );
}