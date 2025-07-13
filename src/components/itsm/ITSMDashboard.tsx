import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Users,
  Calendar,
  Plus
} from 'lucide-react';
import { useITSMItems } from '@/hooks/useITSMItems';
import { ITSMBadge } from './ITSMBadge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ITSMDashboardProps {
  onCreateItem?: (type: 'incident' | 'change' | 'request') => void;
  onViewItem?: (item: any) => void;
  showCreateButtons?: boolean;
}

export const ITSMDashboard: React.FC<ITSMDashboardProps> = ({
  onCreateItem,
  onViewItem,
  showCreateButtons = true
}) => {
  const { 
    items, 
    loading, 
    getItemsByType, 
    getItemsByStatus, 
    getItemsByPriority 
  } = useITSMItems();

  // Statistiques générales
  const totalItems = items.length;
  const incidents = getItemsByType('incident');
  const changes = getItemsByType('change');
  const requests = getItemsByType('request');

  // Statistiques par statut
  const openItems = items.filter(item => 
    ['open', 'draft', 'pending_approval'].includes(item.status)
  ).length;
  const inProgressItems = items.filter(item => 
    item.status === 'in_progress'
  ).length;
  const resolvedItems = items.filter(item => 
    ['resolved', 'closed', 'implemented'].includes(item.status)
  ).length;

  // Statistiques par priorité
  const criticalItems = getItemsByPriority('critical').length;
  const highItems = getItemsByPriority('high').length;
  const mediumItems = getItemsByPriority('medium').length;
  const lowItems = getItemsByPriority('low').length;

  // Éléments récents (7 derniers jours)
  const recentItems = items
    .filter(item => {
      const itemDate = new Date(item.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return itemDate >= weekAgo;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
      case 'draft':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
      case 'pending_approval':
        return <AlertTriangle className="h-4 w-4" />;
      case 'resolved':
      case 'closed':
      case 'implemented':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'incident':
        return <AlertTriangle className="h-4 w-4" />;
      case 'change':
        return <FileText className="h-4 w-4" />;
      case 'request':
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec boutons de création */}
      {showCreateButtons && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Tableau de bord ITSM</h2>
            <p className="text-muted-foreground">
              Vue d'ensemble de vos incidents, changements et demandes
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onCreateItem?.('incident')} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Incident
            </Button>
            <Button onClick={() => onCreateItem?.('change')} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Changement
            </Button>
            <Button onClick={() => onCreateItem?.('request')} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Demande
            </Button>
          </div>
        </div>
      )}

      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Éléments au total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressItems}</div>
            <p className="text-xs text-muted-foreground">
              En traitement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ouverts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openItems}</div>
            <p className="text-xs text-muted-foreground">
              En attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Résolus</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedItems}</div>
            <p className="text-xs text-muted-foreground">
              Terminés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Répartition par type et priorité */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Répartition par type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span>Incidents</span>
              </div>
              <Badge variant="secondary">{incidents.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span>Changements</span>
              </div>
              <Badge variant="secondary">{changes.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-500" />
                <span>Demandes</span>
              </div>
              <Badge variant="secondary">{requests.length}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition par priorité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Critique</span>
              <Badge variant="destructive">{criticalItems}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Élevée</span>
              <Badge variant="default">{highItems}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Moyenne</span>
              <Badge variant="secondary">{mediumItems}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Faible</span>
              <Badge variant="outline">{lowItems}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Éléments récents */}
      <Card>
        <CardHeader>
          <CardTitle>Éléments récents</CardTitle>
        </CardHeader>
        <CardContent>
          {recentItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun élément récent
            </div>
          ) : (
            <div className="space-y-3">
              {recentItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => onViewItem?.(item)}
                >
                  <div className="flex items-center gap-3">
                    {getTypeIcon(item.type)}
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.created_by_profile?.email || item.created_by}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ITSMBadge type="priority" value={item.priority} />
                    <ITSMBadge type="status" value={item.status} category={item.type} />
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(item.created_at), 'dd/MM/yyyy', { locale: fr })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 