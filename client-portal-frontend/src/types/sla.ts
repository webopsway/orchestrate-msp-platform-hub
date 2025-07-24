export interface SLAPolicy {
  id: string;
  name: string;
  client_type: 'direct' | 'via_esn' | 'all';
  client_organization_id?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  ticket_category?: string;
  response_time_hours: number;
  resolution_time_hours: number;
  escalation_time_hours?: number;
  escalation_to?: string;
  is_active: boolean;
  description?: string;
  team_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreateSLAPolicyData {
  name: string;
  client_type: 'direct' | 'via_esn' | 'all';
  client_organization_id?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  ticket_category?: string;
  response_time_hours: number;
  resolution_time_hours: number;
  escalation_time_hours?: number;
  escalation_to?: string;
  is_active: boolean;
  description?: string;
}

export interface UpdateSLAPolicyData extends Partial<CreateSLAPolicyData> {}

export interface SLAPolicyFilters {
  client_type?: 'direct' | 'via_esn' | 'all';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  is_active?: boolean;
  client_organization_id?: string;
}