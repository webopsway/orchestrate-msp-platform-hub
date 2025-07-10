import { useEffect, useState } from "react";
import { BookOpen, Plus, Edit, Trash2, Download, FileText, Copy, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/common/PageHeader";
import { DataGrid } from "@/components/common/DataGrid";
import { EmptyState } from "@/components/common/EmptyState";
import { useDocumentation, type Documentation } from "@/hooks/useDocumentation";
import { useAuth } from "@/contexts/AuthContext";

const documentSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  content: z.string().optional(),
  version: z.string().optional(),
});

type DocumentFormData = z.infer<typeof documentSchema>;

const DocumentForm = ({ 
  document, 
  onSave, 
  onClose 
}: { 
  document?: Documentation;
  onSave: (data: DocumentFormData) => void;
  onClose: () => void;
}) => {
  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: document?.title || '',
      content: document?.content || '',
      version: document?.version || '1.0',
    },
  });

  const onSubmit = (data: DocumentFormData) => {
    onSave(data);
    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre du document</FormLabel>
              <FormControl>
                <Input placeholder="Guide d'utilisation..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="version"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Version</FormLabel>
              <FormControl>
                <Input placeholder="1.0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contenu (Markdown)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="# Titre\n\nVotre contenu en Markdown..."
                  className="min-h-[300px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit">
            {document ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

const DocumentViewer = ({ document }: { document: Documentation }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{document.title}</h2>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Version {document.version}</span>
            <span>•</span>
            <span>Créé le {new Date(document.created_at).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
        <Badge variant="outline">
          {document.version}
        </Badge>
      </div>
      
      <div className="prose max-w-none">
        {document.content ? (
          <div className="whitespace-pre-wrap bg-muted/30 p-4 rounded-lg">
            {document.content}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            Aucun contenu disponible
          </div>
        )}
      </div>
    </div>
  );
};

export default function Documentation() {
  const { user } = useAuth();
  const {
    documents,
    loading,
    fetchDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    createVersion,
    generateDocument,
  } = useDocumentation();

  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Documentation | undefined>();
  const [viewingDocument, setViewingDocument] = useState<Documentation | undefined>();

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const handleSaveDocument = async (data: DocumentFormData) => {
    if (editingDocument) {
      await updateDocument(editingDocument.id, data);
    } else {
      await createDocument(data);
    }
    setEditingDocument(undefined);
  };

  const handleCreateVersion = async (document: Documentation) => {
    await createVersion(document.id, document.title, document.content);
  };

  const handleGeneratePDF = async (document: Documentation) => {
    await generateDocument(document.id, 'pdf');
  };

  const handleGenerateMarkdown = async (document: Documentation) => {
    await generateDocument(document.id, 'markdown');
  };

  // Group documents by title to show versions
  const documentGroups = documents.reduce((groups, doc) => {
    const baseTitle = doc.title;
    if (!groups[baseTitle]) {
      groups[baseTitle] = [];
    }
    groups[baseTitle].push(doc);
    return groups;
  }, {} as Record<string, Documentation[]>);

  // Sort versions within each group
  Object.keys(documentGroups).forEach(title => {
    documentGroups[title].sort((a, b) => {
      // Sort by version (semantic versioning)
      const aVer = a.version.split('.').map(Number);
      const bVer = b.version.split('.').map(Number);
      for (let i = 0; i < Math.max(aVer.length, bVer.length); i++) {
        const aDiff = (aVer[i] || 0) - (bVer[i] || 0);
        if (aDiff !== 0) return -aDiff; // Descending order (newest first)
      }
      return 0;
    });
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentation"
        description="Gérez la documentation de votre équipe avec versioning et génération automatique"
      />

      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          {viewingDocument && (
            <TabsTrigger value="viewer">
              Visualiseur - {viewingDocument.title}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="documents" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Documentation de l'équipe</h3>
              <p className="text-sm text-muted-foreground">
                Créez et gérez vos documents avec versioning automatique
              </p>
            </div>
            <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    setEditingDocument(undefined);
                    setShowDocumentDialog(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingDocument ? 'Modifier' : 'Créer'} un document
                  </DialogTitle>
                  <DialogDescription>
                    Créez ou modifiez un document de documentation
                  </DialogDescription>
                </DialogHeader>
                <DocumentForm
                  document={editingDocument}
                  onSave={handleSaveDocument}
                  onClose={() => setShowDocumentDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {Object.keys(documentGroups).length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Aucun document"
              description="Créez votre premier document de documentation"
              action={{
                label: "Créer un document",
                onClick: () => setShowDocumentDialog(true),
              }}
            />
          ) : (
            <DataGrid columns={2}>
              {Object.entries(documentGroups).map(([title, versions]) => {
                const latestVersion = versions[0];
                return (
                  <Card key={title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {title}
                      </CardTitle>
                      <Badge variant="outline">
                        v{latestVersion.version}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                          {versions.length} version{versions.length > 1 ? 's' : ''}
                        </div>
                        
                        <div className="text-sm">
                          <strong>Dernière modification:</strong> {new Date(latestVersion.updated_at).toLocaleDateString('fr-FR')}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewingDocument(latestVersion)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingDocument(latestVersion);
                              setShowDocumentDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreateVersion(latestVersion)}
                            disabled={loading}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Nouvelle version
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4 mr-1" />
                                Télécharger
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleGeneratePDF(latestVersion)}>
                                <FileText className="h-4 w-4 mr-2" />
                                PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleGenerateMarkdown(latestVersion)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Markdown
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteDocument(latestVersion.id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {versions.length > 1 && (
                          <div className="pt-2 border-t">
                            <div className="text-xs text-muted-foreground mb-1">
                              Autres versions:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {versions.slice(1).map((version) => (
                                <Badge 
                                  key={version.id} 
                                  variant="secondary"
                                  className="cursor-pointer text-xs"
                                  onClick={() => setViewingDocument(version)}
                                >
                                  v{version.version}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </DataGrid>
          )}
        </TabsContent>

        {viewingDocument && (
          <TabsContent value="viewer" className="space-y-6">
            <DocumentViewer document={viewingDocument} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}