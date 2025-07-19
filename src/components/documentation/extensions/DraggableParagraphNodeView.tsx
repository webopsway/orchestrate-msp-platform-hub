import React from 'react';
import { NodeViewWrapper, NodeViewContent, ReactNodeViewProps } from '@tiptap/react';
import { BlockDragHandle } from './BlockDragHandle';
import { useBlockDnd } from './BlockDndExtension';

export const DraggableParagraphNodeView: React.FC<ReactNodeViewProps> = (props) => {
  const nodeId = props.node?.attrs?.id || props.node?.attrs?.name || props.getPos?.();
  const { getDragProps, getDropProps, isDraggingId } = useBlockDnd();
  const dragProps = getDragProps(String(nodeId));
  const dropProps = getDropProps(String(nodeId)) || {};

  return (
    <NodeViewWrapper
      ref={typeof dropProps.setNodeRef === 'function' ? dropProps.setNodeRef : undefined}
      className={`flex items-center group hover:bg-muted/30 rounded px-1 py-0.5 ${isDraggingId === String(nodeId) ? 'opacity-50' : ''}`}
      data-node-id={nodeId}
    >
      <div className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <BlockDragHandle {...dragProps} />
      </div>
      <div className="flex-1">
        <NodeViewContent as="div" className="outline-none min-h-[1.5rem]" />
      </div>
    </NodeViewWrapper>
  );
}; 