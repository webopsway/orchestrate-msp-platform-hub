import { useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  useSidebar,
} from "@/components/ui/sidebar";

import { useSidebarConfig } from "./sidebar/useSidebarConfig";
import { SidebarSearch } from "./sidebar/SidebarSearch";
import { SidebarNavigation } from "./sidebar/SidebarNavigation";
import { SidebarUserContext } from "./sidebar/SidebarUserContext";

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { userProfile } = useAuth();
  const sidebarConfig = useSidebarConfig();
  const [searchTerm, setSearchTerm] = useState("");

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50";

  // Filtrer les éléments selon les permissions
  const filteredItems = sidebarConfig.items.filter(item => {
    // MSP peut voir tout
    if (userProfile?.is_msp_admin) return true;
    
    // Masquer les paramètres pour les non-MSP
    if (item.group === "admin" && !userProfile?.is_msp_admin) return false;
    
    // Filtrer par recherche
    if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Grouper les éléments
  const groupedItems = sidebarConfig.groups
    .sort((a, b) => a.order - b.order)
    .map(group => ({
      ...group,
      items: filteredItems
        .filter(item => item.group === group.id)
        .sort((a, b) => a.order - b.order)
    }))
    .filter(group => group.items.length > 0);

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

        {/* Navigation groups */}
        <SidebarNavigation 
          groupedItems={groupedItems}
          collapsed={collapsed}
          getNavCls={getNavCls}
        />

        {/* Indicateur de contexte utilisateur */}
        {!collapsed && userProfile && (
          <SidebarUserContext userProfile={userProfile} />
        )}
      </SidebarContent>
    </Sidebar>
  );
}