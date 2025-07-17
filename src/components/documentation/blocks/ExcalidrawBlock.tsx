import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DocumentContentBlock, ExcalidrawData } from "@/types/documentBlocks";
import { Edit, Eye, Save, X } from 'lucide-react';

// Lazy load Excalidraw to avoid SSR issues
const ExcalidrawComponent = React.lazy(() => 
  import('@excalidraw/excalidraw').then((module) => ({ default: module.Excalidraw }))
);

interface ExcalidrawBlockProps {
  block: DocumentContentBlock;
  onUpdate: (updates: Partial<DocumentContentBlock>) => void;
}

export const ExcalidrawBlock: React.FC<ExcalidrawBlockProps> = ({ block, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(block.title || '');
  const [excalidrawData, setExcalidrawData] = useState<ExcalidrawData>(
    (block.content as ExcalidrawData) || { elements: [], appState: { viewBackgroundColor: '#ffffff' } }
  );

  useEffect(() => {
    setEditTitle(block.title || '');
    setExcalidrawData((block.content as ExcalidrawData) || { elements: [], appState: { viewBackgroundColor: '#ffffff' } });
  }, [block]);

  const handleSave = () => {
    onUpdate({
      title: editTitle,
      content: excalidrawData
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(block.title || '');
    setExcalidrawData((block.content as ExcalidrawData) || { elements: [], appState: { viewBackgroundColor: '#ffffff' } });
    setIsEditing(false);
  };

  const handleExcalidrawChange = (elements: any[], appState: any, files: any) => {
    setExcalidrawData({
      elements,
      appState,
      files
    });
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
        
        <div className="border rounded-lg" style={{ height: '500px' }}>
          <React.Suspense fallback={<div className="flex items-center justify-center h-full">Chargement d'Excalidraw...</div>}>
            <ExcalidrawComponent
              initialData={{
                elements: excalidrawData.elements,
                appState: excalidrawData.appState,
                files: excalidrawData.files
              }}
              onChange={handleExcalidrawChange}
              viewModeEnabled={false}
            />
          </React.Suspense>
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
      
      <div className="border rounded-lg" style={{ height: '400px' }}>
        <React.Suspense fallback={<div className="flex items-center justify-center h-full">Chargement d'Excalidraw...</div>}>
          <ExcalidrawComponent
            initialData={{
              elements: excalidrawData.elements,
              appState: excalidrawData.appState,
              files: excalidrawData.files
            }}
            viewModeEnabled={true}
            zenModeEnabled={false}
          />
        </React.Suspense>
      </div>
    </div>
  );
};