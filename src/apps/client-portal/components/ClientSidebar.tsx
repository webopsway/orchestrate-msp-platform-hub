import { useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import {
  Sidebar,
  SidebarContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { ClientSidebarNavigation } from "./ClientSidebarNavigation";
import { SidebarSearch } from "@/components/layout/sidebar/SidebarSearch";
import { SidebarUserContext } from "@/components/layout/sidebar/SidebarUserContext";

export function ClientSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";
  const { userProfile } = useAuth();
  const { currentTenant } = useTenant();
  const [searchTerm, setSearchTerm] = useState("");

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50";

  // Récupérer les modules autorisés depuis la configuration du tenant
  const allowedModules = currentTenant?.access_config?.allowed_modules || [
    'dashboard', 'users', 'teams', 'business-services', 'applications', 
    'itsm', 'monitoring', 'profile', 'settings'
  ];

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent>
        {/* Barre de recherche (visible seulement en mode étendu) */}
        {!collapsed && (
          <SidebarSearch 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm} 
          />
        )}

        {/* Navigation client filtrée */}
        <ClientSidebarNavigation 
          collapsed={collapsed}
          getNavCls={getNavCls}
          searchTerm={searchTerm}
          allowedModules={allowedModules}
        />

        {/* Indicateur de contexte utilisateur */}
        {!collapsed && userProfile && (
          <SidebarUserContext userProfile={userProfile} />
        )}
      </SidebarContent>
    </Sidebar>
  );
} 