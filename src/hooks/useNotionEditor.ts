import { useState, useCallback } from 'react';
import { OutputData } from '@editorjs/editorjs';
import { useDocumentBlocks } from './useDocumentBlocks';
import { DocumentContentBlock } from '../types/documentBlocks';
import { toast } from 'sonner';

export function useNotionEditor(documentId: string, teamId: string) {
  const {
    blocks,
    loading,
    createBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks
  } = useDocumentBlocks(documentId);

  const [isSaving, setIsSaving] = useState(false);

  // Convert Editor.js data to blocks and save
  const handleSave = useCallback(async (editorData: OutputData) => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      // Get existing blocks to compare
      const existingBlocksMap = new Map(blocks.map(b => [b.id, b]));
      const editorBlockIds = new Set(editorData.blocks.map(b => b.id).filter(Boolean));

      // Delete blocks that no longer exist in editor
      for (const existingBlock of blocks) {
        if (!editorBlockIds.has(existingBlock.id)) {
          await deleteBlock(existingBlock.id);
        }
      }

      // Process each block from editor
      for (let i = 0; i < editorData.blocks.length; i++) {
        const editorBlock = editorData.blocks[i];
        const position = i;

        let blockType: 'markdown' | 'excalidraw' | 'drawio';
        let content: any;

        switch (editorBlock.type) {
          case 'excalidraw':
            blockType = 'excalidraw';
            content = {
              elements: editorBlock.data.elements || [],
              appState: editorBlock.data.appState || {},
              files: editorBlock.data.files
            };
            break;
          case 'drawio':
            blockType = 'drawio';
            content = {
              xml: editorBlock.data.xml,
              title: editorBlock.data.title,
              url: editorBlock.data.url
            };
            break;
          default:
            blockType = 'markdown';
            content = {
              content: editorBlock.data.text || ''
            };
            break;
        }

        const blockData = {
          document_id: documentId,
          team_id: teamId,
          block_type: blockType,
          content,
          position,
          title: editorBlock.data.title || null,
          metadata: {}
        };

        // Update existing block or create new one
        if (editorBlock.id && existingBlocksMap.has(editorBlock.id)) {
          const existingBlock = existingBlocksMap.get(editorBlock.id)!;
          
          // Only update if content has changed
          const hasChanged = (
            existingBlock.block_type !== blockType ||
            JSON.stringify(existingBlock.content) !== JSON.stringify(content) ||
            existingBlock.position !== position ||
            existingBlock.title !== blockData.title
          );

          if (hasChanged) {
            await updateBlock(editorBlock.id, blockData);
          }
        } else {
          // Create new block
          await createBlock(blockData);
        }
      }

      toast.success('Document saved successfully');
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  }, [blocks, documentId, teamId, createBlock, updateBlock, deleteBlock, isSaving]);

  return {
    blocks,
    loading,
    isSaving,
    handleSave
  };
}