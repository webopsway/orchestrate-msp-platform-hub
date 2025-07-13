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
  Network,
  Clock,
  Bug,
  Wrench
} from "lucide-react";

import { NavigationItem, NavigationGroup } from "./types";

export const defaultNavigationItems: NavigationItem[] = [
  { id: "dashboard", title: "Tableau de bord", url: "/", icon: "Home", order: 1, group: "main" },
  { id: "organizations", title: "Organisations", url: "/organizations", icon: "Building2", order: 2, group: "main" },
  { id: "users", title: "Utilisateurs & Équipes", url: "/users", icon: "Users", order: 3, group: "main" },
  { id: "roles", title: "Rôles", url: "/roles", icon: "Shield", order: 4, group: "main" },
  { id: "rbac", title: "Gestion RBAC", url: "/rbac", icon: "ShieldCheck", order: 5, group: "main" },
  { id: "msp-relations", title: "Relations MSP-Client", url: "/msp-client-relations", icon: "Network", order: 6, group: "main" },
  { id: "sla-management", title: "Gestion des SLA", url: "/sla-management", icon: "Clock", order: 7, group: "main" },
  
  { id: "tickets", title: "Tickets", url: "/itsm", icon: "FileText", order: 1, group: "itsm" },
  { id: "incidents", title: "Incidents", url: "/itsm/incidents", icon: "AlertTriangle", order: 2, group: "itsm" },
  { id: "security-incidents", title: "Incidents Sécurité", url: "/itsm/security", icon: "Shield", order: 3, group: "itsm" },
  { id: "changes", title: "Changements", url: "/itsm/changes", icon: "FileText", order: 4, group: "itsm" },
  { id: "requests", title: "Demandes de service", url: "/itsm/requests", icon: "FileText", order: 5, group: "itsm" },
  
  { id: "security", title: "Sécurité", url: "/security", icon: "Shield", order: 1, group: "security" },
  { id: "security-patches", title: "Gestion des Patches", url: "/security/patches", icon: "Wrench", order: 2, group: "security" },
  { id: "vulnerabilities", title: "Vulnérabilités", url: "/security/vulnerabilities", icon: "Bug", order: 3, group: "security" },
  
  { id: "cloud-providers", title: "Cloud Providers", url: "/cloud/providers", icon: "Globe", order: 1, group: "cloud" },
  { id: "inventory", title: "Inventaire Cloud", url: "/cloud/inventory", icon: "Cloud", order: 2, group: "cloud" },
  { id: "patches", title: "Gestion des patchs", url: "/cloud/patches", icon: "ShieldCheck", order: 3, group: "cloud" },
  { id: "accounts", title: "Comptes Cloud", url: "/cloud/accounts", icon: "CreditCard", order: 4, group: "cloud" },
  
  { id: "metrics", title: "Supervision", url: "/monitoring/metrics", icon: "BarChart3", order: 1, group: "monitoring" },
  { id: "notifications", title: "Notifications", url: "/monitoring/notifications", icon: "Bell", order: 2, group: "monitoring" },
  { id: "documentation", title: "Documentation", url: "/documentation", icon: "FileText", order: 3, group: "monitoring" },
  
  { id: "settings", title: "Paramètres", url: "/global-settings", icon: "Settings", order: 1, group: "admin" },
];

export const defaultGroups: NavigationGroup[] = [
  { id: "main", title: "Principal", order: 1 },
  { id: "itsm", title: "ITSM", order: 2 },
  { id: "security", title: "Sécurité", order: 3 },
  { id: "cloud", title: "Infrastructure Cloud", order: 4 },
  { id: "monitoring", title: "Supervision", order: 5 },
  { id: "admin", title: "Administration", order: 6 },
];

export const iconMap: Record<string, any> = {
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
  Network,
  Clock,
  Bug,
  Wrench
};