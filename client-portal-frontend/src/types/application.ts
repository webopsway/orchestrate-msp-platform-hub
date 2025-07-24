// Types pour la gestion des applications
export interface Application {
  id: string;
  name: string;
  description: string | null;
  application_type: string;
  version: string | null;
  technology_stack: string[] | null;
  business_services: string[] | null;
  repository_url: string | null;
  documentation_url: string | null;
  team_id: string;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ApplicationWithDetails extends Application {
  team?: {
    id: string;
    name: string;
    organization?: {
      id: string;
      name: string;
    };
  };
  created_by_profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  business_services_details?: BusinessServiceSummary[];
  deployments?: ApplicationDeployment[];
  dependencies?: ApplicationDependency[];
  metrics?: ApplicationMetrics;
}

export interface BusinessServiceSummary {
  id: string;
  name: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  service_level: string | null;
}

export interface ApplicationDeployment {
  id: string;
  application_id: string;
  cloud_asset_id: string;
  environment_name: string;
  deployment_type: string;
  status: string;
  version: string | null;
  deployed_by: string;
  deployment_date: string;
  health_check_url: string | null;
  configuration: Record<string, any> | null;
  metadata: Record<string, any> | null;
  team_id: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationDeploymentWithDetails extends ApplicationDeployment {
  application?: {
    id: string;
    name: string;
    application_type: string;
  };
  cloud_asset?: {
    id: string;
    asset_name: string | null;
    asset_type: string | null;
    region: string | null;
  };
  deployed_by_profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

export interface ApplicationDependency {
  id: string;
  application_id: string;
  business_service_id: string;
  dependency_type: string;
  description: string | null;
  created_at: string;
}

export interface ApplicationMetrics {
  uptime: number;
  response_time: number;
  error_rate: number;
  deployment_frequency: number;
  last_deployment: string | null;
  health_score: number;
}

export interface ApplicationFormData {
  name: string;
  description: string;
  application_type: string;
  version: string;
  technology_stack: string[];
  business_services: string[];
  repository_url: string;
  documentation_url: string;
  metadata?: Record<string, any>;
}

export interface CreateApplicationData extends Omit<ApplicationFormData, 'business_services'> {
  team_id: string;
  business_services?: string[];
  created_by: string;
}

export interface UpdateApplicationData extends Partial<ApplicationFormData> {
  id: string;
}

export interface ApplicationFilters {
  search?: string;
  application_type?: string;
  team_id?: string;
  business_services?: string[];
  technology_stack?: string[];
  deployment_status?: string;
  has_business_services?: boolean;
  version?: string;
}

export interface ApplicationStats {
  total: number;
  by_type: Record<string, number>;
  by_team: Array<{
    team_id: string;
    team_name: string;
    count: number;
  }>;
  by_technology: Array<{
    technology: string;
    count: number;
  }>;
  deployment_stats: {
    total_deployments: number;
    active_environments: number;
    recent_deployments: number;
  };
  business_services_coverage: {
    with_services: number;
    without_services: number;
  };
  health_metrics: {
    healthy: number;
    warning: number;
    critical: number;
    unknown: number;
  };
}

export interface ApplicationEnvironment {
  name: string;
  type: 'development' | 'staging' | 'production' | 'testing';
  url?: string;
  status: 'active' | 'inactive' | 'maintenance';
  last_deployment?: string;
  version?: string;
}

// Types pour les templates d'applications
export interface ApplicationTemplate {
  id: string;
  name: string;
  description: string;
  application_type: string;
  default_technology_stack: string[];
  default_configuration: Record<string, any>;
  template_fields: ApplicationTemplateField[];
}

export interface ApplicationTemplateField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  default_value?: any;
  options?: string[];
}

// Types pour l'import/export
export interface ApplicationImportData {
  applications: Omit<Application, 'id' | 'created_at' | 'updated_at' | 'created_by'>[];
  validate_before_import: boolean;
  update_existing: boolean;
}

export interface ApplicationExportData {
  applications: Application[];
  metadata: {
    export_date: string;
    team_id: string;
    total_count: number;
  };
}

// Types pour les déploiements
export interface CreateDeploymentData {
  application_id: string;
  cloud_asset_id: string;
  environment_name: string;
  deployment_type: string;
  status: string;
  version?: string;
  health_check_url?: string;
  configuration?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface UpdateDeploymentData extends Partial<CreateDeploymentData> {
  id: string;
}

export interface DeploymentFilters {
  search?: string;
  application_id?: string;
  environment_name?: string;
  status?: string;
  deployment_type?: string;
  cloud_asset_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface DeploymentStats {
  total: number;
  by_environment: Record<string, number>;
  by_status: Record<string, number>;
  by_application: Array<{
    application_id: string;
    application_name: string;
    count: number;
  }>;
  recent_deployments: number;
  success_rate: number;
  avg_deployment_time: number;
  active_environments: number;
}

// Types pour les Cloud Assets (nécessaires pour les déploiements)
export interface CloudAsset {
  id: string;
  asset_id: string;
  asset_name: string | null;
  asset_type: string | null;
  cloud_provider_id: string;
  region: string | null;
  status: string | null;
  team_id: string;
  metadata: Record<string, any> | null;
  tags: Record<string, any> | null;
  discovered_at: string | null;
  last_scan: string | null;
}

export interface CloudAssetSummary {
  id: string;
  asset_name: string | null;
  asset_type: string | null;
  region: string | null;
  status: string | null;
} 