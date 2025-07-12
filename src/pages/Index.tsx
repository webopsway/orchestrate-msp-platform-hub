import Dashboard from "./Dashboard";
import { RoleAdmin } from "@/components/admin/RoleAdmin";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { sessionContext } = useAuth();
  const isMspAdmin = sessionContext?.is_msp || false;

  return (
    <div className="space-y-6">
      {isMspAdmin && <RoleAdmin />}
      <Dashboard />
    </div>
  );
};

export default Index;
