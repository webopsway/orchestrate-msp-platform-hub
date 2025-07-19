import React, { useState, useCallback, Suspense, lazy } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pencil, Save, X, ImageIcon } from 'lucide-react';

// Lazy load Excalidraw to avoid SSR issues
const ExcalidrawComponent = lazy(() => 
  import('@excalidraw/excalidraw').then(module => ({ 
    default: module.Excalidraw 
  }))
);

interface ExcalidrawNodeViewProps {
  node: any;
  updateAttributes: (attributes: any) => void;
  selected: boolean;
  editor: any;
}

export function ExcalidrawNodeView({ node, updateAttributes, selected, editor }: ExcalidrawNodeViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.attrs.title || 'Diagramme Excalidraw');
  const [excalidrawData, setExcalidrawData] = useState(node.attrs.data || {
    elements: [],
    appState: {
      viewBackgroundColor: '#ffffff',
      gridSize: null,
      zoom: { value: 1 }
    },
    files: null
  });

  const handleSave = useCallback(() => {
    updateAttributes({
      title: editTitle,
      data: excalidrawData
    });
    setIsEditing(false);
  }, [editTitle, excalidrawData, updateAttributes]);

  const handleCancel = useCallback(() => {
    setEditTitle(node.attrs.title || 'Diagramme Excalidraw');
    setExcalidrawData(node.attrs.data || {
      elements: [],
      appState: {
        viewBackgroundColor: '#ffffff',
        gridSize: null,
        zoom: { value: 1 }
      },
      files: null
    });
    setIsEditing(false);
  }, [node.attrs]);

  const handleExcalidrawChange = useCallback((elements: any[], appState: any, files: any) => {
    setExcalidrawData({
      elements,
      appState,
      files
    });
  }, []);

  const hasElements = excalidrawData.elements && excalidrawData.elements.length > 0;

  if (isEditing) {
    return (
      <NodeViewWrapper className="relative my-4">
        <Card className="p-4 border-2 border-dashed border-primary">
          <div className="flex items-center justify-between mb-4">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="flex-1 mr-4"
              placeholder="Titre du diagramme"
            />
            <div className="flex space-x-2">
              <Button onClick={handleSave} size="sm" variant="default">
                <Save className="h-4 w-4 mr-1" />
                Sauvegarder
              </Button>
              <Button onClick={handleCancel} size="sm" variant="outline">
                <X className="h-4 w-4 mr-1" />
                Annuler
              </Button>
            </div>
          </div>
          
          <div className="h-96 border rounded-lg overflow-hidden">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full bg-muted">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Chargement d'Excalidraw...</p>
                </div>
              </div>
            }>
              <ExcalidrawComponent
                initialData={excalidrawData}
                onChange={handleExcalidrawChange}
                theme="light"
                viewModeEnabled={false}
                UIOptions={{
                  canvasActions: {
                    loadScene: false,
                    export: false,
                    saveAsImage: false
                  },
                  dockedSidebarBreakpoint: 0
                }}
              />
            </Suspense>
          </div>
        </Card>
      </NodeViewWrapper>
    );
  }

  // Mode affichage
  return (
    <NodeViewWrapper className={`relative my-4 ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-sm text-muted-foreground">{editTitle}</h3>
          {!editor.isEditable ? null : (
            <Button
              onClick={() => setIsEditing(true)}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {hasElements ? (
          <div className="h-64 border rounded-lg overflow-hidden bg-white">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full bg-muted">
                <div className="text-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Chargement du diagramme...</p>
                </div>
              </div>
            }>
              <ExcalidrawComponent
                initialData={excalidrawData}
                viewModeEnabled={true}
                theme="light"
                UIOptions={{
                  canvasActions: {
                    loadScene: false,
                    export: false,
                    saveAsImage: false
                  },
                  dockedSidebarBreakpoint: 0
                }}
              />
            </Suspense>
          </div>
        ) : (
          <div className="h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center bg-muted/10">
            <div className="text-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {editor.isEditable ? 'Cliquez sur modifier pour créer un diagramme' : 'Diagramme vide'}
              </p>
            </div>
          </div>
        )}
      </Card>
    </NodeViewWrapper>
  );
}