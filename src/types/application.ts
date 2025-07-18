// Types pour la gestion des applications et services métiers

export interface BusinessService {
  id: string;
  name: string;
  description?: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  organization_id: string;
  business_owner_team_id?: string;
  technical_owner_team_id?: string;
  application_stack?: string[]; // IDs des applications
  technical_stack?: string[]; // IDs des cloud assets
  business_owner?: string;
  technical_owner?: string;
  service_level?: string;
  dependencies: ApplicationDependency[];
  metadata?: Record<string, any>;
  team_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Application {
  id: string;
  name: string;
  description?: string;
  version?: string;
  application_type: 'web' | 'mobile' | 'desktop' | 'service' | 'api' | 'database' | 'other';
  technology_stack?: string[];
  repository_url?: string;
  documentation_url?: string;
  business_services: string[]; // IDs des services métiers
  deployments: ApplicationDeployment[];
  metadata?: Record<string, any>;
  team_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ApplicationDependency {
  id: string;
  business_service_id: string;
  application_id: string;
  dependency_type: 'strong' | 'weak' | 'optional';
  description?: string;
  created_at: string;
}

export interface ApplicationDeployment {
  id: string;
  application_id: string;
  cloud_asset_id: string;
  environment_name: string;
  deployment_type: 'production' | 'staging' | 'development' | 'test';
  status: 'running' | 'stopped' | 'deploying' | 'error';
  version?: string;
  configuration?: Record<string, any>;
  health_check_url?: string;
  deployment_date: string;
  metadata?: Record<string, any>;
  team_id: string;
  created_at: string;
  updated_at: string;
  deployed_by: string;
}

// Types pour les formulaires de création/modification
export interface CreateBusinessServiceData {
  name: string;
  description?: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  organization_id: string;
  business_owner_team_id?: string;
  technical_owner_team_id?: string;
  application_stack?: string[];
  technical_stack?: string[];
  business_owner?: string;
  technical_owner?: string;
  service_level?: string;
  metadata?: Record<string, any>;
}

export interface CreateApplicationData {
  name: string;
  description?: string;
  version?: string;
  application_type: 'web' | 'mobile' | 'desktop' | 'service' | 'api' | 'database' | 'other';
  technology_stack?: string[];
  repository_url?: string;
  documentation_url?: string;
  business_services?: string[];
  metadata?: Record<string, any>;
}

export interface CreateApplicationDeploymentData {
  application_id: string;
  cloud_asset_id: string;
  environment_name: string;
  deployment_type: 'production' | 'staging' | 'development' | 'test';
  status: 'running' | 'stopped' | 'deploying' | 'error';
  version?: string;
  configuration?: Record<string, any>;
  health_check_url?: string;
  deployment_date: string;
  metadata?: Record<string, any>;
}

// Types pour les filtres
export interface BusinessServiceFilters {
  search?: string;
  criticality?: string;
  business_owner?: string;
  technical_owner?: string;
}

export interface ApplicationFilters {
  search?: string;
  application_type?: string;
  technology_stack?: string;
  business_service?: string;
}

export interface ApplicationDeploymentFilters {
  search?: string;
  application_id?: string;
  environment_name?: string;
  deployment_type?: string;
  status?: string;
}

// Types pour les statistiques
export interface ApplicationStats {
  total_business_services: number;
  total_applications: number;
  total_deployments: number;
  applications_by_type: Record<string, number>;
  deployments_by_environment: Record<string, number>;
  critical_services: number;
}