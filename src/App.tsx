import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Toaster } from "@/components/ui/sonner";
import Index from "./pages/Index";
import NewOrganizations from "./pages/NewOrganizations";
import NewTeams from "./pages/NewTeams";
import Security from "./pages/Security";
import SecurityPatchManagement from "./pages/SecurityPatchManagement";
import Vulnerabilities from "./pages/Vulnerabilities";
import Documentation from "./pages/Documentation";
import CloudOrchestration from "./pages/CloudOrchestration";
import GlobalSettings from "./pages/GlobalSettings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ITSM from "./pages/ITSM";
import ITSMIncidents from "./pages/ITSM/ITSMIncidents";
import ITSMSecurityIncidents from "./pages/ITSM/ITSMSecurityIncidents";
import ITSMChanges from "./pages/ITSM/ITSMChanges";
import ITSMRequests from "./pages/ITSM/ITSMRequests";

import Cloud from "./pages/Cloud";
import CloudInventory from "./pages/CloudInventory";
import CloudAccounts from "./pages/CloudAccounts";

import Monitoring from "./pages/Monitoring";
import Notifications from "./pages/Notifications";
import NewUsers from "./pages/NewUsers";
import Roles from "./pages/Roles";
import RBACManagement from "./pages/RBACManagement";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Setup from "./pages/Setup";
import MspClientRelations from "./pages/MspClientRelations";
import SLAManagement from "./pages/SLAManagement";

const queryClient = new QueryClient();

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

// Public Route component (redirect to dashboard if authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={
        <PublicRoute>
          <Auth />
        </PublicRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      } />
      <Route path="/organizations" element={
        <ProtectedRoute>
          <NewOrganizations />
        </ProtectedRoute>
      } />
      <Route path="/teams" element={
        <ProtectedRoute>
          <NewTeams />
        </ProtectedRoute>
      } />
      
      {/* User Management Routes */}
      <Route path="/users" element={
        <ProtectedRoute>
          <NewUsers />
        </ProtectedRoute>
      } />
      <Route path="/roles" element={
        <ProtectedRoute>
          <Roles />
        </ProtectedRoute>
      } />
      <Route path="/rbac" element={
        <ProtectedRoute>
          <RBACManagement />
        </ProtectedRoute>
      } />
      <Route path="/msp-client-relations" element={
        <ProtectedRoute>
          <MspClientRelations />
        </ProtectedRoute>
      } />
      <Route path="/sla-management" element={
        <ProtectedRoute>
          <SLAManagement />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      
      {/* ITSM Routes */}
      <Route path="/itsm" element={
        <ProtectedRoute>
          <ITSM />
        </ProtectedRoute>
      } />
      <Route path="/itsm/incidents" element={
        <ProtectedRoute>
          <ITSMIncidents />
        </ProtectedRoute>
      } />
      <Route path="/itsm/security" element={
        <ProtectedRoute>
          <ITSMSecurityIncidents />
        </ProtectedRoute>
      } />
      <Route path="/itsm/changes" element={
        <ProtectedRoute>
          <ITSMChanges />
        </ProtectedRoute>
      } />
      <Route path="/itsm/requests" element={
        <ProtectedRoute>
          <ITSMRequests />
        </ProtectedRoute>
      } />
      <Route path="/security" element={
        <ProtectedRoute>
          <Security />
        </ProtectedRoute>
      } />
      <Route path="/security/patches" element={
        <ProtectedRoute>
          <SecurityPatchManagement />
        </ProtectedRoute>
      } />
      <Route path="/security/vulnerabilities" element={
        <ProtectedRoute>
          <Vulnerabilities />
        </ProtectedRoute>
      } />
      
      {/* Cloud Routes */}
      <Route path="/cloud" element={
        <ProtectedRoute>
          <Cloud />
        </ProtectedRoute>
      } />
      <Route path="/cloud/inventory" element={
        <ProtectedRoute>
          <CloudInventory />
        </ProtectedRoute>
      } />
      <Route path="/cloud/patches" element={
        <ProtectedRoute>
          <CloudOrchestration />
        </ProtectedRoute>
      } />
      <Route path="/cloud/accounts" element={
        <ProtectedRoute>
          <CloudAccounts />
        </ProtectedRoute>
      } />
      
      {/* Monitoring Routes */}
      <Route path="/monitoring/metrics" element={
        <ProtectedRoute>
          <Monitoring />
        </ProtectedRoute>
      } />
      <Route path="/monitoring/notifications" element={
        <ProtectedRoute>
          <Notifications />
        </ProtectedRoute>
      } />
      
      {/* Documentation */}
      <Route path="/documentation" element={
        <ProtectedRoute>
          <Documentation />
        </ProtectedRoute>
      } />
      
      {/* Settings */}
      <Route path="/global-settings" element={
        <ProtectedRoute>
          <GlobalSettings />
        </ProtectedRoute>
      } />
      
      {/* Setup Route */}
      <Route path="/setup" element={
        <ProtectedRoute>
          <Setup />
        </ProtectedRoute>
      } />
      
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
