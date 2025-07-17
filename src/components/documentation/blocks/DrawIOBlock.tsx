import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DocumentContentBlock, DrawIOData } from "@/types/documentBlocks";
import { Edit, Eye, Save, X, ExternalLink } from 'lucide-react';

interface DrawIOBlockProps {
  block: DocumentContentBlock;
  onUpdate: (updates: Partial<DocumentContentBlock>) => void;
}

export const DrawIOBlock: React.FC<DrawIOBlockProps> = ({ block, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(block.title || '');
  const [drawIOData, setDrawIOData] = useState<DrawIOData>(
    (block.content as DrawIOData) || { xml: '', title: '' }
  );
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setEditTitle(block.title || '');
    setDrawIOData((block.content as DrawIOData) || { xml: '', title: '' });
  }, [block]);

  const handleSave = () => {
    onUpdate({
      title: editTitle,
      content: drawIOData
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(block.title || '');
    setDrawIOData((block.content as DrawIOData) || { xml: '', title: '' });
    setIsEditing(false);
  };

  const openDrawIOEditor = () => {
    // Option 1: Ouvrir dans un nouvel onglet avec le XML existant
    const baseUrl = 'https://app.diagrams.net/';
    const params = new URLSearchParams();
    
    if (drawIOData.xml) {
      // Si on a déjà du XML, l'encoder pour l'URL
      params.append('xml', drawIOData.xml);
    }
    
    // Ouvrir dans un nouvel onglet
    const url = `${baseUrl}?${params.toString()}`;
    window.open(url, '_blank', 'width=1200,height=800');
    
    // Note: Dans une implémentation complète, vous pourriez utiliser
    // l'API postMessage de Draw.io pour intégrer l'éditeur directement
  };

  const handleXMLImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const xml = e.target?.result as string;
      setDrawIOData({ ...drawIOData, xml });
    };
    reader.readAsText(file);
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Titre du bloc"
            className="max-w-md"
          />
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
            <Button onClick={handleCancel} variant="outline" size="sm">
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={openDrawIOEditor} variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir Draw.io
            </Button>
            <div className="flex items-center gap-2">
              <label htmlFor="xml-import" className="text-sm font-medium">
                Importer XML:
              </label>
              <input
                id="xml-import"
                type="file"
                accept=".xml,.drawio"
                onChange={handleXMLImport}
                className="text-sm"
              />
            </div>
          </div>
          
          <textarea
            className="w-full h-64 p-3 border rounded-md font-mono text-sm"
            placeholder="Collez votre XML Draw.io ici..."
            value={drawIOData.xml}
            onChange={(e) => setDrawIOData({ ...drawIOData, xml: e.target.value })}
          />
        </div>
      </div>
    );
  }

  const viewerUrl = drawIOData.xml 
    ? `https://viewer.diagrams.net/?highlight=0000ff&edit=_blank&layers=1&nav=1&title=${encodeURIComponent(editTitle || 'Diagram')}#R${encodeURIComponent(drawIOData.xml)}`
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{block.title}</h4>
        <Button onClick={() => setIsEditing(true)} variant="ghost" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </div>
      
      {viewerUrl ? (
        <div className="border rounded-lg" style={{ height: '400px' }}>
          <iframe
            ref={iframeRef}
            src={viewerUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            title={`Draw.io: ${block.title}`}
            className="rounded-lg"
          />
        </div>
      ) : (
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          <p>Aucun diagramme Draw.io configuré.</p>
          <p className="text-sm mt-2">Cliquez sur "Modifier" pour ajouter un diagramme.</p>
        </div>
      )}
    </div>
  );
};