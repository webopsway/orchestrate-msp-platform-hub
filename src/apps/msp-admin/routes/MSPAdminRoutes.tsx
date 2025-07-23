import { Routes, Route, Navigate } from "react-router-dom";
import { MSPLayout } from "../layouts/MSPLayout";

// Import all MSP pages
import Index from "@/pages/Index";
import NewOrganizations from "@/pages/NewOrganizations";
import NewTeams from "@/pages/NewTeams";
import Security from "@/pages/Security";
import SecurityPatchManagement from "@/pages/SecurityPatchManagement";
import Vulnerabilities from "@/pages/Vulnerabilities";
import Documentation from "@/pages/DocumentationModern";
import CloudOrchestration from "@/pages/CloudOrchestration";
import GlobalSettings from "@/pages/GlobalSettings";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import ITSM from "@/pages/ITSM";
import ITSMIncidents from "@/pages/ITSM/ITSMIncidents";
import ITSMSecurityIncidents from "@/pages/ITSM/ITSMSecurityIncidents";
import ITSMChanges from "@/pages/ITSM/ITSMChanges";
import ITSMRequests from "@/pages/ITSM/ITSMRequests";
import Cloud from "@/pages/Cloud";
import CloudInventory from "@/pages/CloudInventory";
import CloudAccounts from "@/pages/CloudAccounts";
import Monitoring from "@/pages/Monitoring";
import Notifications from "@/pages/Notifications";
import NewUsers from "@/pages/NewUsers";
import Roles from "@/pages/Roles";
import RBACManagement from "@/pages/RBACManagement";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Setup from "@/pages/Setup";
import MspClientRelations from "@/pages/MspClientRelations";
import SLAManagement from "@/pages/SLAManagement";
import TenantManagement from "@/pages/TenantManagement";
import ClientPortalManagement from "@/pages/ClientPortalManagement";
import BusinessServices from "@/pages/BusinessServices";
import Applications from "@/pages/Applications";
import Deployments from "@/pages/Deployments";

export function MSPAdminRoutes() {
  return (
    <Routes>
      {/* Auth route */}
      <Route path="/auth" element={<Auth />} />
      
      {/* Protected MSP routes */}
      <Route path="/" element={<MSPLayout />}>
        <Route index element={<Index />} />
        
        {/* Organization Management */}
        <Route path="organizations" element={<NewOrganizations />} />
        <Route path="teams" element={<NewTeams />} />
        
        {/* User Management */}
        <Route path="users" element={<NewUsers />} />
        <Route path="roles" element={<Roles />} />
        <Route path="rbac" element={<RBACManagement />} />
        <Route path="msp-client-relations" element={<MspClientRelations />} />
        <Route path="sla-management" element={<SLAManagement />} />
        
        {/* Business Services & Applications */}
        <Route path="applications/business-services" element={<BusinessServices />} />
        <Route path="applications/applications" element={<Applications />} />
        <Route path="applications/deployments" element={<Deployments />} />
        
        {/* ITSM */}
        <Route path="itsm" element={<ITSM />} />
        <Route path="itsm/incidents" element={<ITSMIncidents />} />
        <Route path="itsm/security" element={<ITSMSecurityIncidents />} />
        <Route path="itsm/changes" element={<ITSMChanges />} />
        <Route path="itsm/requests" element={<ITSMRequests />} />
        
        {/* Security */}
        <Route path="security" element={<Security />} />
        <Route path="security/patches" element={<SecurityPatchManagement />} />
        <Route path="security/vulnerabilities" element={<Vulnerabilities />} />
        
        {/* Cloud */}
        <Route path="cloud" element={<Cloud />} />
        <Route path="cloud/inventory" element={<CloudInventory />} />
        <Route path="cloud/patches" element={<CloudOrchestration />} />
        <Route path="cloud/accounts" element={<CloudAccounts />} />
        
        {/* Monitoring */}
        <Route path="monitoring/metrics" element={<Monitoring />} />
        <Route path="monitoring/notifications" element={<Notifications />} />
        
        {/* Documentation */}
        <Route path="documentation" element={<Documentation />} />
        
        {/* Admin Settings */}
        <Route path="global-settings" element={<GlobalSettings />} />
        <Route path="tenant-management" element={<TenantManagement />} />
        <Route path="client-portal-management" element={<ClientPortalManagement />} />
        
        {/* Profile */}
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="setup" element={<Setup />} />
      </Route>
      
      {/* Catch all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
} 