import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Trash2, GripVertical, Plus } from "lucide-react";
import { DocumentContentBlock } from "@/types/documentBlocks";
import { useDocumentBlocks } from "@/hooks/useDocumentBlocks";
import { MarkdownBlock } from "./blocks/MarkdownBlock";
import { ExcalidrawBlock } from "./blocks/ExcalidrawBlock";
import { DrawIOBlock } from "./blocks/DrawIOBlock";

interface DocumentBlockEditorProps {
  documentId: string;
  teamId: string;
}

export const DocumentBlockEditor: React.FC<DocumentBlockEditorProps> = ({
  documentId,
  teamId
}) => {
  const { blocks, loading, createBlock, updateBlock, deleteBlock, reorderBlocks } = useDocumentBlocks(documentId);
  const [newBlockType, setNewBlockType] = useState<'markdown' | 'excalidraw' | 'drawio'>('markdown');
  const [newBlockTitle, setNewBlockTitle] = useState('');

  const handleAddBlock = async () => {
    if (!newBlockTitle.trim()) return;

    const defaultContent = {
      markdown: { content: '# Nouveau bloc\n\nContenu...' },
      excalidraw: { elements: [], appState: { viewBackgroundColor: '#ffffff' } },
      drawio: { xml: '' }
    };

    await createBlock({
      document_id: documentId,
      block_type: newBlockType,
      content: defaultContent[newBlockType],
      position: blocks.length,
      title: newBlockTitle,
      metadata: {},
      team_id: teamId
    });

    setNewBlockTitle('');
  };

  const handleUpdateBlock = async (blockId: string, updates: Partial<DocumentContentBlock>) => {
    await updateBlock(blockId, updates);
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce bloc ?')) {
      await deleteBlock(blockId);
    }
  };

  const renderBlock = (block: DocumentContentBlock) => {
    switch (block.block_type) {
      case 'markdown':
        return (
          <MarkdownBlock
            key={block.id}
            block={block}
            onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
          />
        );
      case 'excalidraw':
        return (
          <ExcalidrawBlock
            key={block.id}
            block={block}
            onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
          />
        );
      case 'drawio':
        return (
          <DrawIOBlock
            key={block.id}
            block={block}
            onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
          />
        );
      default:
        return null;
    }
  };

  if (loading && blocks.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ajouter un nouveau bloc */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Ajouter un bloc
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Titre du bloc"
                value={newBlockTitle}
                onChange={(e) => setNewBlockTitle(e.target.value)}
              />
            </div>
            <Select value={newBlockType} onValueChange={(value: any) => setNewBlockType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="excalidraw">Excalidraw</SelectItem>
                <SelectItem value="drawio">Draw.io</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddBlock} disabled={!newBlockTitle.trim()}>
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des blocs */}
      <div className="space-y-4">
        {blocks.map((block, index) => (
          <Card key={block.id} className="relative">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                <CardTitle className="text-lg">{block.title || `Bloc ${index + 1}`}</CardTitle>
                <span className="text-sm text-muted-foreground capitalize bg-muted px-2 py-1 rounded">
                  {block.block_type}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteBlock(block.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {renderBlock(block)}
            </CardContent>
          </Card>
        ))}
      </div>

      {blocks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <div className="mb-4">
            <Plus className="h-12 w-12 mx-auto opacity-50" />
          </div>
          <h3 className="text-lg font-medium mb-2">Aucun bloc de contenu</h3>
          <p>Ajoutez votre premier bloc pour commencer à documenter.</p>
        </div>
      )}
    </div>
  );
};