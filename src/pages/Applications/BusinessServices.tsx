import { PageHeader } from '@/components/common/PageHeader';
import { BusinessServiceManager } from '@/components/applications/BusinessServiceManager';
import { Layers } from 'lucide-react';

export default function BusinessServices() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Services Métiers"
        description="Gestion des services métiers et de leur criticité"
      />
      <BusinessServiceManager />
    </div>
  );
}