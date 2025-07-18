import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BusinessServiceForm } from '@/components/applications/BusinessServiceForm';
import { CreateDialog } from '@/components/common/CreateDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { useBusinessServices } from '@/hooks/useBusinessServices';
import type { BusinessService, BusinessServiceFilters } from '@/types/application';

export function BusinessServiceManager() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filters, setFilters] = useState<BusinessServiceFilters>({});
  const { businessServices, isLoading, createBusinessService, updateBusinessService, deleteBusinessService } = useBusinessServices();

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredServices = businessServices?.filter((service: BusinessService) => {
    if (filters.search && !service.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.criticality && service.criticality !== filters.criticality) {
      return false;
    }
    return true;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions et filtres */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher des services..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10 w-64"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Service Métier
        </Button>
      </div>

      {/* Liste des services */}
      {filteredServices.length === 0 ? (
        <EmptyState
          title="Aucun service métier"
          description="Commencez par créer votre premier service métier"
          action={
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un service métier
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service: BusinessService) => (
            <Card key={service.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <Badge className={getCriticalityColor(service.criticality)}>
                    {service.criticality}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {service.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {service.description}
                  </p>
                )}
                
                <div className="space-y-2">
                  {service.business_owner && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Propriétaire métier:</span>
                      <span>{service.business_owner}</span>
                    </div>
                  )}
                  {service.technical_owner && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Propriétaire technique:</span>
                      <span>{service.technical_owner}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Dépendances:</span>
                    <span>{service.dependencies?.length || 0} applications</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de création */}
      <CreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        title="Nouveau Service Métier"
        description="Créez un nouveau service métier et définissez ses caractéristiques."
      >
        <BusinessServiceForm
          onSubmit={async (data) => {
            await createBusinessService(data);
            setShowCreateDialog(false);
          }}
          onCancel={() => setShowCreateDialog(false)}
        />
      </CreateDialog>
    </div>
  );
}