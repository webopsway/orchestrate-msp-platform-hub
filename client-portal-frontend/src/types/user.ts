export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
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
  created_at: string;
  updated_at?: string;
}

export interface UserCreateData {
  id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  organization_id: string; // Obligatoire
  team_id: string; // Obligatoire
  department?: string;
  position?: string;
  status?: string;
}

export interface UserUpdateData {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  organization_id?: string;
  team_id?: string;
  department?: string;
  position?: string;
  status?: string;
  metadata?: Record<string, any>;
}
