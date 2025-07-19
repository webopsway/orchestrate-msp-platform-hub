import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  Keyboard, 
  Save, 
  Zap, 
  MousePointer,
  Type,
  Clock,
  Shield
} from 'lucide-react';

export const EditorHelp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { keys: ['Ctrl', 'S'], description: 'Sauvegarder le document' },
    { keys: ['Ctrl', 'B'], description: 'Gras' },
    { keys: ['Ctrl', 'I'], description: 'Italique' },
    { keys: ['Ctrl', 'K'], description: 'Insérer un lien' },
    { keys: ['Ctrl', 'Z'], description: 'Annuler' },
    { keys: ['Ctrl', 'Shift', 'Z'], description: 'Refaire' },
    { keys: ['Ctrl', 'Alt', '1'], description: 'Titre 1' },
    { keys: ['Ctrl', 'Alt', '2'], description: 'Titre 2' },
    { keys: ['Ctrl', 'Alt', '3'], description: 'Titre 3' },
    { keys: ['/'], description: 'Menu d\'insertion de blocs' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Aide de l'éditeur">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Guide de l'éditeur de documentation</DialogTitle>
          <DialogDescription>
            Découvrez toutes les fonctionnalités de votre éditeur moderne
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Sauvegarde */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Save className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Sauvegarde</h3>
            </div>
            <div className="grid gap-3 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Mode manuel (recommandé)</span>
                </div>
                <p className="text-muted-foreground">
                  Vous contrôlez quand sauvegarder. Utilisez <kbd className="px-1 py-0.5 bg-background border rounded text-xs">Ctrl+S</kbd> ou le bouton "Sauvegarder".
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">Auto-save (optionnel)</span>
                </div>
                <p className="text-muted-foreground">
                  Sauvegarde automatique après 15 secondes d'inactivité. Activez via le toggle dans la barre d'outils.
                </p>
              </div>
            </div>
          </div>

          {/* Fonctionnalités principales */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <h3 className="text-lg font-semibold">Fonctionnalités principales</h3>
            </div>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  /
                </Badge>
                <span>Menu slash - Tapez "/" pour insérer rapidement des blocs</span>
              </div>
              <div className="flex items-center gap-2">
                <MousePointer className="h-4 w-4" />
                <span>Drag & Drop - Glissez-déposez les blocs pour les réorganiser</span>
              </div>
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                <span>Formatage riche - Titres, listes, citations, tableaux, images</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Historique - Restaurez d'anciennes versions de votre document</span>
              </div>
            </div>
          </div>

          {/* Raccourcis clavier */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Keyboard className="h-5 w-5 text-purple-500" />
              <h3 className="text-lg font-semibold">Raccourcis clavier</h3>
            </div>
            <div className="grid gap-2 text-sm">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span>{shortcut.description}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, keyIndex) => (
                      <React.Fragment key={keyIndex}>
                        <kbd className="px-2 py-1 bg-background border rounded text-xs">
                          {key}
                        </kbd>
                        {keyIndex < shortcut.keys.length - 1 && (
                          <span className="text-muted-foreground">+</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conseils */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">💡 Conseils</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• <strong>Sauvegarde intelligente :</strong> L'auto-save attend que vous fassiez une pause dans l'écriture</p>
              <p>• <strong>Navigation rapide :</strong> Utilisez Tab et Shift+Tab pour naviguer entre les blocs</p>
              <p>• <strong>Historique :</strong> Vos modifications sont automatiquement sauvegardées dans l'historique</p>
              <p>• <strong>Mode hors ligne :</strong> L'éditeur détecte votre connexion et adapte la sauvegarde</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 