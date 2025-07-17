import React from 'react';
import { GripVertical } from 'lucide-react';

interface BlockDragHandleProps {
  attributes?: React.HTMLAttributes<HTMLDivElement>;
  listeners?: any;
  isDragging?: boolean;
}

export const BlockDragHandle: React.FC<BlockDragHandleProps> = ({ attributes, listeners, isDragging }) => {
  return (
    <div
      {...attributes}
      {...listeners}
      className={`cursor-grab p-1 rounded hover:bg-muted transition-colors ${isDragging ? 'bg-muted' : ''}`}
      style={{ display: 'inline-flex', alignItems: 'center', userSelect: 'none' }}
      tabIndex={-1}
    >
      <GripVertical className="w-4 h-4 text-muted-foreground" />
    </div>
  );
}; 