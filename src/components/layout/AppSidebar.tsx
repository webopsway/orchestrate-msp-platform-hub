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
  Home
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

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

const navigationItems = [
  { title: "Tableau de bord", url: "/", icon: Home },
  { title: "Organisations", url: "/organizations", icon: Building2 },
  { title: "Utilisateurs & Équipes", url: "/users", icon: Users },
  { title: "Rôles & Permissions", url: "/rbac", icon: Shield },
];

const itsmItems = [
  { title: "Incidents", url: "/itsm/incidents", icon: AlertTriangle },
  { title: "Changements", url: "/itsm/changes", icon: FileText },
  { title: "Demandes de service", url: "/itsm/requests", icon: FileText },
  { title: "Sauvegardes", url: "/itsm/backups", icon: Database },
  { title: "Sécurité", url: "/itsm/security", icon: ShieldCheck },
];

const cloudItems = [
  { title: "Inventaire Cloud", url: "/cloud/inventory", icon: Cloud },
  { title: "Gestion des patchs", url: "/cloud/patches", icon: ShieldCheck },
];

const monitoringItems = [
  { title: "Supervision", url: "/monitoring/metrics", icon: BarChart3 },
  { title: "Notifications", url: "/monitoring/notifications", icon: Bell },
  { title: "Documentation", url: "/documentation", icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>ITSM</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {itsmItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Infrastructure Cloud</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {cloudItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Supervision</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {monitoringItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}