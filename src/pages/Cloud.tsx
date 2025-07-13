import { useState } from "react";
import { PageHeader } from "@/components/common";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cloud, Server, Settings, Database } from "lucide-react";
import CloudProviderManager from "@/components/cloud/CloudProviderManager";

// Import des autres composants cloud existants
import CloudAccounts from "./CloudAccounts";
import CloudInventory from "./CloudInventory";
import CloudOrchestration from "./CloudOrchestration";

const CloudManagement = () => {
  const [activeTab, setActiveTab] = useState("providers");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion Cloud"
        description="Centre de contrôle pour la gestion de votre infrastructure cloud"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            Providers
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Comptes
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Inventaire
          </TabsTrigger>
          <TabsTrigger value="orchestration" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Orchestration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6">
          <CloudProviderManager />
        </TabsContent>

        <TabsContent value="accounts" className="space-y-6">
          <CloudAccounts />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <CloudInventory />
        </TabsContent>

        <TabsContent value="orchestration" className="space-y-6">
          <CloudOrchestration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CloudManagement;