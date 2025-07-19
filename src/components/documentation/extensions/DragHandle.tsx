import React, { useState } from 'react';
import { GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DragHandleProps {
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  className?: string;
}

export const DragHandle: React.FC<DragHandleProps> = ({
  onDragStart,
  onDragEnd,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    // Ajouter un petit délai pour que l'UI se mette à jour
    setTimeout(() => onDragStart?.(e), 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    onDragEnd?.(e);
  };

  return (
    <div
      className={`group/handle relative flex items-center ${className}`}
      style={{ userSelect: 'none' }}
    >
      <Button
        variant="ghost"
        size="sm"
        className={`
          opacity-0 group-hover/handle:opacity-100 transition-all duration-200 cursor-grab active:cursor-grabbing
          h-6 w-6 p-0 hover:bg-muted/80 rounded
          ${isDragging ? 'opacity-100 bg-primary/10' : ''}
        `}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        title="Glisser pour déplacer le bloc"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </Button>
      
      {/* Indicateur de drop zone */}
      <div
        className="absolute left-0 top-full w-full h-0.5 bg-primary rounded-full opacity-0 transition-opacity duration-200 pointer-events-none"
        data-drop-indicator
      />
    </div>
  );
};

// Hook pour gérer le drag & drop global
export const useDragAndDrop = () => {
  const [draggedElement, setDraggedElement] = useState<HTMLElement | null>(null);
  const [dropZone, setDropZone] = useState<HTMLElement | null>(null);

  const handleDragStart = (e: React.DragEvent, element: HTMLElement) => {
    setDraggedElement(element);
    element.style.opacity = '0.5';
    
    // Ajouter une classe pour identifier l'élément en cours de drag
    element.classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent, element: HTMLElement) => {
    element.style.opacity = '1';
    element.classList.remove('dragging');
    setDraggedElement(null);
    
    // Nettoyer les indicateurs de drop
    document.querySelectorAll('[data-drop-indicator]').forEach(indicator => {
      (indicator as HTMLElement).style.opacity = '0';
    });
  };

  const handleDragOver = (e: React.DragEvent, targetElement: HTMLElement) => {
    e.preventDefault();
    if (!draggedElement || targetElement === draggedElement) return;

    // Afficher l'indicateur de drop
    const indicator = targetElement.querySelector('[data-drop-indicator]') as HTMLElement;
    if (indicator) {
      indicator.style.opacity = '1';
    }
  };

  const handleDragLeave = (e: React.DragEvent, targetElement: HTMLElement) => {
    // Masquer l'indicateur de drop
    const indicator = targetElement.querySelector('[data-drop-indicator]') as HTMLElement;
    if (indicator) {
      indicator.style.opacity = '0';
    }
  };

  const handleDrop = (e: React.DragEvent, targetElement: HTMLElement, onReorder?: (from: HTMLElement, to: HTMLElement) => void) => {
    e.preventDefault();
    if (!draggedElement || targetElement === draggedElement) return;

    // Masquer l'indicateur
    const indicator = targetElement.querySelector('[data-drop-indicator]') as HTMLElement;
    if (indicator) {
      indicator.style.opacity = '0';
    }

    // Exécuter la logique de réorganisation
    onReorder?.(draggedElement, targetElement);
  };

  return {
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    isDragging: !!draggedElement,
  };
}; 