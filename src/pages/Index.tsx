import Dashboard from "./Dashboard";
import { SessionTester } from "@/components/SessionTester";

const Index = () => {
  return (
    <div className="space-y-6">
      <SessionTester />
      <Dashboard />
    </div>
  );
};

export default Index;
