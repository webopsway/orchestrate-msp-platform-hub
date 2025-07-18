// Types pour les configurations de dashboard configurable

export interface DashboardWidget {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  widget_type: 'stats' | 'chart' | 'table' | 'custom';
  default_config: Record<string, any>;
  is_system_widget: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface DashboardConfiguration {
  id: string;
  name: string;
  description?: string;
  team_id?: string;
  organization_id?: string;
  is_default: boolean;
  is_active: boolean;
  layout_config: Record<string, any>;
  widgets: DashboardWidgetPosition[];
  created_by?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface DashboardWidgetPosition {
  id: string; // widget name or id
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  config?: Record<string, any>; // Configuration spécifique à cette instance du widget
}

export interface CreateDashboardConfigurationData {
  name: string;
  description?: string;
  team_id?: string;
  organization_id?: string;
  is_default?: boolean;
  layout_config?: Record<string, any>;
  widgets: DashboardWidgetPosition[];
  metadata?: Record<string, any>;
}

export interface DashboardStats {
  organizations: number;
  users: number;
  incidents: number;
  services: number;
}

export interface DashboardContextType {
  dashboardConfig: DashboardConfiguration | null;
  widgets: DashboardWidget[];
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
}