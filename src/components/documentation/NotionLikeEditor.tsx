import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import EditorJS, { OutputData } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import Quote from '@editorjs/quote';
import Code from '@editorjs/code';
import { ExcalidrawTool } from './tools/ExcalidrawTool';
import { DrawIOTool } from './tools/DrawIOTool';
import { DocumentContentBlock } from '../../types/documentBlocks';

interface NotionLikeEditorProps {
  documentId: string;
  teamId: string;
  blocks: DocumentContentBlock[];
  onSave: (data: OutputData) => void;
  readOnly?: boolean;
}

export function NotionLikeEditor({ 
  documentId, 
  teamId, 
  blocks, 
  onSave, 
  readOnly = false 
}: NotionLikeEditorProps) {
  const editorRef = useRef<EditorJS | null>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializingRef = useRef(false);

  // Debounced save function
  const debouncedSave = useCallback((outputData: OutputData) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      onSave(outputData);
    }, 1000); // Increase debounce to reduce saves
  }, [onSave]);

  // Convert blocks to Editor.js format
  const convertBlocksToEditorData = useCallback((blocks: DocumentContentBlock[]): OutputData => {
    const editorBlocks = blocks
      .sort((a, b) => a.position - b.position)
      .map(block => {
        switch (block.block_type) {
          case 'markdown':
            return {
              id: block.id,
              type: 'paragraph',
              data: {
                text: (block.content as any)?.content || ''
              }
            };
          case 'header':
            return {
              id: block.id,
              type: 'header',
              data: {
                text: (block.content as any)?.text || '',
                level: (block.content as any)?.level || 2
              }
            };
          case 'list':
            return {
              id: block.id,
              type: 'list',
              data: {
                style: (block.content as any)?.style || 'unordered',
                items: (block.content as any)?.items || []
              }
            };
          case 'code':
            return {
              id: block.id,
              type: 'code',
              data: {
                code: (block.content as any)?.code || ''
              }
            };
          case 'quote':
            return {
              id: block.id,
              type: 'quote',
              data: {
                text: (block.content as any)?.text || '',
                caption: (block.content as any)?.caption || ''
              }
            };
          case 'excalidraw':
            return {
              id: block.id,
              type: 'excalidraw',
              data: block.content
            };
          case 'drawio':
            return {
              id: block.id,
              type: 'drawio',
              data: block.content
            };
          default:
            return {
              id: block.id,
              type: 'paragraph',
              data: {
                text: (block.content as any)?.text || (block.content as any)?.content || ''
              }
            };
        }
      });

    return {
      version: "2.28.2",
      time: Date.now(),
      blocks: editorBlocks
    };
  }, []);

  // Convert Editor.js blocks to DocumentContentBlock format
  const convertEditorDataToBlocks = useCallback((editorData: OutputData): Omit<DocumentContentBlock, 'id' | 'created_at' | 'updated_at' | 'created_by'>[] => {
    return editorData.blocks.map((block, index) => {
      let blockType: DocumentContentBlock['block_type'];
      let content: any;

      switch (block.type) {
        case 'header':
          blockType = 'header';
          content = {
            text: block.data.text || '',
            level: block.data.level || 2
          };
          break;
        case 'list':
          blockType = 'list';
          content = {
            style: block.data.style || 'unordered',
            items: block.data.items || []
          };
          break;
        case 'code':
          blockType = 'code';
          content = {
            code: block.data.code || ''
          };
          break;
        case 'quote':
          blockType = 'quote';
          content = {
            text: block.data.text || '',
            caption: block.data.caption || ''
          };
          break;
        case 'excalidraw':
          blockType = 'excalidraw';
          content = block.data;
          break;
        case 'drawio':
          blockType = 'drawio';
          content = block.data;
          break;
        default:
          blockType = 'paragraph';
          content = {
            content: block.data.text || ''
          };
          break;
      }

      return {
        document_id: documentId,
        team_id: teamId,
        block_type: blockType,
        content,
        position: index,
        title: block.data.title,
        metadata: {}
      };
    });
  }, [documentId, teamId]);

  // Initialize editor with error handling and prevent multiple initializations
  const initializeEditor = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (isInitializingRef.current || editorRef.current) {
      return;
    }

    if (!holderRef.current) {
      return;
    }

    isInitializingRef.current = true;

    try {
      const editorData = convertBlocksToEditorData(blocks);

      editorRef.current = new EditorJS({
        holder: holderRef.current,
        data: editorData,
        readOnly,
        placeholder: readOnly ? '' : 'Press Tab or click + to add a block...',
        logLevel: 'ERROR' as any, // Suppress non-critical logs
        tools: {
          header: {
            class: Header,
            inlineToolbar: true,
            config: {
              placeholder: 'Enter a header',
              levels: [1, 2, 3, 4, 5, 6],
              defaultLevel: 2
            }
          },
          paragraph: {
            class: Paragraph,
            inlineToolbar: true,
            config: {
              placeholder: 'Start writing...'
            }
          },
          list: {
            class: List,
            inlineToolbar: true,
            config: {
              defaultStyle: 'unordered'
            }
          },
          quote: {
            class: Quote,
            inlineToolbar: true,
            config: {
              quotePlaceholder: 'Enter a quote',
              captionPlaceholder: 'Quote author'
            }
          },
          code: {
            class: Code,
            config: {
              placeholder: 'Enter your code here...'
            }
          },
          excalidraw: {
            class: ExcalidrawTool
          },
          drawio: {
            class: DrawIOTool
          }
        },
        onChange: async (api) => {
          if (!readOnly) {
            try {
              const outputData = await api.saver.save();
              debouncedSave(outputData);
            } catch (error) {
              // Silently handle save errors to prevent UI disruption
              console.warn('Editor save error:', error);
            }
          }
        },
        onReady: () => {
          console.log('Editor.js is ready');
        }
      });

      await editorRef.current.isReady;
    } catch (error) {
      console.error('Failed to initialize editor:', error);
      // Don't retry immediately to prevent infinite loops
    } finally {
      isInitializingRef.current = false;
    }
  }, [blocks, convertBlocksToEditorData, readOnly, debouncedSave]);

  // Initialize editor only once per documentId/teamId
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (isMounted && !editorRef.current) {
        await initializeEditor();
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [documentId, teamId]); // Only reinitialize when document changes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (editorRef.current) {
        try {
          editorRef.current.destroy();
        } catch (error) {
          console.warn('Error destroying editor:', error);
        }
        editorRef.current = null;
      }
      isInitializingRef.current = false;
    };
  }, []);

  return (
    <div className="notion-editor-container">
      <div 
        ref={holderRef}
        className="prose prose-neutral dark:prose-invert max-w-none min-h-[400px] focus:outline-none"
        style={{
          '--editor-background': 'hsl(var(--background))',
          '--editor-text': 'hsl(var(--foreground))',
          '--editor-border': 'hsl(var(--border))',
          '--editor-primary': 'hsl(var(--primary))',
        } as React.CSSProperties}
      />
      
      <style>{`
        .codex-editor__redactor {
          padding-bottom: 200px !important;
        }
        
        .ce-block__content {
          max-width: none !important;
          margin: 0 !important;
        }
        
        .ce-toolbar__plus {
          color: hsl(var(--muted-foreground)) !important;
        }
        
        .ce-toolbar__plus:hover {
          color: hsl(var(--foreground)) !important;
          background: hsl(var(--muted)) !important;
        }
        
        .ce-toolbar__settings-btn {
          color: hsl(var(--muted-foreground)) !important;
        }
        
        .ce-toolbar__settings-btn:hover {
          color: hsl(var(--foreground)) !important;
          background: hsl(var(--muted)) !important;
        }
        
        .ce-inline-toolbar {
          background: hsl(var(--popover)) !important;
          border: 1px solid hsl(var(--border)) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }
        
        .ce-inline-tool {
          color: hsl(var(--foreground)) !important;
        }
        
        .ce-inline-tool:hover {
          background: hsl(var(--muted)) !important;
        }
        
        .ce-popover {
          background: hsl(var(--popover)) !important;
          border: 1px solid hsl(var(--border)) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }
        
        .ce-popover__item {
          color: hsl(var(--foreground)) !important;
        }
        
        .ce-popover__item:hover {
          background: hsl(var(--muted)) !important;
        }
        
        .ce-conversion-toolbar {
          background: hsl(var(--popover)) !important;
          border: 1px solid hsl(var(--border)) !important;
        }
        
        .ce-conversion-tool {
          color: hsl(var(--foreground)) !important;
        }
        
        .ce-conversion-tool:hover {
          background: hsl(var(--muted)) !important;
        }
        
        .cdx-block {
          color: hsl(var(--foreground)) !important;
        }
        
        .ce-paragraph {
          line-height: 1.6 !important;
        }
        
        .ce-header {
          padding: 0.5em 0 !important;
        }
        
        .ce-code__textarea {
          background: hsl(var(--muted)) !important;
          border: 1px solid hsl(var(--border)) !important;
          color: hsl(var(--foreground)) !important;
          font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace !important;
        }
        
        .ce-quote {
          border-left: 4px solid hsl(var(--primary)) !important;
          padding-left: 1rem !important;
          margin-left: 0 !important;
          font-style: italic !important;
        }
      `}</style>
    </div>
  );
}