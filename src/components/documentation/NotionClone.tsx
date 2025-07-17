import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Type, Hash, List, CheckSquare, Quote, Code, 
  Plus, GripVertical
} from 'lucide-react';
import { DocumentContentBlock } from '../../types/documentBlocks';

interface Block {
  id: string;
  type: string;
  content: any;
  position: number;
}

interface NotionCloneProps {
  documentId: string;
  teamId: string;
  blocks: DocumentContentBlock[];
  onSave: (blocks: Block[]) => void;
  readOnly?: boolean;
}

const BLOCK_TYPES = [
  { 
    type: 'paragraph', 
    icon: Type, 
    label: 'Texte', 
    description: 'Commencez à écrire avec du texte simple.',
    shortcut: ''
  },
  { 
    type: 'heading1', 
    icon: Hash, 
    label: 'Titre 1', 
    description: 'Grande section de titre.',
    shortcut: '# '
  },
  { 
    type: 'heading2', 
    icon: Hash, 
    label: 'Titre 2', 
    description: 'Section de titre moyenne.',
    shortcut: '## '
  },
  { 
    type: 'heading3', 
    icon: Hash, 
    label: 'Titre 3', 
    description: 'Petite section de titre.',
    shortcut: '### '
  },
  { 
    type: 'bulleted-list', 
    icon: List, 
    label: 'Liste à puces', 
    description: 'Créez une liste simple à puces.',
    shortcut: '- '
  },
  { 
    type: 'numbered-list', 
    icon: List, 
    label: 'Liste numérotée', 
    description: 'Créez une liste avec des numéros.',
    shortcut: '1. '
  },
  { 
    type: 'todo', 
    icon: CheckSquare, 
    label: 'Liste de tâches', 
    description: 'Suivez les tâches avec une case à cocher.',
    shortcut: '[] '
  },
  { 
    type: 'quote', 
    icon: Quote, 
    label: 'Citation', 
    description: 'Capturez une citation.',
    shortcut: '> '
  },
  { 
    type: 'code', 
    icon: Code, 
    label: 'Code', 
    description: 'Capturez un extrait de code.',
    shortcut: '``` '
  },
];

export function NotionClone({ 
  documentId, 
  teamId, 
  blocks = [], 
  onSave, 
  readOnly = false 
}: NotionCloneProps) {
  const [editorBlocks, setEditorBlocks] = useState<Block[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandMenuPosition, setCommandMenuPosition] = useState({ x: 0, y: 0 });
  const [commandFilter, setCommandFilter] = useState('');
  const commandMenuRef = useRef<HTMLDivElement>(null);

  // Convertir les blocks de la DB vers notre format interne
  useEffect(() => {
    const convertedBlocks = blocks
      .sort((a, b) => a.position - b.position)
      .map(block => ({
        id: block.id,
        type: block.block_type,
        content: block.content,
        position: block.position
      }));
    
    if (convertedBlocks.length === 0) {
      setEditorBlocks([{
        id: 'initial',
        type: 'paragraph',
        content: { text: '' },
        position: 0
      }]);
    } else {
      setEditorBlocks(convertedBlocks);
    }
  }, [blocks]);

  // Sauvegarder automatiquement avec débounce
  const saveBlocks = useCallback((blocks: Block[]) => {
    if (!readOnly) {
      // Utiliser setTimeout pour éviter les mises à jour pendant le rendu
      setTimeout(() => {
        onSave(blocks);
      }, 0);
    }
  }, [onSave, readOnly]);

  // Ajouter un nouveau bloc
  const addBlock = useCallback((type: string, position: number) => {
    const newBlock: Block = {
      id: `block-${Date.now()}-${Math.random()}`,
      type,
      content: getDefaultContent(type),
      position
    };

    setEditorBlocks(prev => {
      const updated = [...prev];
      updated.splice(position, 0, newBlock);
      // Recalculer les positions
      const reindexed = updated.map((block, index) => ({ ...block, position: index }));
      saveBlocks(reindexed);
      return reindexed;
    });

    // Focus sur le nouveau bloc
    setTimeout(() => {
      const element = document.querySelector(`[data-block-id="${newBlock.id}"]`) as HTMLElement;
      element?.focus();
    }, 0);
  }, [saveBlocks]);

  // Supprimer un bloc
  const deleteBlock = useCallback((blockId: string) => {
    setEditorBlocks(prev => {
      const updated = prev.filter(block => block.id !== blockId);
      if (updated.length === 0) {
        updated.push({
          id: 'empty',
          type: 'paragraph',
          content: { text: '' },
          position: 0
        });
      }
      // Recalculer les positions
      const reindexed = updated.map((block, index) => ({ ...block, position: index }));
      saveBlocks(reindexed);
      return reindexed;
    });
  }, [saveBlocks]);

  const updateBlockContent = useCallback((blockId: string, content: any) => {
    setEditorBlocks(prev => {
      const updated = prev.map(block => 
        block.id === blockId ? { ...block, content } : block
      );
      // Débouncer la sauvegarde pour éviter trop d'appels
      setTimeout(() => {
        saveBlocks(updated);
      }, 500);
      return updated;
    });
  }, [saveBlocks]);

  // Changer le type d'un bloc
  const changeBlockType = useCallback((blockId: string, newType: string) => {
    setEditorBlocks(prev => {
      const updated = prev.map(block => 
        block.id === blockId 
          ? { ...block, type: newType, content: getDefaultContent(newType) }
          : block
      );
      saveBlocks(updated);
      return updated;
    });
  }, [saveBlocks]);

  // Gérer les raccourcis clavier
  const handleKeyDown = useCallback((e: React.KeyboardEvent, blockId: string, blockIndex: number) => {
    const block = editorBlocks[blockIndex];
    
    if (e.key === '/') {
      e.preventDefault();
      setShowCommandMenu(true);
      setCommandFilter('');
      
      // Obtenir la position du curseur
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setCommandMenuPosition({ x: rect.left, y: rect.bottom + 5 });
      }
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (block.type === 'code' && block.content.text) {
        // Dans un bloc code, permettre les nouvelles lignes
        updateBlockContent(blockId, { ...block.content, text: block.content.text + '\n' });
      } else {
        // Créer un nouveau bloc
        addBlock('paragraph', blockIndex + 1);
      }
      return;
    }

    if (e.key === 'Backspace' && (!block.content.text || block.content.text === '')) {
      e.preventDefault();
      if (editorBlocks.length > 1) {
        deleteBlock(blockId);
        // Focus sur le bloc précédent
        if (blockIndex > 0) {
          setTimeout(() => {
            const prevBlock = editorBlocks[blockIndex - 1];
            const element = document.querySelector(`[data-block-id="${prevBlock.id}"]`) as HTMLElement;
            element?.focus();
          }, 0);
        }
      }
      return;
    }

    // Gestion des raccourcis markdown
    if (e.key === ' ') {
      const text = block.content.text || '';
      let newType = '';
      
      if (text === '#') newType = 'heading1';
      else if (text === '##') newType = 'heading2';
      else if (text === '###') newType = 'heading3';
      else if (text === '-' || text === '*') newType = 'bulleted-list';
      else if (text === '1.') newType = 'numbered-list';
      else if (text === '>') newType = 'quote';
      else if (text === '```') newType = 'code';
      else if (text === '[]') newType = 'todo';
      
      if (newType) {
        e.preventDefault();
        changeBlockType(blockId, newType);
      }
    }
  }, [editorBlocks, addBlock, deleteBlock, updateBlockContent, changeBlockType]);

  // Menu de commandes
  const filteredCommands = BLOCK_TYPES.filter(cmd => 
    cmd.label.toLowerCase().includes(commandFilter.toLowerCase()) ||
    cmd.description.toLowerCase().includes(commandFilter.toLowerCase())
  );

  const selectCommand = useCallback((type: string) => {
    if (selectedBlock) {
      changeBlockType(selectedBlock, type);
    }
    setShowCommandMenu(false);
    setCommandFilter('');
  }, [selectedBlock, changeBlockType]);

  return (
    <div className="notion-clone min-h-screen bg-background">
      <div className="max-w-4xl mx-auto py-16 px-8">
        <div className="space-y-1">
          {editorBlocks.map((block, index) => (
            <BlockComponent
              key={block.id}
              block={block}
              index={index}
              isSelected={selectedBlock === block.id}
              onSelect={() => setSelectedBlock(block.id)}
              onUpdate={updateBlockContent}
              onKeyDown={(e) => handleKeyDown(e, block.id, index)}
              onAddBlock={() => addBlock('paragraph', index + 1)}
              onDeleteBlock={() => deleteBlock(block.id)}
              onChangeType={(type) => changeBlockType(block.id, type)}
              readOnly={readOnly}
            />
          ))}
        </div>
      </div>

      {/* Menu de commandes */}
      {showCommandMenu && (
        <div
          ref={commandMenuRef}
          className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg p-2 min-w-[320px] max-h-[400px] overflow-y-auto"
          style={{
            left: commandMenuPosition.x,
            top: commandMenuPosition.y,
          }}
        >
          <div className="text-sm text-muted-foreground mb-2 px-2 py-1 border-b border-border">
            Blocs de base
          </div>
          {filteredCommands.map((cmd) => (
            <button
              key={cmd.type}
              className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-muted transition-colors text-left"
              onClick={() => selectCommand(cmd.type)}
            >
              <div className="w-8 h-8 flex items-center justify-center bg-muted rounded">
                <cmd.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{cmd.label}</div>
                <div className="text-xs text-muted-foreground">{cmd.description}</div>
              </div>
              {cmd.shortcut && (
                <div className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                  {cmd.shortcut}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Overlay pour fermer le menu */}
      {showCommandMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowCommandMenu(false)}
        />
      )}
    </div>
  );
}

// Composant pour un bloc individuel
interface BlockComponentProps {
  block: Block;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (blockId: string, content: any) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onAddBlock: () => void;
  onDeleteBlock: () => void;
  onChangeType: (type: string) => void;
  readOnly: boolean;
}

function BlockComponent({
  block,
  index,
  isSelected,
  onSelect,
  onUpdate,
  onKeyDown,
  onAddBlock,
  onDeleteBlock,
  onChangeType,
  readOnly
}: BlockComponentProps) {
  const [showControls, setShowControls] = useState(false);

  const handleContentChange = useCallback((e: React.FormEvent<HTMLElement>) => {
    const text = e.currentTarget.textContent || '';
    onUpdate(block.id, { ...block.content, text });
  }, [block.id, block.content, onUpdate]);

  const renderBlock = () => {
    const commonProps = {
      'data-block-id': block.id,
      contentEditable: !readOnly,
      suppressContentEditableWarning: true,
      onInput: handleContentChange,
      onKeyDown,
      onFocus: onSelect,
      className: `outline-none min-h-[1.5rem] py-1 px-2 rounded transition-colors ${
        isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'
      }`,
      dangerouslySetInnerHTML: { __html: block.content.text || '' }
    };

    switch (block.type) {
      case 'heading1':
        return (
          <h1 {...commonProps} className={`${commonProps.className} text-3xl font-bold leading-tight`} />
        );
      case 'heading2':
        return (
          <h2 {...commonProps} className={`${commonProps.className} text-2xl font-semibold leading-tight`} />
        );
      case 'heading3':
        return (
          <h3 {...commonProps} className={`${commonProps.className} text-xl font-semibold leading-tight`} />
        );
      case 'quote':
        return (
          <blockquote className="border-l-4 border-primary pl-4 py-2">
            <div {...commonProps} className={`${commonProps.className} italic text-muted-foreground`} />
          </blockquote>
        );
      case 'code':
        return (
          <div className="bg-muted rounded-lg p-4 font-mono text-sm">
            <div {...commonProps} className={`${commonProps.className} whitespace-pre-wrap font-mono`} />
          </div>
        );
      case 'bulleted-list':
        return (
          <div className="flex items-start gap-3">
            <span className="w-2 h-2 bg-foreground rounded-full mt-2 flex-shrink-0" />
            <div {...commonProps} className={`${commonProps.className} flex-1`} />
          </div>
        );
      case 'numbered-list':
        return (
          <div className="flex items-start gap-3">
            <span className="text-muted-foreground font-medium mt-1 flex-shrink-0">{index + 1}.</span>
            <div {...commonProps} className={`${commonProps.className} flex-1`} />
          </div>
        );
      case 'todo':
        return (
          <div className="flex items-start gap-3">
            <input 
              type="checkbox" 
              className="mt-1 flex-shrink-0" 
              checked={block.content.checked || false}
              onChange={(e) => onUpdate(block.id, { ...block.content, checked: e.target.checked })}
            />
            <div {...commonProps} className={`${commonProps.className} flex-1`} />
          </div>
        );
      default:
        return (
          <div 
            {...commonProps}
            data-placeholder={block.content.text ? '' : "Tapez '/' pour les commandes"}
          />
        );
    }
  };

  return (
    <div 
      className="group relative"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Contrôles du bloc */}
      {showControls && !readOnly && (
        <div className="absolute left-0 top-0 flex items-center gap-1 transform -translate-x-full pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="w-6 h-6 flex items-center justify-center hover:bg-muted rounded text-muted-foreground">
            <Plus className="w-4 h-4" onClick={onAddBlock} />
          </button>
          <button className="w-6 h-6 flex items-center justify-center hover:bg-muted rounded text-muted-foreground cursor-grab">
            <GripVertical className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {renderBlock()}
      
      <style>{`
        [data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

function getDefaultContent(type: string) {
  switch (type) {
    case 'todo':
      return { text: '', checked: false };
    default:
      return { text: '' };
  }
}