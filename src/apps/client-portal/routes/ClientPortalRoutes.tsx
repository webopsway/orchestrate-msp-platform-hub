import { Routes, Route } from "react-router-dom";
import { ClientLayout } from "../layouts/ClientLayout";

// Import pages autorisées pour les clients
import Index from "@/pages/Index"; // Dashboard simplifié
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";

// Modules clients sélectionnés
import NewUsers from "@/pages/NewUsers"; // Gestion utilisateurs équipe
import NewTeams from "@/pages/NewTeams"; // Gestion équipes
import BusinessServices from "@/pages/BusinessServices"; // Services métiers
import Applications from "@/pages/Applications"; // Applications client
import ITSM from "@/pages/ITSM"; // Tickets/incidents
import ITSMIncidents from "@/pages/ITSM/ITSMIncidents";
import ITSMRequests from "@/pages/ITSM/ITSMRequests";
import Monitoring from "@/pages/Monitoring"; // Supervision (lecture seule)

export function ClientPortalRoutes() {
  return (
    <Routes>
      {/* Auth route */}
      <Route path="/auth" element={<Auth />} />
      
      {/* Protected client routes */}
      <Route path="/" element={<ClientLayout />}>
        <Route index element={<Index />} />
        
        {/* Gestion des utilisateurs et équipes (limitée) */}
        <Route path="users" element={<NewUsers />} />
        <Route path="teams" element={<NewTeams />} />
        
        {/* Services métiers et applications */}
        <Route path="applications/business-services" element={<BusinessServices />} />
        <Route path="applications/applications" element={<Applications />} />
        
        {/* ITSM (tickets et demandes) */}
        <Route path="itsm" element={<ITSM />} />
        <Route path="itsm/incidents" element={<ITSMIncidents />} />
        <Route path="itsm/requests" element={<ITSMRequests />} />
        
        {/* Monitoring (lecture seule) */}
        <Route path="monitoring/metrics" element={<Monitoring />} />
        
        {/* Profil et paramètres */}
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      
      {/* Catch all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
} 