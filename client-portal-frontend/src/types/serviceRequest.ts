export interface ServiceRequest {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  impact: 'low' | 'medium' | 'high' | 'critical';
  service_category: string;
  resolution?: string;
  due_date?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  requested_by: string;
  assigned_to?: string;
  team_id: string;
  requested_by_profile?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  assigned_to_profile?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export type ServiceRequestStatus = ServiceRequest['status'];
export type ServiceRequestPriority = ServiceRequest['priority'];
export type ServiceRequestUrgency = ServiceRequest['urgency'];
export type ServiceRequestImpact = ServiceRequest['impact'];