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
        placeholder: readOnly ? '' : 'Tapez "/" pour voir les commandes ou commencez à écrire...',
        logLevel: 'ERROR' as any,
        autofocus: true,
        tools: {
          header: {
            class: Header,
            inlineToolbar: ['link', 'bold', 'italic'],
            config: {
              placeholder: 'Titre...',
              levels: [1, 2, 3, 4, 5, 6],
              defaultLevel: 2
            },
            shortcut: 'CMD+SHIFT+H'
          },
          paragraph: {
            class: Paragraph,
            inlineToolbar: ['link', 'bold', 'italic'],
            config: {
              placeholder: 'Commencez à écrire...',
              preserveBlank: true
            }
          },
          list: {
            class: List,
            inlineToolbar: ['link', 'bold', 'italic'],
            config: {
              defaultStyle: 'unordered'
            },
            shortcut: 'CMD+SHIFT+L'
          },
          quote: {
            class: Quote,
            inlineToolbar: ['link', 'bold', 'italic'],
            config: {
              quotePlaceholder: 'Citation...',
              captionPlaceholder: 'Auteur de la citation'
            },
            shortcut: 'CMD+SHIFT+Q'
          },
          code: {
            class: Code,
            config: {
              placeholder: 'Entrez votre code ici...'
            },
            shortcut: 'CMD+SHIFT+C'
          },
          excalidraw: {
            class: ExcalidrawTool,
            config: {
              placeholder: 'Créer un diagramme Excalidraw'
            }
          },
          drawio: {
            class: DrawIOTool,
            config: {
              placeholder: 'Créer un diagramme Draw.io'
            }
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
          width: 26px !important;
          height: 26px !important;
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
        
        /* Menu contextuel pour les outils (/) */
        .ce-popover {
          background: hsl(var(--popover)) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          padding: 8px 0 !important;
          min-width: 280px !important;
          max-height: 300px !important;
          overflow-y: auto !important;
          z-index: 1000 !important;
        }
        
        .ce-popover__item {
          color: hsl(var(--foreground)) !important;
          padding: 12px 16px !important;
          margin: 0 8px !important;
          border-radius: 6px !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          transition: background-color 0.15s ease !important;
        }
        
        .ce-popover__item:hover {
          background: hsl(var(--muted)) !important;
        }
        
        .ce-popover__item-icon {
          width: 20px !important;
          height: 20px !important;
          opacity: 0.7 !important;
        }
        
        .ce-popover__item-title {
          font-weight: 500 !important;
          font-size: 14px !important;
        }
        
        .ce-popover__item-description {
          font-size: 12px !important;
          color: hsl(var(--muted-foreground)) !important;
          margin-top: 2px !important;
        }
        
        /* Barre d'outils en ligne */
        .ce-inline-toolbar {
          background: hsl(var(--popover)) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          padding: 4px !important;
        }
        
        .ce-inline-tool {
          color: hsl(var(--foreground)) !important;
          border-radius: 4px !important;
          padding: 6px 8px !important;
          margin: 0 2px !important;
        }
        
        .ce-inline-tool:hover {
          background: hsl(var(--muted)) !important;
        }
        
        .ce-inline-tool--active {
          background: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
        }
        
        /* Barre d'outils de conversion */
        .ce-conversion-toolbar {
          background: hsl(var(--popover)) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }
        
        .ce-conversion-tool {
          color: hsl(var(--foreground)) !important;
          padding: 8px 12px !important;
          border-radius: 6px !important;
          margin: 4px !important;
        }
        
        .ce-conversion-tool:hover {
          background: hsl(var(--muted)) !important;
        }
        
        /* Styles pour les blocs */
        .cdx-block {
          color: hsl(var(--foreground)) !important;
          padding: 0.5em 0 !important;
        }
        
        .ce-paragraph {
          line-height: 1.6 !important;
          margin: 0 !important;
        }
        
        .ce-header {
          font-weight: 600 !important;
          margin: 1em 0 0.5em 0 !important;
          line-height: 1.25 !important;
        }
        
        .ce-header[data-level="1"] { font-size: 2em !important; }
        .ce-header[data-level="2"] { font-size: 1.5em !important; }
        .ce-header[data-level="3"] { font-size: 1.25em !important; }
        .ce-header[data-level="4"] { font-size: 1.1em !important; }
        .ce-header[data-level="5"] { font-size: 1em !important; font-weight: 700 !important; }
        .ce-header[data-level="6"] { font-size: 0.9em !important; font-weight: 700 !important; }
        
        .ce-code__textarea {
          background: hsl(var(--muted)) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 6px !important;
          color: hsl(var(--foreground)) !important;
          font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace !important;
          padding: 16px !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
        }
        
        .ce-quote {
          border-left: 4px solid hsl(var(--primary)) !important;
          padding-left: 1rem !important;
          margin: 1em 0 !important;
          font-style: italic !important;
          background: hsl(var(--muted/20)) !important;
          border-radius: 0 6px 6px 0 !important;
          padding: 16px 16px 16px 20px !important;
        }
        
        .ce-quote__text {
          font-size: 1.1em !important;
          line-height: 1.6 !important;
          margin-bottom: 8px !important;
        }
        
        .ce-quote__caption {
          font-size: 0.9em !important;
          color: hsl(var(--muted-foreground)) !important;
          font-style: normal !important;
        }
        
        /* Listes */
        .cdx-list {
          margin: 0.5em 0 !important;
        }
        
        .cdx-list__item {
          line-height: 1.6 !important;
          margin: 0.25em 0 !important;
        }
        
        /* Animation pour l'ouverture du menu */
        .ce-popover {
          animation: fadeIn 0.15s ease-out !important;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Amélioration du focus */
        .codex-editor__redactor {
          outline: none !important;
        }
        
        .ce-block--focused .ce-block__content {
          background: hsl(var(--muted/30)) !important;
          border-radius: 4px !important;
        }
      `}</style>
    </div>
  );
}