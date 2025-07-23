import { DeploymentManager } from '@/components/applications/DeploymentManager';
import { PageHeader } from '@/components/common/PageHeader';

const Deployments = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Déploiements"
        description="Gestion globale des déploiements d'applications sur l'infrastructure cloud"
      />

      <DeploymentManager 
        showApplicationColumn={true}
        compact={false}
      />
    </div>
  );
};

export default Deployments; 