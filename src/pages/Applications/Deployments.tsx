import { PageHeader } from '@/components/common/PageHeader';
import { ApplicationDeploymentManager } from '@/components/applications/ApplicationDeploymentManager';
import { Rocket } from 'lucide-react';

export default function Deployments() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Déploiements"
        description="Gestion des déploiements d'applications sur l'infrastructure cloud"
      />
      <ApplicationDeploymentManager />
    </div>
  );
}