import { NavLink } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavigationItem, NavigationGroup } from "./types";
import { iconMap } from "./navigationConfig";

interface SidebarNavigationProps {
  groupedItems: (NavigationGroup & { items: NavigationItem[] })[];
  collapsed: boolean;
  getNavCls: ({ isActive }: { isActive: boolean }) => string;
}

export function SidebarNavigation({ groupedItems, collapsed, getNavCls }: SidebarNavigationProps) {
  return (
    <>
      {groupedItems.map((group) => (
        <SidebarGroup key={group.id}>
          {!collapsed && <SidebarGroupLabel>{group.title}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items
                .filter(item => !item.hidden) // Filtrer les éléments cachés
                .map((item) => {
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
    </>
  );
}