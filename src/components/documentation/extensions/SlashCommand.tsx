import { Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion';
import { SlashMenuModern } from './SlashMenuModern';
import tippy, { Instance as TippyInstance } from 'tippy.js';

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
      } as Partial<SuggestionOptions>,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

// Configuration pour le menu de suggestion
export const slashMenuSuggestion = {
  items: ({ query }: { query: string }) => {
    // La logique de filtrage est maintenant dans SlashMenuModern
    return [{ query }];
  },

  render: () => {
    let component: ReactRenderer | null = null;
    let popup: TippyInstance | null = null;

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(SlashMenuModern, {
          props: {
            ...props,
            onClose: () => {
              popup?.hide();
            },
          },
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
          hideOnClick: false,
          animation: 'shift-away-subtle',
          theme: 'light-border',
          maxWidth: 'none',
          duration: [200, 150],
        })[0];
      },

      onUpdate: (props: any) => {
        component?.updateProps({
          ...props,
          onClose: () => {
            popup?.hide();
          },
        });

        if (!props.clientRect) {
          return;
        }

        popup?.setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown: (props: any) => {
        if (props.event.key === 'Escape') {
          popup?.hide();
          return true;
        }

        // Laisser le composant SlashMenuModern gérer les autres touches
        return false;
      },

      onExit: () => {
        popup?.destroy();
        component?.destroy();
        popup = null;
        component = null;
      },
    };
  },
}; 