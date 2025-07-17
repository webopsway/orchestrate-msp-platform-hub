import React, { createContext, useContext, useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import { BlockDragHandle } from './BlockDragHandle';

const BlockDndContext = createContext({
  getDragProps: (_id: string) => ({}),
  getDropProps: (_id: string) => ({}),
  isDraggingId: null as string | null,
});
export const useBlockDnd = () => useContext(BlockDndContext);

export const BlockDndProvider = ({ editor, children }: { editor: any, children: React.ReactNode }) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Utilitaire pour obtenir l'id du bloc (node) à partir du DOM
  const getNodeIdFromEvent = (event: { active: { id: string | number } }) => {
    return String(event.active?.id);
  };

  // Fournit les props pour rendre un bloc draggable
  const getDragProps = (id: string) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
    return { attributes, listeners, setNodeRef, isDragging };
  };

  // Fournit les props pour rendre un bloc droppable
  const getDropProps = (id: string) => {
    const { setNodeRef, isOver } = useDroppable({ id });
    return { setNodeRef, isOver };
  };

  // Déplacement effectif du bloc dans Tiptap
  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingId(null);
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;
    const fromPos = editor.state.doc.content.findIndex((node: any) => node.attrs.id === active.id);
    const toPos = editor.state.doc.content.findIndex((node: any) => node.attrs.id === over.id);
    if (fromPos === -1 || toPos === -1) return;
    editor.commands.moveNode({ from: fromPos, to: toPos });
  };

  return (
    <BlockDndContext.Provider value={{ getDragProps, getDropProps, isDraggingId: draggingId }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e: DragStartEvent) => setDraggingId(getNodeIdFromEvent(e))}
        onDragEnd={handleDragEnd}
      >
        {children}
      </DndContext>
    </BlockDndContext.Provider>
  );
};

export const renderBlockDragHandle = (props: any) => {
  return <BlockDragHandle {...props} />;
}; 