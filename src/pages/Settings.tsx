import { PageHeader } from "@/components/common/PageHeader";
import { UserSettings } from "@/components/settings/UserSettings";

export default function Settings() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Paramètres" 
        description="Gérez vos préférences personnelles, notifications et paramètres de sécurité"
      />
      <UserSettings />
    </div>
  );
}