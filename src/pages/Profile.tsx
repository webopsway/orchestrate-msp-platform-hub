import { PageHeader } from "@/components/common/PageHeader";
import { UserProfile } from "@/components/profile/UserProfile";

export default function Profile() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Mon Profil" 
        description="Gérez vos informations personnelles et les paramètres de votre compte"
      />
      <UserProfile />
    </div>
  );
}