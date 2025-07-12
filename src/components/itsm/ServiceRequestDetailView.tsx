import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Calendar,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Settings,
  MessageSquare,
  Edit2,
  Save,
  X
} from "lucide-react";
import { CommentsSection } from "./CommentsSection";
import { RequestAssignment } from "./RequestAssignment";
import { RequestStatusUpdate } from "./RequestStatusUpdate";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ServiceRequestDetailViewProps {
  requestId: string;
  isOpen: boolean;
  onClose: () => void;
  onRequestUpdated?: () => void;
}

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  impact: 'low' | 'medium' | 'high' | 'critical';
  service_category: string;
  resolution?: string;
  due_date?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  requested_by: string;
  assigned_to?: string;
  team_id: string;
  requested_by_profile?: {
    email: string;
    first_name?: string;
    last_name?: string;
  } | null;
  assigned_to_profile?: {
    email: string;
    first_name?: string;
    last_name?: string;
  } | null;
}

export const ServiceRequestDetailView = ({
  requestId,
  isOpen,
  onClose,
  onRequestUpdated
}: ServiceRequestDetailViewProps) => {
  const { userProfile } = useAuth();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('itsm_service_requests')
        .select(`
          *,
          requested_by_profile:requested_by(email, first_name, last_name),
          assigned_to_profile:assigned_to(email, first_name, last_name)
        `)
        .eq('id', requestId)
        .single();

      if (error) throw error;
      setRequest(data as any);
    } catch (error) {
      console.error('Error fetching service request:', error);
      toast.error('Erreur lors du chargement de la demande');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && requestId) {
      fetchRequest();
    }
  }, [isOpen, requestId]);

  const handleFieldEdit = (field: string, currentValue: any) => {
    setEditingField(field);
    setEditValues({ [field]: currentValue });
  };

  const handleFieldSave = async (field: string) => {
    try {
      const { error } = await supabase
        .from('itsm_service_requests')
        .update({ [field]: editValues[field] })
        .eq('id', requestId);

      if (error) throw error;

      setRequest(prev => prev ? { ...prev, [field]: editValues[field] } : null);
      setEditingField(null);
      setEditValues({});
      toast.success('Champ mis à jour');
      onRequestUpdated?.();
    } catch (error) {
      console.error('Error updating field:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleFieldCancel = () => {
    setEditingField(null);
    setEditValues({});
  };

  const getDisplayName = (profile: any) => {
    if (!profile) return "Non assigné";
    if (profile.first_name || profile.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return profile.email;
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
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const serviceCategories = {
    general: "Général",
    hardware: "Matériel",
    software: "Logiciel",
    network: "Réseau",
    access: "Accès / Permissions",
    training: "Formation",
    procurement: "Approvisionnement",
    maintenance: "Maintenance"
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl">
          <CardContent className="p-6">
            <p>Demande de service introuvable</p>
            <Button onClick={onClose} className="mt-4">Fermer</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-auto">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                REQ-{request.id.slice(0, 8)} - {request.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={getPriorityColor(request.priority)}>
                  {request.priority}
                </Badge>
                <Badge variant={getStatusColor(request.status)}>
                  {request.status}
                </Badge>
                <Badge variant="outline">
                  {serviceCategories[request.service_category as keyof typeof serviceCategories]}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">
                <FileText className="h-4 w-4 mr-2" />
                Détails
              </TabsTrigger>
              <TabsTrigger value="comments">
                <MessageSquare className="h-4 w-4 mr-2" />
                Commentaires
              </TabsTrigger>
              <TabsTrigger value="history">
                <Clock className="h-4 w-4 mr-2" />
                Historique
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informations principales */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informations générales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Titre */}
                    <div>
                      <Label className="text-sm font-medium">Titre</Label>
                      {editingField === 'title' ? (
                        <div className="flex gap-2 mt-1">
                          <Input
                            value={editValues.title}
                            onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                          />
                          <Button size="sm" onClick={() => handleFieldSave('title')}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleFieldCancel}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-sm">{request.title}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleFieldEdit('title', request.title)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      {editingField === 'description' ? (
                        <div className="flex flex-col gap-2 mt-1">
                          <Textarea
                            value={editValues.description}
                            onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleFieldSave('description')}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleFieldCancel}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start mt-1">
                          <p className="text-sm">{request.description || "Aucune description"}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleFieldEdit('description', request.description)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Catégorie */}
                    <div>
                      <Label className="text-sm font-medium">Catégorie de service</Label>
                      {editingField === 'service_category' ? (
                        <div className="flex gap-2 mt-1">
                          <Select
                            value={editValues.service_category}
                            onValueChange={(value) => setEditValues({ ...editValues, service_category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(serviceCategories).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" onClick={() => handleFieldSave('service_category')}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleFieldCancel}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-sm">
                            {serviceCategories[request.service_category as keyof typeof serviceCategories]}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleFieldEdit('service_category', request.service_category)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Statut et assignation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Statut et assignation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Statut</Label>
                      <div className="mt-1">
                        <RequestStatusUpdate
                          requestId={request.id}
                          currentStatus={request.status}
                          onStatusUpdated={fetchRequest}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Assigné à</Label>
                      <div className="mt-1">
                        <RequestAssignment
                          requestId={request.id}
                          currentAssignee={request.assigned_to}
                          onAssigned={fetchRequest}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Demandeur</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {getDisplayName(request.requested_by_profile)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Priorités et impacts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Priorités et impacts</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Priorité</Label>
                        <Badge variant={getPriorityColor(request.priority)} className="mt-1">
                          {request.priority}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Urgence</Label>
                        <Badge variant={getPriorityColor(request.urgency)} className="mt-1">
                          {request.urgency}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Impact</Label>
                        <Badge variant={getPriorityColor(request.impact)} className="mt-1">
                          {request.impact}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Dates importantes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dates importantes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Date de création</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">
                          {format(new Date(request.created_at), "PPP 'à' HH:mm", { locale: fr })}
                        </span>
                      </div>
                    </div>

                    {request.due_date && (
                      <div>
                        <Label className="text-sm font-medium">Date d'échéance</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">
                            {format(new Date(request.due_date), "PPP", { locale: fr })}
                          </span>
                        </div>
                      </div>
                    )}

                    {request.resolved_at && (
                      <div>
                        <Label className="text-sm font-medium">Date de résolution</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">
                            {format(new Date(request.resolved_at), "PPP 'à' HH:mm", { locale: fr })}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Résolution */}
              {(request.resolution || request.status === 'resolved' || request.status === 'closed') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Résolution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {editingField === 'resolution' ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editValues.resolution}
                          onChange={(e) => setEditValues({ ...editValues, resolution: e.target.value })}
                          placeholder="Décrivez la résolution..."
                          rows={4}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleFieldSave('resolution')}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleFieldCancel}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <p className="text-sm">
                          {request.resolution || "Aucune résolution documentée"}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleFieldEdit('resolution', request.resolution)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="comments" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Commentaires</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Les commentaires seront bientôt disponibles pour les demandes de service.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Historique des modifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    L'historique des modifications sera bientôt disponible.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};