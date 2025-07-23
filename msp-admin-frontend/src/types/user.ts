export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_msp_admin?: boolean;
  default_organization_id?: string;
  default_team_id?: string;
  metadata?: {
    phone?: string;
    role?: string;
    department?: string;
    position?: string;
    status?: string;
    [key: string]: any;
  };
  organization?: {
    id: string;
    name: string;
  };
  team?: {
    id: string;
    name: string;
  };
  created_at: string;
  updated_at?: string;
}

export interface CreateUserData {
  email: string;
  first_name: string;
  last_name: string;
  organization_id: string; // Obligatoire
  team_id: string; // Obligatoire
  phone?: string;
  role?: string;
  department?: string;
  position?: string;
  status?: string;
}

export interface UpdateUserData {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  department?: string;
  position?: string;
  status?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  is_msp: boolean;
  settings?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface Team {
  id: string;
  name: string;
  organization_id: string;
  description?: string;
  settings?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}
