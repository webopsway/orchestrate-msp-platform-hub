import { NavLink } from "react-router-dom";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { 
  Building2, 
  Users, 
  AlertTriangle, 
  BarChart3, 
  FileText,
  Home,
  Settings,
  Server,
  Layers,
  User
} from "lucide-react";

// Configuration de navigation CLIENT (modules limités)
const CLIENT_NAVIGATION_GROUPS = [
  { id: "main", title: "Principal", order: 1 },
  { id: "organization", title: "Équipe", order: 2 },
  { id: "applications", title: "Applications", order: 3 },
  { id: "itsm", title: "Support", order: 4 },
  { id: "monitoring", title: "Supervision", order: 5 },
  { id: "profile", title: "Compte", order: 6 },
];

const CLIENT_NAVIGATION_ITEMS = [
  { id: "dashboard", title: "Tableau de bord", url: "/", icon: Home, order: 1, group: "main" },

  { id: "users", title: "Utilisateurs", url: "/users", icon: Users, order: 1, group: "organization" },
  { id: "teams", title: "Équipes", url: "/teams", icon: Building2, order: 2, group: "organization" },
  
  { id: "business-services", title: "Services Métiers", url: "/applications/business-services", icon: Layers, order: 1, group: "applications" },
  { id: "applications", title: "Applications", url: "/applications/applications", icon: Server, order: 2, group: "applications" },
  
  { id: "itsm", title: "Tickets", url: "/itsm", icon: FileText, order: 1, group: "itsm" },
  { id: "incidents", title: "Incidents", url: "/itsm/incidents", icon: AlertTriangle, order: 2, group: "itsm" },
  { id: "requests", title: "Demandes", url: "/itsm/requests", icon: FileText, order: 3, group: "itsm" },
  
  { id: "monitoring", title: "Monitoring", url: "/monitoring/metrics", icon: BarChart3, order: 1, group: "monitoring" },
  
  { id: "profile", title: "Mon Profil", url: "/profile", icon: User, order: 1, group: "profile" },
  { id: "settings", title: "Paramètres", url: "/settings", icon: Settings, order: 2, group: "profile" },
];

interface ClientSidebarNavigationProps {
  collapsed: boolean;
  getNavCls: ({ isActive }: { isActive: boolean }) => string;
  searchTerm: string;
  allowedModules: string[];
}

export function ClientSidebarNavigation({ 
  collapsed, 
  getNavCls, 
  searchTerm, 
  allowedModules 
}: ClientSidebarNavigationProps) {
  
  // Filtrer les éléments selon les modules autorisés et la recherche
  const filteredItems = CLIENT_NAVIGATION_ITEMS.filter(item => {
    // Vérifier si le module est autorisé
    if (!allowedModules.includes(item.id)) return false;
    
    // Filtrer par recherche
    if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Grouper les éléments
  const groupedItems = CLIENT_NAVIGATION_GROUPS
    .sort((a, b) => a.order - b.order)
    .map(group => ({
      ...group,
      items: filteredItems
        .filter(item => item.group === group.id)
        .sort((a, b) => a.order - b.order)
    }))
    .filter(group => group.items.length > 0);

  return (
    <>
      {groupedItems.map((group) => (
        <SidebarGroup key={group.id}>
          {!collapsed && <SidebarGroupLabel>{group.title}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const IconComponent = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavCls}>
                        <IconComponent className="h-4 w-4" />
                        {!collapsed && (
                          <div className="flex items-center justify-between w-full">
                            <span>{item.title}</span>
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
      
      {/* Affichage si aucun module disponible */}
      {groupedItems.length === 0 && !collapsed && (
        <div className="p-4 text-center text-muted-foreground text-sm">
          Aucun module disponible
        </div>
      )}
    </>
  );
} 