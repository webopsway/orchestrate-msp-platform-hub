import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

export interface DragAndDropOptions {
  allowedNodes?: string[];
  dragHandleWidth?: number;
}

export const DragAndDropExtension = Extension.create<DragAndDropOptions>({
  name: 'dragAndDrop',

  addOptions() {
    return {
      allowedNodes: ['paragraph', 'heading', 'bulletList', 'orderedList', 'blockquote', 'codeBlock'],
      dragHandleWidth: 24,
    };
  },

  addProseMirrorPlugins() {
    const { allowedNodes } = this.options;

    return [
      new Plugin({
        key: new PluginKey('dragAndDrop'),
        
        props: {
          decorations: (state) => {
            const { doc, selection } = state;
            const decorations: Decoration[] = [];

            // Parcourir tous les nœuds du document
            doc.descendants((node, pos) => {
              // Vérifier si le nœud peut être déplacé
              if (allowedNodes?.includes(node.type.name) && node.isBlock) {
                // Créer une décoration pour ajouter la poignée de drag
                const decoration = Decoration.widget(
                  pos,
                  () => {
                    const dragHandle = document.createElement('div');
                    dragHandle.className = 'drag-handle-container';
                    dragHandle.innerHTML = `
                      <div class="drag-handle group/handle opacity-0 hover:opacity-100 transition-opacity duration-200 absolute left-0 top-0 cursor-grab active:cursor-grabbing" 
                           draggable="true" 
                           data-drag-handle="true"
                           data-node-pos="${pos}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground">
                          <circle cx="9" cy="12" r="1"/>
                          <circle cx="9" cy="5" r="1"/>
                          <circle cx="9" cy="19" r="1"/>
                          <circle cx="15" cy="12" r="1"/>
                          <circle cx="15" cy="5" r="1"/>
                          <circle cx="15" cy="19" r="1"/>
                        </svg>
                      </div>
                    `;
                    return dragHandle;
                  },
                  {
                    side: -1,
                    key: `drag-handle-${pos}`,
                  }
                );

                decorations.push(decoration);
              }

              return true;
            });

            return DecorationSet.create(doc, decorations);
          },

          handleDOMEvents: {
            dragstart: (view, event) => {
              const target = event.target as HTMLElement;
              const dragHandle = target.closest('[data-drag-handle]');
              
              if (!dragHandle) return false;

              const pos = parseInt(dragHandle.getAttribute('data-node-pos') || '0');
              const node = view.state.doc.nodeAt(pos);
              
              if (!node) return false;

              // Stocker les informations de drag
              event.dataTransfer?.setData('text/html', node.textContent || '');
              event.dataTransfer?.setData('application/x-prosemirror-node-pos', pos.toString());
              
              // Ajouter un effet visuel
              const nodeElement = view.nodeDOM(pos) as HTMLElement;
              if (nodeElement) {
                nodeElement.style.opacity = '0.5';
                nodeElement.classList.add('dragging');
              }

              return true;
            },

            dragend: (view, event) => {
              // Nettoyer les effets visuels
              const draggingElements = view.dom.querySelectorAll('.dragging');
              draggingElements.forEach(el => {
                (el as HTMLElement).style.opacity = '1';
                el.classList.remove('dragging');
              });

              // Nettoyer les indicateurs de drop
              const indicators = view.dom.querySelectorAll('.drop-indicator');
              indicators.forEach(indicator => {
                indicator.remove();
              });

              return false;
            },

            dragover: (view, event) => {
              event.preventDefault();
              
              const target = event.target as HTMLElement;
              const nodeElement = target.closest('[data-node-type]') || target.closest('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, pre');
              
              if (!nodeElement || nodeElement.classList.contains('dragging')) return false;

              // Supprimer les anciens indicateurs
              const oldIndicators = view.dom.querySelectorAll('.drop-indicator');
              oldIndicators.forEach(indicator => indicator.remove());

              // Ajouter un nouvel indicateur
              const indicator = document.createElement('div');
              indicator.className = 'drop-indicator absolute w-full h-0.5 bg-primary rounded-full z-10';
              indicator.style.top = '0px';
              indicator.style.left = '0px';
              
              (nodeElement as HTMLElement).style.position = 'relative';
              nodeElement.appendChild(indicator);

              return true;
            },

            drop: (view, event) => {
              event.preventDefault();
              
              const draggedPos = parseInt(event.dataTransfer?.getData('application/x-prosemirror-node-pos') || '0');
              const target = event.target as HTMLElement;
              const targetNodeElement = target.closest('[data-node-type]') || target.closest('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, pre');
              
              if (!targetNodeElement || !draggedPos) return false;

              // Trouver la position du nœud cible
              let targetPos = 0;
              const walker = document.createTreeWalker(
                view.dom,
                NodeFilter.SHOW_ELEMENT,
                null
              );

              let currentNode;
              while (currentNode = walker.nextNode()) {
                if (currentNode === targetNodeElement) {
                  // Calculer la position approximative dans le document
                  const domPos = view.posAtDOM(currentNode as HTMLElement, 0);
                  targetPos = domPos;
                  break;
                }
              }

              if (targetPos && targetPos !== draggedPos) {
                // Effectuer le déplacement du nœud
                const { tr } = view.state;
                const draggedNode = tr.doc.nodeAt(draggedPos);
                
                if (draggedNode) {
                  // Supprimer le nœud de sa position actuelle
                  tr.delete(draggedPos, draggedPos + draggedNode.nodeSize);
                  
                  // Réajuster la position cible si nécessaire
                  const newTargetPos = targetPos > draggedPos ? targetPos - draggedNode.nodeSize : targetPos;
                  
                  // Insérer le nœud à la nouvelle position
                  tr.insert(newTargetPos, draggedNode);
                  
                  // Appliquer la transaction
                  view.dispatch(tr);
                }
              }

              // Nettoyer les indicateurs
              const indicators = view.dom.querySelectorAll('.drop-indicator');
              indicators.forEach(indicator => indicator.remove());

              return true;
            },
          },
        },
      }),
    ];
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.allowedNodes || [],
        attributes: {
          'data-node-type': {
            default: null,
            renderHTML: (attributes) => {
              return {
                'data-node-type': attributes['data-node-type'],
              };
            },
          },
        },
      },
    ];
  },


}); 