import React, { createContext, useContext, useRef } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import { BlockDragHandle } from './BlockDragHandle';

// Contexte pour fournir l'API DnD aux blocs
const BlockDndContext = createContext({});
export const useBlockDnd = () => useContext(BlockDndContext);

export const BlockDndProvider = ({ editor, children }: { editor: any, children: React.ReactNode }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // TODO: Gérer l'état de drag & drop, la logique de déplacement de blocs, etc.
  // Pour l'instant, on fournit juste le contexte et le DndContext autour du contenu

  return (
    <BlockDndContext.Provider value={{}}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        // TODO: onDragEnd, onDragStart, etc.
      >
        {children}
      </DndContext>
    </BlockDndContext.Provider>
  );
};

// Utilitaire pour rendre la poignée sur chaque bloc (à utiliser dans le composant de NodeView Tiptap)
export const renderBlockDragHandle = (props: any) => {
  return <BlockDragHandle {...props} />;
}; 