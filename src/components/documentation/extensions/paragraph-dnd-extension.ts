import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { DraggableParagraphNodeView } from './DraggableParagraphNodeView';

export const ParagraphDnd = Node.create({
  name: 'paragraph',
  priority: 1000,
  group: 'block',
  content: 'inline*',
  
  parseHTML() {
    return [
      { tag: 'p' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setParagraph: () => ({ commands }) => {
        return commands.setNode(this.name);
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Alt-0': () => this.editor.commands.setParagraph(),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(DraggableParagraphNodeView);
  },
}); 