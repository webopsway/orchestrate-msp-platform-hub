export interface Change {
  id: string;
  title: string;
  description: string;
  change_type: 'emergency' | 'standard' | 'normal';
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'implemented' | 'failed';
  requested_by: string;
  approved_by?: string;
  assigned_to?: string;
  team_id?: string;
  created_at: string;
  updated_at: string;
  scheduled_date?: string;
  metadata?: any;
  requested_by_profile?: {
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
  approved_by_profile?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export interface CreateChangeData {
  title: string;
  description: string;
  change_type: Change['change_type'];
  status?: Change['status'];
  assigned_to?: string;
  scheduled_date?: string;
}

export interface UpdateChangeData {
  title?: string;
  description?: string;
  change_type?: Change['change_type'];
  status?: Change['status'];
  assigned_to?: string;
  approved_by?: string;
  scheduled_date?: string;
} 