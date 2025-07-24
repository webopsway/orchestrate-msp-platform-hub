export interface Incident {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: string;
  created_by: string;
  team_id?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  metadata?: any;
  created_by_profile?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  assigned_to_profile?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export interface CreateIncidentData {
  title: string;
  description: string;
  priority: Incident['priority'];
  status?: Incident['status'];
  assigned_to?: string;
}

export interface UpdateIncidentData {
  title?: string;
  description?: string;
  priority?: Incident['priority'];
  status?: Incident['status'];
  assigned_to?: string;
  resolved_at?: string;
} 