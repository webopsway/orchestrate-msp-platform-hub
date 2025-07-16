import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  FileText, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw
} from "lucide-react";
import { ServicePlaceholder } from "@/components/placeholder/ServicePlaceholder";

const ITSMUnified = () => {
  const [activeTab, setActiveTab] = useState("incidents");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">ITSM - Vue Unifiée</h1>
          <p className="text-muted-foreground">
            Gestion centralisée des incidents, demandes et changements
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau ticket
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-red-100 text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Incidents ouverts</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Demandes en cours</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Changements planifiés</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Résolus ce mois</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="requests">Demandes</TabsTrigger>
          <TabsTrigger value="changes">Changements</TabsTrigger>
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-6">
          <ServicePlaceholder 
            title="Gestion des Incidents"
            description="La gestion des incidents sera disponible après la migration de la base de données."
          />
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <ServicePlaceholder 
            title="Demandes de Service"
            description="La gestion des demandes de service sera disponible après la migration de la base de données."
          />
        </TabsContent>

        <TabsContent value="changes" className="space-y-6">
          <ServicePlaceholder 
            title="Gestion des Changements"
            description="La gestion des changements sera disponible après la migration de la base de données."
          />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <ServicePlaceholder 
            title="Tableau de Bord ITSM"
            description="Le tableau de bord ITSM sera disponible après la migration de la base de données."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ITSMUnified;