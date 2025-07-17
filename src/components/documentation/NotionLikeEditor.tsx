import React, { useEffect, useRef, useCallback } from 'react';
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
                text: block.content.content || ''
              }
            };
          case 'excalidraw':
            return {
              id: block.id,
              type: 'excalidraw',
              data: {
                elements: block.content.elements || [],
                appState: block.content.appState || {},
                files: block.content.files
              }
            };
          case 'drawio':
            return {
              id: block.id,
              type: 'drawio',
              data: {
                xml: block.content.xml,
                title: block.content.title,
                url: block.content.url
              }
            };
          default:
            return {
              id: block.id,
              type: 'paragraph',
              data: {
                text: ''
              }
            };
        }
      });

    return {
      time: Date.now(),
      blocks: editorBlocks,
      version: '2.30.8'
    };
  }, []);

  // Convert Editor.js data back to blocks format
  const convertEditorDataToBlocks = useCallback((data: OutputData): Partial<DocumentContentBlock>[] => {
    return data.blocks.map((block, index) => {
      let blockType: 'markdown' | 'excalidraw' | 'drawio';
      let content: any;

      switch (block.type) {
        case 'excalidraw':
          blockType = 'excalidraw';
          content = {
            elements: block.data.elements || [],
            appState: block.data.appState || {},
            files: block.data.files
          };
          break;
        case 'drawio':
          blockType = 'drawio';
          content = {
            xml: block.data.xml,
            title: block.data.title,
            url: block.data.url
          };
          break;
        default:
          blockType = 'markdown';
          content = {
            content: block.data.text || ''
          };
          break;
      }

      return {
        id: block.id,
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

  // Initialize Editor.js
  useEffect(() => {
    if (!holderRef.current || editorRef.current) return;

    const editorData = convertBlocksToEditorData(blocks);

    editorRef.current = new EditorJS({
      holder: holderRef.current,
      data: editorData,
      readOnly,
      placeholder: readOnly ? '' : 'Press Tab or click + to add a block...',
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
            onSave(outputData);
          } catch (error) {
            console.error('Editor.js save error:', error);
          }
        }
      },
      onReady: () => {
        console.log('Editor.js is ready to work!');
      }
    });

    return () => {
      if (editorRef.current && editorRef.current.destroy) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [blocks, convertBlocksToEditorData, onSave, readOnly]);

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
        
        .ce-popover {
          background: hsl(var(--popover)) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1) !important;
        }
        
        .ce-popover__item {
          color: hsl(var(--popover-foreground)) !important;
        }
        
        .ce-popover__item:hover {
          background: hsl(var(--accent)) !important;
          color: hsl(var(--accent-foreground)) !important;
        }
        
        .ce-block--selected .ce-block__content {
          background: hsl(var(--accent) / 0.1) !important;
        }
        
        .ce-paragraph[data-placeholder]:empty:before {
          color: hsl(var(--muted-foreground)) !important;
        }
        
        .ce-header[data-placeholder]:empty:before {
          color: hsl(var(--muted-foreground)) !important;
        }
      `}</style>
    </div>
  );
}