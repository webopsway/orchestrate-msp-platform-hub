import React from 'react';
import { Eye, Clock, Building2, Network, AlertTriangle, CheckCircle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { SLAPolicy } from '@/hooks/useSLAPolicies';

interface ViewSLAPolicyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  policy: SLAPolicy | null;
}

export const ViewSLAPolicyDialog: React.FC<ViewSLAPolicyDialogProps> = ({
  isOpen,
  onClose,
  policy
}) => {
  if (!policy) return null;

  const formatTime = (hours: number) => {
    if (hours < 1) {
      return `${hours * 60} minutes`;
    } else if (hours === 1) {
      return '1 heure';
    } else if (hours < 24) {
      return `${hours} heures`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      if (remainingHours === 0) {
        return `${days} jour${days > 1 ? 's' : ''}`;
      } else {
        return `${days} jour${days > 1 ? 's' : ''} et ${remainingHours}h`;
      }
    }
  };

  const getClientTypeInfo = (clientType: string) => {
    switch (clientType) {
      case 'direct':
        return {
          label: 'Client direct',
          icon: Building2,
          description: 'Gestion directe par le MSP',
          color: 'text-blue-600'
        };
      case 'via_esn':
        return {
          label: 'Via ESN',
          icon: Network,
          description: 'Gestion via prestataire ESN',
          color: 'text-purple-600'
        };
      default:
        return {
          label: 'Tous les clients',
          icon: Building2,
          description: 'Applicable à tous les types de clients',
          color: 'text-gray-600'
        };
    }
  };

  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'critical':
        return { label: 'Critique', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
      case 'high':
        return { label: 'Élevée', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
      case 'medium':
        return { label: 'Moyenne', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
      case 'low':
        return { label: 'Faible', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
      default:
        return { label: priority, color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };
    }
  };

  const clientInfo = getClientTypeInfo(policy.client_type);
  const priorityInfo = getPriorityInfo(policy.priority);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {policy.name}
          </DialogTitle>
          <DialogDescription>
            Détails de la politique SLA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type de client</label>
                  <div className="flex items-center gap-2 mt-1">
                    <clientInfo.icon className={`h-4 w-4 ${clientInfo.color}`} />
                    <span className="font-medium">{clientInfo.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{clientInfo.description}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Priorité</label>
                  <div className="flex items-center gap-2 mt-1">
                    {policy.priority === 'critical' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                    <Badge 
                      variant="outline" 
                      className={`${priorityInfo.bgColor} ${priorityInfo.borderColor} ${priorityInfo.color}`}
                    >
                      {priorityInfo.label}
                    </Badge>
                  </div>
                </div>
              </div>

              {policy.ticket_category && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Catégorie de ticket</label>
                  <p className="mt-1">{policy.ticket_category}</p>
                </div>
              )}

              {policy.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-1 text-sm">{policy.description}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Statut</label>
                <div className="mt-1">
                  <Badge variant={policy.is_active ? 'default' : 'secondary'}>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {policy.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Délais SLA */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Délais SLA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Temps de réponse</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      {formatTime(policy.response_time_hours)}
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Délai maximum pour la première réponse
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-900">Temps de résolution</span>
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      {formatTime(policy.resolution_time_hours)}
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Délai maximum pour résoudre le problème
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {policy.escalation_time_hours && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-orange-900">Temps d'escalade</span>
                      </div>
                      <div className="text-2xl font-bold text-orange-700">
                        {formatTime(policy.escalation_time_hours)}
                      </div>
                      <p className="text-xs text-orange-600 mt-1">
                        Délai avant escalade automatique
                      </p>
                    </div>
                  )}

                  {policy.escalation_to && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="mb-2">
                        <span className="font-medium text-gray-900">Escalader vers</span>
                      </div>
                      <div className="text-sm text-gray-700">
                        {policy.escalation_to}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métadonnées */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Métadonnées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-muted-foreground">Créé le</label>
                  <p>{new Date(policy.created_at).toLocaleString('fr-FR')}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">Modifié le</label>
                  <p>{new Date(policy.updated_at).toLocaleString('fr-FR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};