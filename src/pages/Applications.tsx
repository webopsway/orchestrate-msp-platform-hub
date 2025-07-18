import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/common/PageHeader';
import { BusinessServiceManager } from '@/components/applications/BusinessServiceManager';
import { ApplicationManager } from '@/components/applications/ApplicationManager';
import { ApplicationDeploymentManager } from '@/components/applications/ApplicationDeploymentManager';
import { Layers, Server, Rocket } from 'lucide-react';

export default function Applications() {
  const [activeTab, setActiveTab] = useState('business-services');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications & Services"
        description="Gestion des services métiers et déploiements d'applications"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="business-services" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Services Métiers
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="deployments" className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Déploiements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business-services" className="space-y-6">
          <BusinessServiceManager />
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          <ApplicationManager />
        </TabsContent>

        <TabsContent value="deployments" className="space-y-6">
          <ApplicationDeploymentManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}