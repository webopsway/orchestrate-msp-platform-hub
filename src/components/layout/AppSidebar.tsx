import { 
  Building2, 
  Users, 
  Shield, 
  AlertTriangle, 
  Cloud, 
  ShieldCheck, 
  Database, 
  BarChart3, 
  Bell, 
  FileText,
  Home,
  Settings,
  CreditCard,
  Server,
  Zap,
  Globe,
  Monitor,
  Archive,
  Calendar,
  Search,
  Network
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSettings } from "@/hooks/useAppSettings";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface NavigationItem {
  id: string;
  title: string;
  url: string;
  icon: string;
  order: number;
  group: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

interface SidebarConfig {
  items: NavigationItem[];
  groups: {
    id: string;
    title: string;
    order: number;
  }[];
}

// Configuration par défaut de la navigation - sera remplacée par les données de la base
const defaultNavigationItems: NavigationItem[] = [
  { id: "dashboard", title: "Tableau de bord", url: "/", icon: "Home", order: 1, group: "main" },
  { id: "organizations", title: "Organisations", url: "/organizations", icon: "Building2", order: 2, group: "main" },
  { id: "users", title: "Utilisateurs & Équipes", url: "/users", icon: "Users", order: 3, group: "main" },
  { id: "roles", title: "Rôles", url: "/roles", icon: "Shield", order: 4, group: "main" },
  { id: "rbac", title: "Gestion RBAC", url: "/rbac", icon: "ShieldCheck", order: 5, group: "main" },
  { id: "msp-relations", title: "Relations MSP-Client", url: "/msp-client-relations", icon: "Network", order: 6, group: "main" },
  
  { id: "tickets", title: "Tickets", url: "/itsm", icon: "FileText", order: 1, group: "itsm" },
  { id: "incidents", title: "Incidents", url: "/itsm/incidents", icon: "AlertTriangle", order: 2, group: "itsm" },
  { id: "changes", title: "Changements", url: "/itsm/changes", icon: "FileText", order: 3, group: "itsm" },
  { id: "requests", title: "Demandes de service", url: "/itsm/requests", icon: "FileText", order: 4, group: "itsm" },
  { id: "backups", title: "Sauvegardes", url: "/itsm/backups", icon: "Database", order: 5, group: "itsm" },
  { id: "security", title: "Sécurité", url: "/itsm/security", icon: "ShieldCheck", order: 6, group: "itsm" },
  
  { id: "inventory", title: "Inventaire Cloud", url: "/cloud/inventory", icon: "Cloud", order: 1, group: "cloud" },
  { id: "patches", title: "Gestion des patchs", url: "/cloud/patches", icon: "ShieldCheck", order: 2, group: "cloud" },
  { id: "accounts", title: "Comptes Cloud", url: "/cloud/accounts", icon: "CreditCard", order: 3, group: "cloud" },
  
  { id: "metrics", title: "Supervision", url: "/monitoring/metrics", icon: "BarChart3", order: 1, group: "monitoring" },
  { id: "notifications", title: "Notifications", url: "/monitoring/notifications", icon: "Bell", order: 2, group: "monitoring" },
  { id: "documentation", title: "Documentation", url: "/documentation", icon: "FileText", order: 3, group: "monitoring" },
  
  { id: "settings", title: "Paramètres", url: "/global-settings", icon: "Settings", order: 1, group: "admin" },
];

const defaultGroups = [
  { id: "main", title: "Principal", order: 1 },
  { id: "itsm", title: "ITSM", order: 2 },
  { id: "cloud", title: "Infrastructure Cloud", order: 3 },
  { id: "monitoring", title: "Supervision", order: 4 },
  { id: "admin", title: "Administration", order: 5 },
];

const iconMap: Record<string, any> = {
  Home,
  Building2,
  Users,
  Shield,
  AlertTriangle,
  Cloud,
  ShieldCheck,
  Database,
  BarChart3,
  Bell,
  FileText,
  Settings,
  CreditCard,
  Server,
  Zap,
  Globe,
  Monitor,
  Archive,
  Calendar,
  Search,
  Network
};

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { sessionContext } = useAuth();
  const { getSetting } = useAppSettings();
  
  const [sidebarConfig, setSidebarConfig] = useState<SidebarConfig>({
    items: defaultNavigationItems,
    groups: defaultGroups
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadSidebarConfig = async () => {
      try {
        // Récupérer la configuration depuis app_settings
        const teamId = sessionContext?.current_team_id || sessionContext?.current_organization_id || null;
        const config = await getSetting(teamId, 'ui', 'sidebar_config');
        
        if (config) {
          setSidebarConfig(config);
        }
      } catch (error) {
        console.log('Using default sidebar configuration');
      }
    };

    if (sessionContext?.is_msp || sessionContext?.current_team_id) {
      loadSidebarConfig();
    }
  }, [sessionContext?.is_msp, sessionContext?.current_team_id, sessionContext?.current_organization_id, getSetting]);

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50";

  // Filtrer les éléments selon les permissions
  const filteredItems = sidebarConfig.items.filter(item => {
    // MSP peut voir tout
    if (sessionContext?.is_msp) return true;
    
    // Masquer les paramètres pour les non-MSP
    if (item.group === "admin" && !sessionContext?.is_msp) return false;
    
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
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        )}

        {/* Navigation groups */}
        {groupedItems.map((group) => (
          <SidebarGroup key={group.id}>
            {!collapsed && <SidebarGroupLabel>{group.title}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const IconComponent = iconMap[item.icon];
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} className={getNavCls}>
                          <IconComponent className="h-4 w-4" />
                          {!collapsed && (
                            <div className="flex items-center justify-between w-full">
                              <span>{item.title}</span>
                              {item.badge && (
                                <Badge 
                                  variant={item.badgeVariant || "secondary"} 
                                  className="ml-auto text-xs"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Indicateur de contexte utilisateur */}
        {!collapsed && sessionContext && (
          <div className="p-4 border-t mt-auto">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${sessionContext.is_msp ? 'bg-blue-500' : 'bg-green-500'}`} />
                <span>
                  {sessionContext.is_msp ? 'Mode MSP' : 'Mode Équipe'}
                </span>
              </div>
              {(sessionContext.current_team_id || sessionContext.current_organization_id) && (
                <div className="text-xs text-muted-foreground truncate">
                  {sessionContext.current_team_id 
                    ? `Équipe: ${sessionContext.current_team_id.slice(0, 8)}...` 
                    : `Org: ${sessionContext.current_organization_id?.slice(0, 8)}...`
                  }
                </div>
              )}
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}