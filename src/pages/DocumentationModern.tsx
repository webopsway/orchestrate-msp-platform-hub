import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationsAndTeams } from '@/hooks/useOrganizationsAndTeams';
import { TipTapEditor } from '@/components/documentation/TipTapEditor';
import ModernDocumentEditor from '@/components/documentation/ModernDocumentEditor';
import { 
  PageHeader, 
  DataGrid, 
  SearchAndFilters,
  EmptyState 
} from '@/components/common';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Plus, 
  Search, 
  Calendar,
  User,
  Download,
  Eye,
  Edit,
  Trash2,
  History,
  BookOpen,
  File,
  Tag,
  Share2,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Building2,
  Cog,
  Filter,
  Grid3X3,
  List,
  MoreHorizontal,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Settings,
  Copy,
  Archive,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Types modernisés
interface Document {
  id: string;
  team_id: string;
  title: string;
  content: string;
  version: string;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  metadata: DocumentMetadata;
}

interface DocumentMetadata {
  tags?: string[];
  category?: string;
  status?: 'draft' | 'published' | 'archived';
  is_favorite?: boolean;
  description?: string;
  author?: string;
  last_editor?: string;
  view_count?: number;
  [key: string]: any;
}

interface DocumentVersion {
  id: string;
  document_id: string;
  version: string;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  change_log?: string;
}

interface DocumentFilters {
  search: string;
  category: string;
  status: string;
  team: string;
  tags: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

interface DocumentStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  favorites: number;
  recent: number;
}

// Hook personnalisé pour la gestion des documents
const useDocuments = () => {
  const { userProfile, user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!userProfile?.is_msp_admin && !userProfile?.default_team_id) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('team_documents')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!userProfile?.is_msp_admin) {
        query = query.eq('team_id', userProfile.default_team_id);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const processedDocuments = (data || []).map(doc => ({
        ...doc,
        metadata: (doc.metadata as any) || { 
          tags: [], 
          category: 'general', 
          status: 'draft', 
          is_favorite: false 
        }
      }));

      setDocuments(processedDocuments);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des documents');
      toast.error('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  const createDocument = useCallback(async (documentData: Partial<Document>) => {
    if (!user?.id) throw new Error('Utilisateur non authentifié');

    try {
      const { data, error: createError } = await supabase
        .from('team_documents')
        .insert({
          team_id: documentData.team_id!,
          title: documentData.title!,
          content: documentData.content || '',
          created_by: user.id,
          updated_by: user.id,
          version: "1.0",
          metadata: {
            category: documentData.metadata?.category || 'general',
            tags: documentData.metadata?.tags || [],
            status: documentData.metadata?.status || 'draft',
            is_favorite: false,
            ...documentData.metadata
          }
        })
        .select()
        .single();

      if (createError) throw createError;

      const newDocument: Document = {
        ...data,
        metadata: (data.metadata as any) || { 
          tags: [], 
          category: 'general', 
          status: 'draft', 
          is_favorite: false 
        }
      };

      setDocuments(prev => [newDocument, ...prev]);
      toast.success('Document créé avec succès');
      return newDocument;
    } catch (err: any) {
      toast.error(`Erreur lors de la création: ${err.message}`);
      throw err;
    }
  }, [user]);

  const updateDocument = useCallback(async (id: string, updates: Partial<Document>) => {
    try {
      const { error: updateError } = await supabase
        .from('team_documents')
        .update({
          ...updates,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setDocuments(prev => 
        prev.map(doc => 
          doc.id === id 
            ? { ...doc, ...updates, updated_at: new Date().toISOString() }
            : doc
        )
      );

      toast.success('Document mis à jour avec succès');
    } catch (err: any) {
      toast.error(`Erreur lors de la mise à jour: ${err.message}`);
      throw err;
    }
  }, [user]);

  const deleteDocument = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('team_documents')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setDocuments(prev => prev.filter(doc => doc.id !== id));
      toast.success('Document supprimé avec succès');
    } catch (err: any) {
      toast.error(`Erreur lors de la suppression: ${err.message}`);
      throw err;
    }
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    const document = documents.find(doc => doc.id === id);
    if (!document) return;

    const newFavoriteState = !document.metadata.is_favorite;
    
    try {
      await updateDocument(id, {
        metadata: {
          ...document.metadata,
          is_favorite: newFavoriteState
        }
      });
    } catch (err) {
      // L'erreur est déjà gérée dans updateDocument
    }
  }, [documents, updateDocument]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    toggleFavorite
  };
};

// Hook pour les filtres et la recherche
const useDocumentFilters = (documents: Document[]) => {
  const [filters, setFilters] = useState<DocumentFilters>({
    search: '',
    category: 'all',
    status: 'all',
    team: 'all',
    tags: [],
    dateRange: { start: null, end: null }
  });

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = 
        doc.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        doc.metadata?.tags?.some(tag => 
          tag.toLowerCase().includes(filters.search.toLowerCase())
        ) ||
        doc.metadata?.description?.toLowerCase().includes(filters.search.toLowerCase());

      const matchesCategory = 
        filters.category === 'all' || 
        doc.metadata?.category === filters.category;

      const matchesStatus = 
        filters.status === 'all' || 
        doc.metadata?.status === filters.status;

      const matchesTeam = 
        filters.team === 'all' || 
        doc.team_id === filters.team;

      const matchesTags = 
        filters.tags.length === 0 || 
        filters.tags.some(tag => 
          doc.metadata?.tags?.includes(tag)
        );

      const matchesDateRange = 
        !filters.dateRange.start && !filters.dateRange.end ||
        (filters.dateRange.start && new Date(doc.updated_at) >= filters.dateRange.start) ||
        (filters.dateRange.end && new Date(doc.updated_at) <= filters.dateRange.end);

      return matchesSearch && matchesCategory && matchesStatus && 
             matchesTeam && matchesTags && matchesDateRange;
    });
  }, [documents, filters]);

  const stats = useMemo((): DocumentStats => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      total: documents.length,
      published: documents.filter(d => d.metadata?.status === 'published').length,
      draft: documents.filter(d => d.metadata?.status === 'draft').length,
      archived: documents.filter(d => d.metadata?.status === 'archived').length,
      favorites: documents.filter(d => d.metadata?.is_favorite).length,
      recent: documents.filter(d => new Date(d.updated_at) >= oneWeekAgo).length
    };
  }, [documents]);

  return {
    filters,
    setFilters,
    filteredDocuments,
    stats
  };
};

// Composant principal modernisé
const DocumentationModern: React.FC = () => {
  const { userProfile, user } = useAuth();
  const { data: organizationData, isLoading: teamsLoading } = useOrganizationsAndTeams();
  
  // États locaux
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  const [isViewingDocument, setIsViewingDocument] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Nouveau document
  const [newDocument, setNewDocument] = useState({
    title: '',
    category: '',
    team_id: '',
    tags: [] as string[],
    status: 'draft' as const,
    description: ''
  });

  // Hooks personnalisés
  const {
    documents,
    loading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    toggleFavorite
  } = useDocuments();

  const {
    filters,
    setFilters,
    filteredDocuments,
    stats
  } = useDocumentFilters(documents);

  // Handlers
  const handleCreateDocument = async () => {
    if (!newDocument.title.trim() || !newDocument.team_id) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    try {
      const newDoc = await createDocument({
        team_id: newDocument.team_id,
        title: newDocument.title.trim(),
        content: '',
        metadata: {
          category: newDocument.category || 'general',
          tags: newDocument.tags,
          status: newDocument.status,
          description: newDocument.description
        }
      });

      setIsCreateModalOpen(false);
      resetNewDocumentForm();
      
      // Ouvrir l'éditeur pour le nouveau document
      setSelectedDocument(newDoc);
      setIsEditingDocument(true);
    } catch (err) {
      // L'erreur est déjà gérée dans le hook
    }
  };

  const handleUpdateDocument = async () => {
    if (!selectedDocument) return;

    try {
      await updateDocument(selectedDocument.id, {
        title: selectedDocument.title,
        metadata: {
          ...selectedDocument.metadata,
          category: selectedDocument.metadata.category,
          tags: selectedDocument.metadata.tags,
          status: selectedDocument.metadata.status
        }
      });
      setIsEditModalOpen(false);
    } catch (err) {
      // L'erreur est déjà gérée dans le hook
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      try {
        await deleteDocument(id);
        if (selectedDocument?.id === id) {
          setSelectedDocument(null);
          setIsEditingDocument(false);
          setIsViewingDocument(false);
        }
      } catch (err) {
        // L'erreur est déjà gérée dans le hook
      }
    }
  };

  const resetNewDocumentForm = () => {
    setNewDocument({
      title: '',
      category: '',
      team_id: '',
      tags: [],
      status: 'draft',
      description: ''
    });
  };

  const openDocumentEditor = (document: Document, editMode: boolean = false) => {
    setSelectedDocument(document);
    if (editMode) {
      setIsEditingDocument(true);
      setIsViewingDocument(false);
    } else {
      setIsViewingDocument(true);
      setIsEditingDocument(false);
    }
  };

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
      case 'procedure': return Settings;
      default: return FileText;
    }
  };

  // Fonction utilitaire pour obtenir l'icône de catégorie
  const getCategoryIconComponent = (category: string) => {
    switch (category) {
      case 'spécification': return BookOpen;
      case 'tutorial': return FileText;
      case 'reference': return File;
      case 'procedure': return Settings;
      default: return FileText;
    }
  };

  // Rendu du mode éditeur/visualisation
  if ((isEditingDocument || isViewingDocument) && selectedDocument) {
    return (
      <ModernDocumentEditor
        document={selectedDocument}
        isEditing={isEditingDocument}
        onBack={() => {
          setIsEditingDocument(false);
          setIsViewingDocument(false);
          setSelectedDocument(null);
        }}
        onSave={async (content) => {
          try {
            await updateDocument(selectedDocument.id, { content: JSON.stringify(content) });
            toast.success('Document sauvegardé');
          } catch (err) {
            toast.error('Erreur lors de la sauvegarde');
          }
        }}
        userProfile={userProfile}
      />
    );
  }

  // Rendu principal
  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentation"
        description="Gestion et consultation des documents"
        action={{
          label: "Nouveau document",
          icon: Plus,
          onClick: () => setIsCreateModalOpen(true)
        }}
      />

      {/* Statistiques */}
      <DocumentStats stats={stats} />

      {/* Filtres et vue */}
      <DocumentFilters
        filters={filters}
        setFilters={setFilters}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        organizationData={organizationData}
      />

      {/* Liste des documents */}
      <DocumentList
        documents={filteredDocuments}
        loading={loading}
        viewMode={viewMode}
        onView={(doc) => openDocumentEditor(doc, false)}
        onEdit={(doc) => openDocumentEditor(doc, true)}
        onDelete={handleDeleteDocument}
        onToggleFavorite={toggleFavorite}
        onUpdateStatus={(id, status) => {
          const doc = documents.find(d => d.id === id);
          if (doc) {
            updateDocument(id, {
              metadata: { ...doc.metadata, status }
            });
          }
        }}
        getCategoryIcon={getCategoryIconComponent}
      />

      {/* Modals */}
      <CreateDocumentModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        newDocument={newDocument}
        setNewDocument={setNewDocument}
        onSubmit={handleCreateDocument}
        organizationData={organizationData}
        teamsLoading={teamsLoading}
      />

      <EditDocumentModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        document={selectedDocument}
        onSubmit={handleUpdateDocument}
      />
    </div>
  );
};

// Composants auxiliaires
const DocumentStats: React.FC<{ stats: DocumentStats }> = ({ stats }) => (
  <DataGrid columns={4}>
    {[
      { title: "Total", value: stats.total, icon: FileText, color: "text-blue-500" },
      { title: "Publiés", value: stats.published, icon: CheckCircle, color: "text-green-500" },
      { title: "Brouillons", value: stats.draft, icon: Edit, color: "text-yellow-500" },
      { title: "Archivés", value: stats.archived, icon: Archive, color: "text-gray-500" },
      { title: "Favoris", value: stats.favorites, icon: Star, color: "text-purple-500" },
      { title: "Récents", value: stats.recent, icon: Clock, color: "text-orange-500" }
    ].map((stat) => (
      <Card key={stat.title}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className={cn("p-2 rounded-lg bg-muted", stat.color)}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </DataGrid>
);

const DocumentFilters: React.FC<{
  filters: DocumentFilters;
  setFilters: (filters: DocumentFilters) => void;
  viewMode: 'list' | 'grid';
  setViewMode: (mode: 'list' | 'grid') => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  organizationData: any;
}> = ({ filters, setFilters, viewMode, setViewMode, showFilters, setShowFilters, organizationData }) => (
  <Card>
    <CardHeader>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
            <TabsList>
              <TabsTrigger value="list">
                <List className="h-4 w-4 mr-2" />
                Liste
              </TabsTrigger>
              <TabsTrigger value="grid">
                <Grid3X3 className="h-4 w-4 mr-2" />
                Grille
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un document..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-9 w-64"
            />
          </div>
        </div>
      </div>
    </CardHeader>
    
    {showFilters && (
      <CardContent className="border-t pt-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              <SelectItem value="spécification">Spécification</SelectItem>
              <SelectItem value="tutorial">Tutoriels</SelectItem>
              <SelectItem value="reference">Référence</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="published">Publié</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="archived">Archivé</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filters.team} onValueChange={(value) => setFilters({ ...filters, team: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Équipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les équipes</SelectItem>
              {organizationData?.teams?.map((team: any) => {
                const organization = organizationData.organizations.find((org: any) => org.id === team.organization_id);
                return (
                  <SelectItem key={team.id} value={team.id}>
                    {organization?.name} - {team.name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilters({
              search: '',
              category: 'all',
              status: 'all',
              team: 'all',
              tags: [],
              dateRange: { start: null, end: null }
            })}
          >
            <X className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
        </div>
      </CardContent>
    )}
  </Card>
);

const DocumentList: React.FC<{
  documents: Document[];
  loading: boolean;
  viewMode: 'list' | 'grid';
  onView: (doc: Document) => void;
  onEdit: (doc: Document) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onUpdateStatus: (id: string, status: 'draft' | 'published' | 'archived') => void;
  getCategoryIcon: (category: string) => React.ComponentType<any>;
}> = ({ documents, loading, viewMode, onView, onEdit, onDelete, onToggleFavorite, onUpdateStatus, getCategoryIcon }) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={FileText}
            title="Aucun document trouvé"
            description="Aucun document ne correspond à vos critères"
          />
        </CardContent>
      </Card>
    );
  }

  return viewMode === 'list' ? (
    <DocumentListView
      documents={documents}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleFavorite={onToggleFavorite}
      onUpdateStatus={onUpdateStatus}
      getCategoryIcon={getCategoryIcon}
    />
  ) : (
    <DocumentGridView
      documents={documents}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleFavorite={onToggleFavorite}
      onUpdateStatus={onUpdateStatus}
      getCategoryIcon={getCategoryIcon}
    />
  );
};

const DocumentListView: React.FC<{
  documents: Document[];
  onView: (doc: Document) => void;
  onEdit: (doc: Document) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onUpdateStatus: (id: string, status: 'draft' | 'published' | 'archived') => void;
  getCategoryIcon: (category: string) => React.ComponentType<any>;
}> = ({ documents, onView, onEdit, onDelete, onToggleFavorite, onUpdateStatus, getCategoryIcon }) => (
  <Card>
    <CardContent className="p-0">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Dernière modification</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => {
              const CategoryIcon = getCategoryIcon(doc.metadata?.category || "");
              
              return (
                <TableRow key={doc.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleFavorite(doc.id)}
                        className={cn(
                          "h-6 w-6 p-0",
                          doc.metadata?.is_favorite && "text-yellow-500"
                        )}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {doc.metadata?.description || "Document avec blocs de contenu"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <CategoryIcon className="h-4 w-4" />
                      <span className="text-sm">{doc.metadata?.category || "Non catégorisé"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{doc.version}</Badge>
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={doc.metadata?.status || "draft"} 
                      onValueChange={(value: 'draft' | 'published' | 'archived') => onUpdateStatus(doc.id, value)}
                    >
                      <SelectTrigger className="w-28 h-6 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">
                          <Badge variant="secondary" className="text-xs">Brouillon</Badge>
                        </SelectItem>
                        <SelectItem value="published">
                          <Badge variant="default" className="text-xs">Publié</Badge>
                        </SelectItem>
                        <SelectItem value="archived">
                          <Badge variant="outline" className="text-xs">Archivé</Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        {new Date(doc.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(doc)}
                        title="Voir"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(doc)}
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(doc.id)}
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);

const DocumentGridView: React.FC<{
  documents: Document[];
  onView: (doc: Document) => void;
  onEdit: (doc: Document) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onUpdateStatus: (id: string, status: 'draft' | 'published' | 'archived') => void;
  getCategoryIcon: (category: string) => React.ComponentType<any>;
}> = ({ documents, onView, onEdit, onDelete, onToggleFavorite, onUpdateStatus, getCategoryIcon }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {documents.map((doc) => {
      const CategoryIcon = getCategoryIcon(doc.metadata?.category || "");
      
      return (
        <Card key={doc.id} className="hover:shadow-md transition-shadow group">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-lg line-clamp-2">{doc.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {doc.metadata?.category || "Non catégorisé"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleFavorite(doc.id)}
                  className={cn(
                    "h-6 w-6 p-0",
                    doc.metadata?.is_favorite && "text-yellow-500"
                  )}
                >
                  <Star className="h-4 w-4" />
                </Button>
                <Select 
                  value={doc.metadata?.status || "draft"} 
                  onValueChange={(value: 'draft' | 'published' | 'archived') => onUpdateStatus(doc.id, value)}
                >
                  <SelectTrigger className="w-20 h-6 text-xs border-none p-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">
                      <Badge variant="secondary" className="text-xs">Brouillon</Badge>
                    </SelectItem>
                    <SelectItem value="published">
                      <Badge variant="default" className="text-xs">Publié</Badge>
                    </SelectItem>
                    <SelectItem value="archived">
                      <Badge variant="outline" className="text-xs">Archivé</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {doc.metadata?.description || "Document avec blocs de contenu interactifs"}
            </p>
            
            {doc.metadata?.tags && doc.metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {doc.metadata.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {doc.metadata.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{doc.metadata.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-2">
                <User className="h-3 w-3" />
                <span>v{doc.version}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-3 w-3" />
                <span>{new Date(doc.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2 border-t opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(doc)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Voir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(doc)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Modifier
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    })}
  </div>
);

// Composants pour les modals (à implémenter)
import CreateDocumentModal from '@/components/documentation/CreateDocumentModal';
import EditDocumentModal from '@/components/documentation/EditDocumentModal';

export default DocumentationModern; 