import { PageHeader } from '@/components/common/PageHeader';
import { ApplicationManager } from '@/components/applications/ApplicationManager';
import { Server } from 'lucide-react';

export default function Applications() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        description="Gestion des applications et de leurs configurations"
      />
      <ApplicationManager />
    </div>
  );
}