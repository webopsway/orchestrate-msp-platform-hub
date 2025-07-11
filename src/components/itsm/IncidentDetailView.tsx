import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  User, 
  Edit3, 
  Save,
  X,
  MessageSquare,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { CommentsSection } from "./CommentsSection";
import { IncidentAssignment } from "./IncidentAssignment";

interface ITSMIncident {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  metadata?: any;
}

interface IncidentDetailViewProps {
  incident: ITSMIncident | null;
  isOpen: boolean;
  onClose: () => void;
  onIncidentUpdated?: () => void;
}

export function IncidentDetailView({ 
  incident, 
  isOpen, 
  onClose,
  onIncidentUpdated 
}: IncidentDetailViewProps) {
  const { user } = useAuth();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<ITSMIncident>>({});
  const [saving, setSaving] = useState(false);
  const [currentIncident, setCurrentIncident] = useState<ITSMIncident | null>(incident);

  useEffect(() => {
    setCurrentIncident(incident);
    setEditValues({});
    setEditingField(null);
  }, [incident]);

  const startEdit = (field: string) => {
    if (!currentIncident) return;
    setEditingField(field);
    setEditValues({ [field]: currentIncident[field as keyof ITSMIncident] });
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValues({});
  };

  const saveField = async (field: string) => {
    if (!currentIncident || !editValues[field as keyof ITSMIncident]) return;

    try {
      setSaving(true);
      
      const updateData: any = { [field]: editValues[field as keyof ITSMIncident] };
      
      // Si on change le statut vers "resolved", mettre à jour resolved_at
      if (field === 'status' && editValues.status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('itsm_incidents')
        .update(updateData)
        .eq('id', currentIncident.id);

      if (error) throw error;

      // Mettre à jour l'incident local
      const updatedIncident = { ...currentIncident, ...updateData };
      setCurrentIncident(updatedIncident);
      
      toast.success('Champ mis à jour');
      setEditingField(null);
      setEditValues({});
      onIncidentUpdated?.();
    } catch (error) {
      console.error('Error saving field:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "destructive";
      case "high": return "secondary";
      case "medium": return "default";
      case "low": return "outline";
      default: return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
      case "closed":
        return "default";
      case "in_progress":
        return "secondary";
      case "open":
        return "outline";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!currentIncident) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            INC-{currentIncident.id.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Détails</TabsTrigger>
            <TabsTrigger value="comments">
              <MessageSquare className="h-4 w-4 mr-1" />
              Commentaires
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="h-4 w-4 mr-1" />
              Historique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* En-tête avec informations principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Priorité</CardTitle>
                </CardHeader>
                <CardContent>
                  {editingField === 'priority' ? (
                    <div className="flex items-center gap-2">
                      <Select 
                        value={editValues.priority} 
                        onValueChange={(value) => setEditValues({ ...editValues, priority: value as any })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Basse</SelectItem>
                          <SelectItem value="medium">Moyenne</SelectItem>
                          <SelectItem value="high">Haute</SelectItem>
                          <SelectItem value="critical">Critique</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={() => saveField('priority')} disabled={saving}>
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <Badge variant={getPriorityColor(currentIncident.priority)}>
                        {currentIncident.priority}
                      </Badge>
                      <Button size="sm" variant="ghost" onClick={() => startEdit('priority')}>
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Statut</CardTitle>
                </CardHeader>
                <CardContent>
                  {editingField === 'status' ? (
                    <div className="flex items-center gap-2">
                      <Select 
                        value={editValues.status} 
                        onValueChange={(value) => setEditValues({ ...editValues, status: value as any })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Ouvert</SelectItem>
                          <SelectItem value="in_progress">En cours</SelectItem>
                          <SelectItem value="resolved">Résolu</SelectItem>
                          <SelectItem value="closed">Fermé</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={() => saveField('status')} disabled={saving}>
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <Badge variant={getStatusColor(currentIncident.status)}>
                        {currentIncident.status}
                      </Badge>
                      <Button size="sm" variant="ghost" onClick={() => startEdit('status')}>
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Assigné à</CardTitle>
                </CardHeader>
                <CardContent>
                  <IncidentAssignment
                    incidentId={currentIncident.id}
                    currentAssignee={currentIncident.assigned_to}
                    onAssigned={(assigneeId) => {
                      setCurrentIncident({ ...currentIncident, assigned_to: assigneeId || undefined });
                      onIncidentUpdated?.();
                    }}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Titre et description */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Titre</CardTitle>
                  {editingField !== 'title' && (
                    <Button size="sm" variant="ghost" onClick={() => startEdit('title')}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingField === 'title' ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editValues.title || ''}
                      onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                      className="min-h-[60px]"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveField('title')} disabled={saving}>
                        <Save className="h-4 w-4 mr-1" />
                        Sauvegarder
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-lg font-medium">{currentIncident.title}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Description</CardTitle>
                  {editingField !== 'description' && (
                    <Button size="sm" variant="ghost" onClick={() => startEdit('description')}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingField === 'description' ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editValues.description || ''}
                      onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                      className="min-h-[120px]"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveField('description')} disabled={saving}>
                        <Save className="h-4 w-4 mr-1" />
                        Sauvegarder
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{currentIncident.description}</p>
                )}
              </CardContent>
            </Card>

            {/* Informations temporelles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date de création
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{formatDate(currentIncident.created_at)}</p>
                </CardContent>
              </Card>

              {currentIncident.resolved_at && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Date de résolution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{formatDate(currentIncident.resolved_at)}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="comments" className="mt-4 overflow-y-auto max-h-[calc(90vh-200px)]">
            <CommentsSection 
              ticketId={currentIncident.id} 
              ticketType="incident" 
            />
          </TabsContent>

          <TabsContent value="activity" className="mt-4 overflow-y-auto max-h-[calc(90vh-200px)]">
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2" />
                  <p>Historique des activités</p>
                  <p className="text-sm">Fonctionnalité en cours de développement</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}