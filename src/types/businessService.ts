// Types pour la gestion des services métiers
export interface BusinessService {
  id: string;
  name: string;
  description: string | null;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  service_level: string | null;
  team_id: string;
  organization_id: string | null;
  business_owner: string | null;
  business_owner_team_id: string | null;
  technical_owner: string | null;
  technical_owner_team_id: string | null;
  application_stack: string[] | null;
  technical_stack: string[] | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface BusinessServiceWithDetails extends BusinessService {
  team?: {
    id: string;
    name: string;
    organization?: {
      id: string;
      name: string;
    };
  };
  business_owner_profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  technical_owner_profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  applications?: Application[];
  dependencies?: ServiceDependency[];
  metrics?: ServiceMetrics;
}

// Import Application from the dedicated file
import type { Application } from './application';

export interface ServiceDependency {
  id: string;
  service_id: string;
  dependent_service_id: string;
  dependency_type: 'required' | 'optional' | 'preferred';
  description: string | null;
  created_at: string;
}

export interface ServiceMetrics {
  availability: number;
  response_time: number;
  error_rate: number;
  last_incident: string | null;
  sla_compliance: number;
}

export interface BusinessServiceFormData {
  name: string;
  description: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  service_level: string;
  business_owner: string;
  business_owner_team_id: string;
  technical_owner: string;
  technical_owner_team_id: string;
  application_stack: string[];
  technical_stack: string[];
  metadata?: Record<string, any>;
}

export interface CreateBusinessServiceData extends Omit<BusinessServiceFormData, 'business_owner' | 'technical_owner'> {
  team_id: string;
  organization_id?: string;
  business_owner?: string;
  technical_owner?: string;
  created_by: string;
}

export interface UpdateBusinessServiceData extends Partial<BusinessServiceFormData> {
  id: string;
}

export interface BusinessServiceFilters {
  search?: string;
  criticality?: 'low' | 'medium' | 'high' | 'critical' | 'all';
  team_id?: string;
  business_owner?: string;
  technical_owner?: string;
  service_level?: string;
  has_applications?: boolean;
}

export interface BusinessServiceStats {
  total: number;
  by_criticality: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  by_team: Array<{
    team_id: string;
    team_name: string;
    count: number;
  }>;
  applications_coverage: {
    with_apps: number;
    without_apps: number;
  };
  sla_compliance: {
    compliant: number;
    non_compliant: number;
    average: number;
  };
} 