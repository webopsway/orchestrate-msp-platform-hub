// Simplified types to avoid TypeScript infinite recursion errors

export interface SimplePermission {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  resource: string;
  action: string;
  created_at: string;
}

export interface SimpleRole {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface SimpleRolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  granted_at: string;
  granted_by?: string;
}

export interface SimpleUserRole {
  id: string;
  user_id: string;
  role_id: string;
  team_id?: string;
  organization_id?: string;
  granted_at: string;
  granted_by?: string;
  is_active: boolean;
}

export interface SimpleITSMItem {
  id: string;
  type: 'incident' | 'change';
  team_id: string;
  title: string;
  description?: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  metadata?: any;
}

export interface SimpleUptimeCheck {
  id: string;
  team_id: string;
  name: string;
  url: string;
  method: string;
  status: 'up' | 'down' | 'unknown';
  response_time?: number;
  status_code?: number;
  check_interval: number;
  timeout_seconds: number;
  created_at: string;
  updated_at: string;
  checked_at?: string;
  next_check?: string;
}

export interface SimpleNotificationConfig {
  id: string;
  team_id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook';
  config: Record<string, any>;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}