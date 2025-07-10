import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
  AlertCircle
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
  const { sessionContext } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string>("");

  // État pour les modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

  // État pour les formulaires
  const [newDocument, setNewDocument] = useState({
    title: "",
    content: "",
    category: "",
    tags: [] as string[],
    status: "draft" as const
  });

  const [editDocument, setEditDocument] = useState({
    title: "",
    content: "",
    category: "",
    tags: [] as string[],
    status: "draft" as const
  });

  useEffect(() => {
    fetchDocuments();
  }, [sessionContext]);

  const fetchDocuments = async () => {
    if (!sessionContext?.current_team_id) return;

    try {
      setLoading(true);
      
      // Récupérer les documents
      const { data: docsData, error: docsError } = await supabase
        .from('documentation')
        .select('*')
        .eq('team_id', sessionContext.current_team_id)
        .order('updated_at', { ascending: false });

      if (docsError) throw docsError;
      setDocuments(docsData || []);

      // Récupérer les versions (pour les documents sélectionnés)
      if (selectedDocument) {
        const { data: versionsData, error: versionsError } = await supabase
          .from('document_versions')
          .select('*')
          .eq('document_id', selectedDocument.id)
          .order('created_at', { ascending: false });

        if (versionsError) throw versionsError;
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
    if (!sessionContext?.current_team_id) return;

    try {
      setLoading(true);
      
      const docData = {
        team_id: sessionContext.current_team_id,
        title: newDocument.title,
        content: newDocument.content,
        version: "1.0",
        created_by: sessionContext.current_team_id, // TODO: utiliser l'ID utilisateur réel
        metadata: {
          category: newDocument.category,
          tags: newDocument.tags,
          status: newDocument.status
        }
      };
      
      const { data, error } = await supabase
        .from('documentation')
        .insert([docData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Document créé avec succès');
      setIsCreateModalOpen(false);
      resetNewDocumentForm();
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
      
      // Créer une nouvelle version
      const versionData = {
        document_id: selectedDocument.id,
        version: (parseFloat(selectedDocument.version) + 0.1).toFixed(1),
        title: editDocument.title,
        content: editDocument.content,
        created_by: sessionContext?.current_team_id || "",
        change_log: "Mise à jour du document"
      };

      const { error: versionError } = await supabase
        .from('document_versions')
        .insert([versionData]);

      if (versionError) throw versionError;

      // Mettre à jour le document principal
      const { error: updateError } = await supabase
        .from('documentation')
        .update({
          title: editDocument.title,
          content: editDocument.content,
          version: versionData.version,
          updated_by: sessionContext?.current_team_id,
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
        .from('documentation')
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
      const link = document.createElement('a');
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
      content: "",
      category: "",
      tags: [],
      status: "draft"
    });
  };

  const resetEditDocumentForm = () => {
    setEditDocument({
      title: "",
      content: "",
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
      content: document.content,
      category: document.metadata?.category || "",
      tags: document.metadata?.tags || [],
      status: document.metadata?.status || "draft"
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (document: Document) => {
    setSelectedDocument(document);
    setSelectedVersion(document.version);
    setIsViewModalOpen(true);
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
      case "guide": return BookOpen;
      case "api": return File;
      case "tutorial": return FileText;
      default: return FileText;
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    { value: "guide", label: "Guides" },
    { value: "api", label: "API" },
    { value: "tutorial", label: "Tutoriels" },
    { value: "reference", label: "Référence" }
  ];

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
                              {doc.content.substring(0, 100)}...
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
                          <Badge variant={getStatusColor(doc.metadata?.status || "draft")}>
                            {doc.metadata?.status || "draft"}
                          </Badge>
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
                              onClick={() => openViewModal(doc)}
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
                        <Badge variant={getStatusColor(doc.metadata?.status || "draft")}>
                          {doc.metadata?.status || "draft"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {doc.content.substring(0, 150)}...
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
                          onClick={() => openViewModal(doc)}
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="doc-content">Contenu (Markdown)</Label>
              <Textarea
                id="doc-content"
                value={newDocument.content}
                onChange={(e) => setNewDocument({...newDocument, content: e.target.value})}
                placeholder="# Titre du document

## Introduction

Contenu de votre document en Markdown..."
                rows={15}
                className="font-mono"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={createDocument} disabled={!newDocument.title || !newDocument.content}>
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-content">Contenu (Markdown)</Label>
              <Textarea
                id="edit-content"
                value={editDocument.content}
                onChange={(e) => setEditDocument({...editDocument, content: e.target.value})}
                placeholder="# Titre du document

## Introduction

Contenu de votre document en Markdown..."
                rows={15}
                className="font-mono"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={updateDocument} disabled={!editDocument.title || !editDocument.content}>
                Mettre à jour
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de visualisation */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.title}</DialogTitle>
            <DialogDescription>
              Version {selectedDocument?.version} - {selectedDocument?.metadata?.category}
            </DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Badge variant={getStatusColor(selectedDocument.metadata?.status || "draft")}>
                    {selectedDocument.metadata?.status || "draft"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Dernière modification: {new Date(selectedDocument.updated_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadPDF(selectedDocument)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Télécharger PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      openEditModal(selectedDocument);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="prose prose-sm max-w-none">
                  {/* Ici vous pourriez utiliser un renderer Markdown */}
                  <pre className="whitespace-pre-wrap text-sm">{selectedDocument.content}</pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Documentation;