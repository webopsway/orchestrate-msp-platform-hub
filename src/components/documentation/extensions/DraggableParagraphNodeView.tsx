import React from 'react';
import { NodeViewWrapper, NodeViewContent, ReactNodeViewProps } from '@tiptap/react';
import { BlockDragHandle } from './BlockDragHandle';

export const DraggableParagraphNodeView: React.FC<ReactNodeViewProps> = (props) => {
  // TODO: brancher les listeners dnd-kit ici
  return (
    <NodeViewWrapper {...props} className="flex items-center group hover:bg-muted/30 rounded px-1 py-0.5">
      <div className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <BlockDragHandle />
      </div>
      <div className="flex-1">
        <NodeViewContent as="div" className="outline-none min-h-[1.5rem]" />
      </div>
    </NodeViewWrapper>
  );
}; 