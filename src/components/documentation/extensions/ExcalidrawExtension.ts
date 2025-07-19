import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ExcalidrawNodeView } from './ExcalidrawNodeView';

export interface ExcalidrawOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    excalidraw: {
      /**
       * Insert an Excalidraw diagram
       */
      insertExcalidraw: (options?: { data?: any }) => ReturnType;
    };
  }
}

export const ExcalidrawExtension = Node.create<ExcalidrawOptions>({
  name: 'excalidraw',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      data: {
        default: {
          elements: [],
          appState: {
            viewBackgroundColor: '#ffffff',
            gridSize: null,
            zoom: {
              value: 1
            }
          },
          files: null
        },
        parseHTML: element => {
          const dataAttr = element.getAttribute('data-excalidraw');
          if (dataAttr) {
            try {
              return JSON.parse(dataAttr);
            } catch (e) {
              console.error('Failed to parse Excalidraw data:', e);
              return {
                elements: [],
                appState: {
                  viewBackgroundColor: '#ffffff',
                  gridSize: null,
                  zoom: { value: 1 }
                },
                files: null
              };
            }
          }
          return {
            elements: [],
            appState: {
              viewBackgroundColor: '#ffffff',
              gridSize: null,
              zoom: { value: 1 }
            },
            files: null
          };
        },
        renderHTML: attributes => {
          return {
            'data-excalidraw': JSON.stringify(attributes.data),
          };
        },
      },
      title: {
        default: 'Diagramme Excalidraw',
        parseHTML: element => element.getAttribute('data-title'),
        renderHTML: attributes => {
          if (!attributes.title) {
            return {};
          }
          return {
            'data-title': attributes.title,
          };
        },
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="excalidraw"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'excalidraw' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ExcalidrawNodeView);
  },

  addCommands() {
    return {
      insertExcalidraw: (options = {}) => ({ commands }) => {
        const { data = {
          elements: [],
          appState: {
            viewBackgroundColor: '#ffffff',
            gridSize: null,
            zoom: { value: 1 }
          },
          files: null
        } } = options;

        return commands.insertContent({
          type: this.name,
          attrs: {
            data,
            title: 'Nouveau diagramme'
          },
        });
      },
    };
  },
});