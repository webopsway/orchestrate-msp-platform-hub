export interface Organization {
  id: string;
  msp_id: string;
  name: string;
  type: 'client' | 'esn' | 'msp';
  is_msp: boolean;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  subscription_plan?: string;
  subscription_status?: 'active' | 'expired' | 'cancelled';
  user_count: number;
  team_count: number;
  created_at: string;
  updated_at: string;
  metadata?: {
    industry?: string;
    size?: string;
    contact_person?: string;
    [key: string]: any;
  };
}

export interface OrganizationFormData {
  name: string;
  type?: 'client' | 'esn' | 'msp';
  is_msp?: boolean;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  subscription_plan?: string;
  industry?: string;
  size?: string;
  contact_person?: string;
}

export interface UseOrganizationsReturn {
  organizations: Organization[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refresh: () => Promise<void>;
  createOrganization: (data: OrganizationFormData) => Promise<boolean>;
  updateOrganization: (id: string, data: OrganizationFormData) => Promise<boolean>;
  deleteOrganization: (id: string) => Promise<boolean>;
  clearError: () => void;
}