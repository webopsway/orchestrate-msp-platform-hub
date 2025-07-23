import { useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { MSPSidebarNavigation } from "./MSPSidebarNavigation";
import { SidebarSearch } from "@/components/layout/sidebar/SidebarSearch";
import { SidebarUserContext } from "@/components/layout/sidebar/SidebarUserContext";

export function MSPSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50";

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

        {/* Navigation MSP */}
        <MSPSidebarNavigation 
          collapsed={collapsed}
          getNavCls={getNavCls}
          searchTerm={searchTerm}
        />

        {/* Indicateur de contexte utilisateur */}
        {!collapsed && userProfile && (
          <SidebarUserContext userProfile={userProfile} />
        )}
      </SidebarContent>
    </Sidebar>
  );
} 