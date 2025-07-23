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
  Archive,
  Calendar,
  Search,
  Network,
  Clock,
  Bug,
  Wrench,
  Layers,
  Rocket
} from "lucide-react";

import { NavigationItem, NavigationGroup } from "./types";

export const defaultNavigationItems: NavigationItem[] = [
  { id: "dashboard", title: "Tableau de bord", url: "/", icon: "Home", order: 1, group: "main" },

  { id: "organizations", title: "Organisations", url: "/organizations", icon: "Building2", order: 1, group: "organization" },
  { id: "users", title: "Utilisateurs", url: "/users", icon: "Users", order: 2, group: "organization" },
  { id: "teams", title: "Équipes", url: "/teams", icon: "Users", order: 3, group: "organization" },
  { id: "msp-relations", title: "Relations MSP-Client", url: "/msp-client-relations", icon: "Network", order: 4, group: "organization" },
  { id: "sla-management", title: "Gestion des SLA", url: "/sla-management", icon: "Clock", order: 5, group: "organization" },
  
  { id: "roles", title: "Rôles", url: "/roles", icon: "Shield", order: 1, group: "administration" },
  { id: "rbac", title: "Gestion RBAC", url: "/rbac", icon: "ShieldCheck", order: 2, group: "administration" },
  
  { id: "business-services", title: "Services Métiers", url: "/applications/business-services", icon: "Layers", order: 1, group: "applications" },
  { id: "applications", title: "Applications", url: "/applications/applications", icon: "Server", order: 2, group: "applications" },
  { id: "deployments", title: "Déploiements", url: "/applications/deployments", icon: "Rocket", order: 3, group: "applications" },
  
  { id: "tickets", title: "Tickets", url: "/itsm", icon: "FileText", order: 1, group: "itsm" },
  { id: "incidents", title: "Incidents", url: "/itsm/incidents", icon: "AlertTriangle", order: 2, group: "itsm" },
  { id: "security-incidents", title: "Incidents Sécurité", url: "/itsm/security", icon: "Shield", order: 3, group: "itsm" },
  { id: "changes", title: "Changements", url: "/itsm/changes", icon: "FileText", order: 4, group: "itsm" },
  { id: "requests", title: "Demandes de service", url: "/itsm/requests", icon: "FileText", order: 5, group: "itsm" },
  
  { id: "security", title: "Sécurité", url: "/security", icon: "Shield", order: 1, group: "security" },
  { id: "security-patches", title: "Gestion des Patches", url: "/security/patches", icon: "Wrench", order: 2, group: "security" },
  { id: "vulnerabilities", title: "Vulnérabilités", url: "/security/vulnerabilities", icon: "Bug", order: 3, group: "security" },
  
  { id: "cloud", title: "Gestion Cloud", url: "/cloud", icon: "Cloud", order: 1, group: "cloud" },
  { id: "inventory", title: "Inventaire Cloud", url: "/cloud/inventory", icon: "Cloud", order: 2, group: "cloud" },
  { id: "patches", title: "Gestion des patchs", url: "/cloud/patches", icon: "ShieldCheck", order: 3, group: "cloud" },
  { id: "accounts", title: "Comptes Cloud", url: "/cloud/accounts", icon: "CreditCard", order: 4, group: "cloud" },
  
  { id: "metrics", title: "Supervision", url: "/monitoring/metrics", icon: "BarChart3", order: 1, group: "monitoring" },
  { id: "notifications", title: "Notifications", url: "/monitoring/notifications", icon: "Bell", order: 2, group: "monitoring" },
  { id: "documentation", title: "Documentation", url: "/documentation", icon: "FileText", order: 3, group: "monitoring" },
  
  { id: "tenant-management", title: "Gestion des domaines", url: "/tenant-management", icon: "Globe", order: 1, group: "admin" },
  { id: "client-portal-management", title: "Portails Client", url: "/client-portal-management", icon: "Users", order: 2, group: "admin" },
  { id: "settings", title: "Paramètres", url: "/global-settings", icon: "Settings", order: 3, group: "admin" },
];

export const defaultGroups: NavigationGroup[] = [
  { id: "main", title: "Principal", order: 1 },
  { id: "organization", title: "Organisation", order: 2 },
  { id: "administration", title: "Administration", order: 3 },
  { id: "applications", title: "Applications", order: 4 },
  { id: "itsm", title: "ITSM", order: 5 },
  { id: "security", title: "Sécurité", order: 6 },
  { id: "cloud", title: "Infrastructure Cloud", order: 7 },
  { id: "monitoring", title: "Supervision", order: 8 },
  { id: "admin", title: "Paramètres", order: 9 },
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
  Archive,
  Calendar,
  Search,
  Network,
  Clock,
  Bug,
  Wrench,
  Layers,
  Rocket
};