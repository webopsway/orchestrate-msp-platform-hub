import React, { useEffect, useRef, useState } from 'react';

const BLOCKS = [
  { type: 'paragraph', label: 'Texte', description: 'Commencez à écrire avec du texte simple.' },
  { type: 'heading', level: 1, label: 'Titre 1', description: 'Grande section de titre.' },
  { type: 'heading', level: 2, label: 'Titre 2', description: 'Section de titre moyenne.' },
  { type: 'heading', level: 3, label: 'Titre 3', description: 'Petite section de titre.' },
  { type: 'bulletList', label: 'Liste à puces', description: 'Créez une liste à puces.' },
  { type: 'orderedList', label: 'Liste numérotée', description: 'Créez une liste numérotée.' },
  { type: 'blockquote', label: 'Citation', description: 'Capturez une citation.' },
  { type: 'codeBlock', label: 'Code', description: 'Capturez un extrait de code.' },
  { type: 'image', label: 'Image', description: 'Insérez une image.' },
];

export interface SlashMenuProps {
  editor: any;
  position: { x: number; y: number };
  onClose: () => void;
}

export const SlashMenu: React.FC<SlashMenuProps> = ({ editor, position, onClose }) => {
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const filteredBlocks = BLOCKS.filter(b =>
    b.label.toLowerCase().includes(filter.toLowerCase()) ||
    b.description.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    ref.current?.focus();
  }, []);

  useEffect(() => {
    setSelected(0);
  }, [filter]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setSelected(s => Math.min(s + 1, filteredBlocks.length - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setSelected(s => Math.max(s - 1, 0));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      handleSelect(filteredBlocks[selected]);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      onClose();
      e.preventDefault();
    }
  };

  const handleSelect = (block: any) => {
    onClose();
    if (!block) return;
    switch (block.type) {
      case 'paragraph':
        editor.commands.setNode('paragraph');
        break;
      case 'heading':
        editor.commands.setNode('heading', { level: block.level });
        break;
      case 'bulletList':
        editor.commands.toggleBulletList();
        break;
      case 'orderedList':
        editor.commands.toggleOrderedList();
        break;
      case 'blockquote':
        editor.commands.toggleBlockquote();
        break;
      case 'codeBlock':
        editor.commands.toggleCodeBlock();
        break;
      case 'image':
        const url = window.prompt('URL de l\'image :');
        if (url) editor.commands.setImage({ src: url });
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={ref}
      tabIndex={0}
      className="absolute z-50 bg-popover border border-border rounded-md shadow-lg min-w-[260px] max-w-xs"
      style={{ left: position.x, top: position.y }}
      onKeyDown={handleKeyDown}
    >
      <input
        autoFocus
        className="w-full px-3 py-2 border-b border-border bg-transparent outline-none"
        placeholder="Rechercher un bloc..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
      />
      <div className="max-h-64 overflow-y-auto">
        {filteredBlocks.length === 0 && (
          <div className="p-3 text-muted-foreground text-sm">Aucun bloc trouvé</div>
        )}
        {filteredBlocks.map((block, i) => (
          <div
            key={block.label}
            className={`px-3 py-2 cursor-pointer flex flex-col gap-0.5 ${i === selected ? 'bg-muted' : ''}`}
            onMouseEnter={() => setSelected(i)}
            onMouseDown={e => { e.preventDefault(); handleSelect(block); }}
          >
            <span className="font-medium">{block.label}</span>
            <span className="text-xs text-muted-foreground">{block.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}; 