import React from 'react';
import { NotionLikeEditor } from './NotionLikeEditor';
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
      
      <NotionLikeEditor
        documentId={documentId}
        teamId={teamId}
        blocks={blocks}
        onSave={handleSave}
        readOnly={readOnly}
      />
    </div>
  );
}