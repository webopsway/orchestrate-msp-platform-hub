import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Users, 
  Plus,
  Settings,
  MapPin
} from "lucide-react";
import { 
  PageHeader, 
  SearchAndFilters, 
  DataGrid, 
  EmptyState 
} from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Organizations = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const organizations = [
    {
      id: 1,
      name: "TechCorp Solutions",
      type: "Client",
      location: "Paris, France",
      employees: 156,
      status: "Actif",
      contracts: 3,
      lastActivity: "Il y a 2 heures"
    },
    {
      id: 2,
      name: "DevPro ESN",
      type: "ESN",
      location: "Lyon, France", 
      employees: 89,
      status: "Actif",
      contracts: 12,
      lastActivity: "Il y a 1 jour"
    },
    {
      id: 3,
      name: "CloudMax MSP",
      type: "MSP",
      location: "Marseille, France",
      employees: 45,
      status: "Actif", 
      contracts: 8,
      lastActivity: "Il y a 3 heures"
    },
    {
      id: 4,
      name: "StartupXYZ",
      type: "Client",
      location: "Toulouse, France",
      employees: 23,
      status: "Inactif",
      contracts: 1,
      lastActivity: "Il y a 1 semaine"
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Client": return "default";
      case "ESN": return "secondary";
      case "MSP": return "outline";
      default: return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "Actif" ? "default" : "destructive";
  };

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organisations"
        description="Gestion des clients, ESN et partenaires MSP"
        action={{
          label: "Nouvelle organisation",
          icon: Plus,
          onClick: () => console.log("Nouvelle organisation")
        }}
      />

      <SearchAndFilters
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Rechercher une organisation..."
        onAdvancedFiltersClick={() => console.log("Filtres avancés")}
      />

      <DataGrid columns={3}>
        {filteredOrgs.map((org) => (
          <Card key={org.id} className="hover:shadow-md transition-shadow animate-fade-in">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getTypeColor(org.type)}>{org.type}</Badge>
                      <Badge variant={getStatusColor(org.status)}>{org.status}</Badge>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {org.location}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">{org.employees}</p>
                    <p className="text-muted-foreground">Employés</p>
                  </div>
                  <div>
                    <p className="font-medium">{org.contracts}</p>
                    <p className="text-muted-foreground">Contrats</p>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Dernière activité: {org.lastActivity}
                    </span>
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Voir équipes
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </DataGrid>

      {filteredOrgs.length === 0 && (
        <EmptyState
          icon={Building2}
          title="Aucune organisation trouvée"
          description="Essayez de modifier vos critères de recherche"
          action={{
            label: "Réinitialiser les filtres",
            onClick: () => setSearchTerm("")
          }}
        />
      )}
    </div>
  );
};

export default Organizations;