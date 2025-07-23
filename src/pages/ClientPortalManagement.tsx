import { ClientPortalManager } from '@/components/admin/ClientPortalManager';
import { PageHeader } from '@/components/common/PageHeader';

const ClientPortalManagement = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Portails Client"
        description="Configurez les modules, le branding et les accès pour chaque portail client et ESN"
      />

      <ClientPortalManager />
    </div>
  );
};

export default ClientPortalManagement; 