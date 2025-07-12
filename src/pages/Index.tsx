import Dashboard from "./Dashboard";
import { RoleAdmin } from "@/components/admin/RoleAdmin";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { userProfile } = useAuth();
  const isMspAdmin = userProfile?.is_msp_admin || false;

  return (
    <div className="space-y-6">
      {isMspAdmin && <RoleAdmin />}
      <Dashboard />
    </div>
  );
};

export default Index;
