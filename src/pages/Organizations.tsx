import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  Users, 
  Search,
  Plus,
  Settings,
  MapPin
} from "lucide-react";

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
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Organisations</h2>
          <p className="text-muted-foreground">
            Gestion des clients, ESN et partenaires MSP
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle organisation
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Recherche et filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une organisation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              Filtres avancés
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Organizations List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredOrgs.map((org) => (
          <Card key={org.id} className="hover:shadow-md transition-shadow">
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
      </div>

      {filteredOrgs.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Aucune organisation trouvée</p>
            <p className="text-muted-foreground">
              Essayez de modifier vos critères de recherche
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Organizations;