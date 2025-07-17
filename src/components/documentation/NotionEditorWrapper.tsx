import React from 'react';
import { TipTapEditor } from './TipTapEditor';
import { Loader2 } from 'lucide-react';

interface NotionEditorWrapperProps {
  documentId: string;
  teamId: string;
  content?: any;
  onSave?: (content: any) => void;
  readOnly?: boolean;
}

export function NotionEditorWrapper({ 
  content,
  onSave,
  readOnly = false 
}: NotionEditorWrapperProps) {
  // Si on veut afficher un loader, on peut le faire via une prop ou un état externe
  // Ici, on suppose que le parent gère le chargement

  return (
    <div className="relative h-full">
      <TipTapEditor
        content={content}
        onSave={onSave}
        editable={!readOnly}
        autoSave={!!onSave}
        autoSaveDelay={1500}
      />
    </div>
  );
}
// Ancienne logique supprimée : NotionClone, useNotionEditor, etc.