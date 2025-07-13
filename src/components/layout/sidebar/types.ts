export interface NavigationItem {
  id: string;
  title: string;
  url: string;
  icon: string;
  order: number;
  group: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

export interface NavigationGroup {
  id: string;
  title: string;
  order: number;
}

export interface SidebarConfig {
  items: NavigationItem[];
  groups: NavigationGroup[];
}