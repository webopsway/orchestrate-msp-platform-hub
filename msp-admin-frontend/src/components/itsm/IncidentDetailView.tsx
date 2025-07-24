import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Calendar, User, Clock } from "lucide-react";
import type { Incident } from "@/types/incident";
import { ITSMBadge } from "./ITSMBadge";

interface IncidentDetailViewProps {
  incident: Incident;
}

export function IncidentDetailView({ incident }: IncidentDetailViewProps) {

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Détails de l'incident
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">{incident.title}</h3>
              <p className="text-muted-foreground">{incident.description}</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Priorité:</span>
                <ITSMBadge type="priority" value={incident.priority} />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Statut:</span>
                <ITSMBadge type="status" value={incident.status} category="incident" />
              </div>
              
              {incident.assigned_to && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Assigné à:</span>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{incident.assigned_to}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Créé le: {formatDate(incident.created_at)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Mis à jour le: {formatDate(incident.updated_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}