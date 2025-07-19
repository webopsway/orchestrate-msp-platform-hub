import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationsAndTeams } from "@/hooks/useOrganizationsAndTeams";
import { NotionLikeEditor } from "@/components/documentation/NotionLikeEditor";
import { useDocumentBlocks } from "@/hooks/useDocumentBlocks";
import { 
  PageHeader, 
  DataGrid, 
  SearchAndFilters,
  EmptyState 
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Cog
} from "lucide-react";
import { toast } from "sonner";

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
  metadata: {
    tags?: string[];
    category?: string;
    status?: 'draft' | 'published' | 'archived';
    is_favorite?: boolean;
    [key: string]: any;
  };
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

const Documentation = () => {
  const { userProfile, user } = useAuth();
  const { data: organizationData, isLoading: teamsLoading } = useOrganizationsAndTeams();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string>("");

  // État pour l'édition en page complète
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  const [isViewingDocument, setIsViewingDocument] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);


  // État pour les formulaires
  const [newDocument, setNewDocument] = useState({
    title: "",
    category: "",
    team_id: "", // Nouvelle propriété pour l'équipe cliente
    tags: [] as string[],
    status: "draft" as 'draft' | 'published' | 'archived'
  });

  const [editDocument, setEditDocument] = useState({
    title: "",
    category: "",
    tags: [] as string[],
    status: "draft" as 'draft' | 'published' | 'archived'
  });

  useEffect(() => {
    fetchDocuments();
  }, [userProfile]);

  const fetchDocuments = async () => {
    if (!userProfile?.default_team_id && !userProfile?.is_msp_admin) return;

    try {
      setLoading(true);
      
      // Récupérer les documents - Admin MSP voit tout, autres voient leur équipe
      let query = supabase
        .from('team_documents')
        .select('*');

      // Si pas admin MSP, filtrer par équipe
      if (!userProfile?.is_msp_admin) {
        query = query.eq('team_id', userProfile.default_team_id);
      }

      const { data: docsData, error: docsError } = await query
        .order('updated_at', { ascending: false });

      if (docsError) throw docsError;
      setDocuments((docsData || []).map(doc => ({
        ...doc,
        metadata: (doc.metadata as any) || { tags: [], category: 'general', status: 'draft', is_favorite: false }
      })));

      // Récupérer les versions (pour les documents sélectionnés)
      if (selectedDocument) {
        // Skip versions for now
        const versionsData: any[] = [];
        setVersions(versionsData || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async () => {
    if (!newDocument.team_id) {
      toast.error('Veuillez sélectionner une équipe cliente');
      return;
    }

    try {
      setLoading(true);
      
      const docData = {
        team_id: newDocument.team_id,
        title: newDocument.title,
        content: '', // Contenu géré par les blocs
        version: "1.0",
        created_by: user?.id || '',
        metadata: {
          category: newDocument.category,
          tags: newDocument.tags,
          status: newDocument.status
        }
      };
      
      const { data, error } = await supabase
        .from('team_documents')
        .insert([docData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Document créé avec succès');
      setIsCreateModalOpen(false);
      resetNewDocumentForm();
      
      // Ouvrir automatiquement l'éditeur pour le nouveau document
      const newDoc: Document = {
        ...data,
        metadata: (data.metadata as any) || { tags: [], category: 'general', status: 'draft', is_favorite: false }
      };
      setSelectedDocument(newDoc);
      setIsEditingDocument(true); // Basculer vers l'édition en page complète
      
      fetchDocuments();
    } catch (error) {
      console.error('Error creating document:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const updateDocument = async () => {
    if (!selectedDocument) return;

    try {
      setLoading(true);
      
      // Mettre à jour le document principal directement
      const { error: updateError } = await supabase
        .from('team_documents')
        .update({
          title: editDocument.title,
          version: (parseFloat(selectedDocument.version) + 0.1).toFixed(1),
          updated_by: userProfile?.id,
          updated_at: new Date().toISOString(),
          metadata: {
            category: editDocument.category,
            tags: editDocument.tags,
            status: editDocument.status
          }
        })
        .eq('id', selectedDocument.id);

      if (updateError) throw updateError;

      toast.success('Document mis à jour avec succès');
      setIsEditModalOpen(false);
      resetEditDocumentForm();
      fetchDocuments();
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('team_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      toast.success('Document supprimé');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const updateDocumentStatus = async (documentId: string, newStatus: 'draft' | 'published' | 'archived') => {
    try {
      const document = documents.find(doc => doc.id === documentId);
      if (!document) return;

      const { error } = await supabase
        .from('team_documents')
        .update({
          metadata: {
            ...document.metadata,
            status: newStatus
          },
          updated_by: userProfile?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (error) throw error;

      // Mettre à jour localement
      setDocuments(prevDocs => 
        prevDocs.map(doc => 
          doc.id === documentId 
            ? { ...doc, metadata: { ...doc.metadata, status: newStatus }, updated_at: new Date().toISOString() }
            : doc
        )
      );

      toast.success(`Statut modifié vers "${newStatus}"`);
    } catch (error) {
      console.error('Error updating document status:', error);
      toast.error('Erreur lors de la modification du statut');
    }
  };

  const downloadPDF = async (document: Document) => {
    try {
      // Simuler la génération de PDF
      toast.info('Génération du PDF en cours...');
      
      // Ici, vous pourriez appeler une fonction Supabase Edge Function
      // pour générer le PDF côté serveur
      const { data, error } = await supabase.functions.invoke('generate-document', {
        body: { 
          document_id: document.id,
          format: 'pdf'
        }
      });

      if (error) throw error;

      // Créer un lien de téléchargement
      const blob = new Blob([data.content], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${document.title}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success('PDF téléchargé avec succès');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const resetNewDocumentForm = () => {
    setNewDocument({
      title: "",
      category: "",
      team_id: "",
      tags: [],
      status: "draft"
    });
  };

  const resetEditDocumentForm = () => {
    setEditDocument({
      title: "",
      category: "",
      tags: [],
      status: "draft"
    });
    setSelectedDocument(null);
  };

  const openEditModal = (document: Document) => {
    setSelectedDocument(document);
    setEditDocument({
      title: document.title,
      category: document.metadata?.category || "",
      tags: document.metadata?.tags || [],
      status: (document.metadata?.status as 'draft' | 'published' | 'archived') || "draft"
    });
    setIsEditModalOpen(true);
  };

  const openDocumentEditor = (document: Document, editMode: boolean = false) => {
    setSelectedDocument(document);
    setSelectedVersion(document.version);
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
      case "published": return "default";
      case "draft": return "secondary";
      case "archived": return "outline";
      default: return "outline";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "spécification": return BookOpen;
      case "tutorial": return FileText;
      case "reference": return File;
      default: return FileText;
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.metadata?.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || doc.metadata?.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || doc.metadata?.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = [
    {
      title: "Documents totaux",
      value: documents.length.toString(),
      icon: FileText,
      color: "text-blue-500"
    },
    {
      title: "Publiés",
      value: documents.filter(d => d.metadata?.status === 'published').length.toString(),
      icon: CheckCircle,
      color: "text-green-500"
    },
    {
      title: "Brouillons",
      value: documents.filter(d => d.metadata?.status === 'draft').length.toString(),
      icon: Edit,
      color: "text-yellow-500"
    },
    {
      title: "Favoris",
      value: documents.filter(d => d.metadata?.is_favorite).length.toString(),
      icon: Star,
      color: "text-purple-500"
    }
  ];

  const categories = [
    { value: "all", label: "Toutes les catégories" },
    { value: "spécification", label: "Spécification" },
    { value: "tutorial", label: "Tutoriels" },
    { value: "reference", label: "Référence" }
  ];

  const safeParseTiptapContent = (content: string | null | undefined) => {
    if (!content) return null;
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error('Erreur de parsing du contenu Tiptap:', e, content);
      return 'error';
    }
  };

  if (loading && documents.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Documentation"
          description="Gestion et consultation des documents"
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Si on est en mode édition ou visualisation de document, afficher l'éditeur
  if ((isEditingDocument || isViewingDocument) && selectedDocument) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-20 bg-background border-b border-border">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditingDocument(false);
                  setIsViewingDocument(false);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Retour à la liste
              </Button>
              <div>
                <h1 className="text-xl font-semibold">{selectedDocument.title}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={getStatusColor(selectedDocument.metadata?.status || "draft")}>
                    {selectedDocument.metadata?.status || "draft"}
                  </Badge>
                  {isViewingDocument && (
                    <Badge variant="outline">Mode lecture</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Version {selectedDocument.version}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadPDF(selectedDocument)}
              >
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
              {isViewingDocument && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => openDocumentEditor(selectedDocument, true)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditModal(selectedDocument)}
              >
                <Cog className="h-4 w-4 mr-1" />
                Métadonnées
              </Button>
            </div>
          </div>
        </div>
        
        <DocumentEditor 
          selectedDocument={selectedDocument} 
          userProfile={userProfile}
          isViewingDocument={isViewingDocument}
          setSelectedDocument={setSelectedDocument}
        />
      </div>
    );
  }

  // Composant séparé pour l'éditeur
  function DocumentEditor({ 
    selectedDocument, 
    userProfile, 
    isViewingDocument, 
    setSelectedDocument 
  }: {
    selectedDocument: any;
    userProfile: any;
    isViewingDocument: boolean;
    setSelectedDocument: React.Dispatch<React.SetStateAction<any>>;
  }) {
    const { blocks } = useDocumentBlocks(selectedDocument.id);

    return (
      <div className="container mx-auto p-4">
        <NotionLikeEditor
          documentId={selectedDocument.id}
          teamId={selectedDocument.team_id}
          blocks={blocks}
          onSave={async (data) => {
            try {
              await supabase
                .from('team_documents')
                .update({
                  content: JSON.stringify(data),
                  updated_by: userProfile?.id,
                  updated_at: new Date().toISOString(),
                  version: (parseFloat(selectedDocument.version) + 0.1).toFixed(1)
                })
                .eq('id', selectedDocument.id);
              
              // Mettre à jour localement
              setSelectedDocument((prev: any) => prev ? {
                ...prev,
                content: JSON.stringify(data),
                version: (parseFloat(prev.version) + 0.1).toFixed(1),
                updated_at: new Date().toISOString()
              } : null);
              
              toast.success('Document sauvegardé automatiquement');
            } catch (error) {
              console.error('Error saving document:', error);
              toast.error('Erreur lors de la sauvegarde');
            }
          }}
          readOnly={isViewingDocument}
        />
      </div>
    );
  }

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
      <DataGrid columns={4}>
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
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

      {/* Filtres et vue */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
              <TabsList>
                <TabsTrigger value="list">Liste</TabsTrigger>
                <TabsTrigger value="grid">Grille</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un document..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="published">Publié</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Aucun document trouvé"
              description="Aucun document ne correspond à vos critères"
            />
          ) : viewMode === "list" ? (
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
                  {filteredDocuments.map((doc) => {
                    const CategoryIcon = getCategoryIcon(doc.metadata?.category || "");
                    
                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{doc.title}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              Document avec blocs de contenu
                            </p>
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
                            onValueChange={(value: 'draft' | 'published' | 'archived') => updateDocumentStatus(doc.id, value)}
                          >
                            <SelectTrigger className="w-28 h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-50 bg-background border">
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
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDocumentEditor(doc, false)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadPDF(doc)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(doc)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteDocument(doc.id)}
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((doc) => {
                const CategoryIcon = getCategoryIcon(doc.metadata?.category || "");
                
                return (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <CardTitle className="text-lg">{doc.title}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {doc.metadata?.category || "Non catégorisé"}
                            </p>
                          </div>
                        </div>
                        <Select 
                          value={doc.metadata?.status || "draft"} 
                          onValueChange={(value: 'draft' | 'published' | 'archived') => updateDocumentStatus(doc.id, value)}
                        >
                          <SelectTrigger className="w-20 h-6 text-xs border-none p-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-50 bg-background border">
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
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        Document avec blocs de contenu interactifs
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
                      
                      <div className="flex justify-end space-x-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDocumentEditor(doc, false)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadPDF(doc)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de création */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Nouveau document</DialogTitle>
            <DialogDescription>
              Créez un nouveau document de documentation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doc-title">Titre</Label>
                <Input
                  id="doc-title"
                  value={newDocument.title}
                  onChange={(e) => setNewDocument({...newDocument, title: e.target.value})}
                  placeholder="Titre du document"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-category">Catégorie</Label>
                <Select value={newDocument.category} onValueChange={(value) => setNewDocument({...newDocument, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.slice(1).map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-status">Statut</Label>
                <Select value={newDocument.status} onValueChange={(value: 'draft' | 'published' | 'archived') => setNewDocument({...newDocument, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-background border">
                    <SelectItem value="draft">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">Brouillon</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="published">
                      <div className="flex items-center space-x-2">
                        <Badge variant="default" className="text-xs">Publié</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="archived">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">Archivé</Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-select">
                <Building2 className="h-4 w-4 inline mr-2" />
                Équipe cliente
              </Label>
              <Select value={newDocument.team_id} onValueChange={(value) => setNewDocument({...newDocument, team_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une équipe cliente" />
                </SelectTrigger>
                <SelectContent>
                  {organizationData?.teams?.map(team => {
                    const organization = organizationData.organizations.find(org => org.id === team.organization_id);
                    return (
                      <SelectItem key={team.id} value={team.id}>
                        {organization?.name} - {team.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={createDocument} 
                disabled={!newDocument.title || !newDocument.team_id || teamsLoading}
              >
                Créer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'édition */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Modifier le document</DialogTitle>
            <DialogDescription>
              Modifiez le contenu du document
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Titre</Label>
                <Input
                  id="edit-title"
                  value={editDocument.title}
                  onChange={(e) => setEditDocument({...editDocument, title: e.target.value})}
                  placeholder="Titre du document"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Catégorie</Label>
                <Select value={editDocument.category} onValueChange={(value) => setEditDocument({...editDocument, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.slice(1).map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Statut</Label>
                <Select value={editDocument.status} onValueChange={(value: 'draft' | 'published' | 'archived') => setEditDocument({...editDocument, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-background border">
                    <SelectItem value="draft">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">Brouillon</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="published">
                      <div className="flex items-center space-x-2">
                        <Badge variant="default" className="text-xs">Publié</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="archived">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">Archivé</Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={updateDocument} disabled={!editDocument.title}>
                Mettre à jour
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Documentation;