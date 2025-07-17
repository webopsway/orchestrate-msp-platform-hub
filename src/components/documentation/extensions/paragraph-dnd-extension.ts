import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { DraggableParagraphNodeView } from './DraggableParagraphNodeView';

export const ParagraphDnd = Node.create({
  name: 'paragraph',
  group: 'block',
  content: 'inline*',
  draggable: true,
  parseHTML() {
    return [
      { tag: 'p' },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(DraggableParagraphNodeView);
  },
}); 