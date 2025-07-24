import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Calendar, User, Clock } from "lucide-react";
import type { Change } from "@/types/change";

interface ChangeDetailViewProps {
  change: Change;
}

export function ChangeDetailView({ change }: ChangeDetailViewProps) {
  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case "emergency":
        return "destructive";
      case "standard":
        return "default";
      case "normal":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "implemented":
        return "default";
      case "approved":
        return "secondary";
      case "pending_approval":
        return "outline";
      case "draft":
        return "outline";
      case "failed":
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

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
            <FileText className="h-5 w-5" />
            Détails du changement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">{change.title}</h3>
              <p className="text-muted-foreground">{change.description}</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Type:</span>
                <Badge variant={getChangeTypeColor(change.change_type)}>
                  {change.change_type}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Statut:</span>
                <Badge variant={getStatusColor(change.status)}>
                  {change.status.replace('_', ' ')}
                </Badge>
              </div>
              
              {change.assigned_to && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Assigné à:</span>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{change.assigned_to}</span>
                  </div>
                </div>
              )}
              
              {change.scheduled_date && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Date prévue:</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">{formatDate(change.scheduled_date)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Créé le: {formatDate(change.created_at)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Mis à jour le: {formatDate(change.updated_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 