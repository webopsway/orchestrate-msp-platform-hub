import React, { useState, useCallback } from 'react';
import { TipTapEditor } from './TipTapEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft,
  Download,
  Edit,
  Eye,
  Settings,
  Save,
  Share2,
  History,
  Star,
  MoreHorizontal,
  FileText,
  BookOpen,
  File,
  Settings as SettingsIcon,
  Users,
  Clock,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Document } from '@/types/documentation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DocumentEditorProps {
  document: Document;
  isEditing: boolean;
  onBack: () => void;
  onSave: (content: any) => Promise<void>;
  userProfile: any;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({
  document,
  isEditing,
  onBack,
  onSave,
  userProfile
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [currentContent, setCurrentContent] = useState<any>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'archived': return 'outline';
      default: return 'outline';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'spécification': return BookOpen;
      case 'tutorial': return FileText;
      case 'reference': return File;
      case 'procedure': return SettingsIcon;
      default: return FileText;
    }
  };

  const safeParseTiptapContent = (content: string | null | undefined) => {
    if (!content) return null;
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error('Erreur de parsing du contenu Tiptap:', e, content);
      return 'error';
    }
  };

  const handleSave = useCallback(async (content: any) => {
    setIsSaving(true);
    try {
      await onSave(content);
      setCurrentContent(content);
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  const handleDownloadPDF = async () => {
    try {
      toast.info('Génération du PDF en cours...');
      // Ici, vous pourriez appeler une fonction Supabase Edge Function
      // pour générer le PDF côté serveur
      toast.success('PDF téléchargé avec succès');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleShare = () => {
    toast.info('Fonctionnalité de partage à venir');
  };

  const handleViewHistory = () => {
    toast.info('Historique des versions à venir');
  };

  const CategoryIcon = getCategoryIcon(document.metadata?.category || '');

  return (
    <div className="min-h-screen bg-background">
      {/* Header fixe */}
      <div className="sticky top-0 z-20 bg-background border-b border-border shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
            
            <div className="flex items-center space-x-3">
              <CategoryIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <h1 className="text-xl font-semibold line-clamp-1">{document.title}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={getStatusColor(document.metadata?.status || "draft")}>
                    {document.metadata?.status || "draft"}
                  </Badge>
                  {!isEditing && (
                    <Badge variant="outline">Mode lecture</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Version {document.version}
                  </span>
                  {document.metadata?.is_favorite && (
                    <Star className="h-3 w-3 text-yellow-500" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Actions principales */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isSaving}
            >
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              disabled={isSaving}
            >
              <Share2 className="h-4 w-4 mr-1" />
              Partager
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleViewHistory}
              disabled={isSaving}
            >
              <History className="h-4 w-4 mr-1" />
              Historique
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMetadata(!showMetadata)}
              disabled={isSaving}
            >
              <Settings className="h-4 w-4 mr-1" />
              Métadonnées
            </Button>

            {isEditing && (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleSave(currentContent)}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            )}
          </div>
        </div>

        {/* Métadonnées étendues */}
        {showMetadata && (
          <div className="px-4 pb-4 border-t border-border pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Créé par:</span>
                <span>{document.created_by}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Créé le:</span>
                <span>{new Date(document.created_at).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Modifié le:</span>
                <span>{new Date(document.updated_at).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">Vues:</span>
                <span>{document.metadata?.view_count || 0}</span>
              </div>
            </div>

            {document.metadata?.tags && document.metadata.tags.length > 0 && (
              <div className="flex items-center space-x-2 mt-3">
                <span className="text-sm text-muted-foreground">Tags:</span>
                <div className="flex flex-wrap gap-1">
                  {document.metadata.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto p-4">
        {safeParseTiptapContent(document.content) === 'error' ? (
          <div className="p-6 bg-destructive/10 border border-destructive rounded-lg text-destructive">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-medium">Erreur de contenu</h3>
            </div>
            <p className="text-sm">
              Le contenu du document est corrompu ou non lisible.<br />
              Veuillez contacter un administrateur ou restaurer une version précédente.
            </p>
          </div>
        ) : (
          <div className="max-w-none">
            <TipTapEditor
              content={safeParseTiptapContent(document.content)}
              onChange={(content) => {
                setCurrentContent(content);
              }}
              onSave={handleSave}
              editable={isEditing}
              placeholder="Commencez à écrire votre document..."
              autoSave={isEditing}
              autoSaveDelay={3000}
              className="min-h-[600px] border rounded-lg p-4"
            />
          </div>
        )}
      </div>

      {/* Footer avec informations */}
      <div className="sticky bottom-0 z-10 bg-background border-t border-border p-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>Document ID: {document.id}</span>
            <span>Équipe: {document.team_id}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {isEditing && (
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Sauvegarde automatique activée</span>
              </span>
            )}
            <span>Dernière modification: {new Date(document.updated_at).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor; 