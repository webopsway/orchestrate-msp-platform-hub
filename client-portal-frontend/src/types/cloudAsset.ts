// Types pour la gestion des actifs cloud et de la sécurité

export interface CloudAssetConfiguration {
  id: string;
  asset_id: string;
  team_id: string;
  os?: string;
  cpu?: string;
  ram?: string;
  ip?: string;
  metadata?: Record<string, any>;
  collected_at: string;
  created_at: string;
  updated_at: string;
}

export interface CloudInstalledPackage {
  id: string;
  asset_id: string;
  team_id: string;
  package_name: string;
  version?: string;
  source?: string;
  metadata?: Record<string, any>;
  collected_at: string;
  created_at: string;
  updated_at: string;
}

export interface CloudRunningProcess {
  id: string;
  asset_id: string;
  team_id: string;
  process_name: string;
  pid?: number;
  path?: string;
  metadata?: Record<string, any>;
  collected_at: string;
  created_at: string;
  updated_at: string;
}

export type PatchStatus = 'applied' | 'pending' | 'not_available' | 'unknown';

export interface CloudPatchStatus {
  id: string;
  asset_id: string;
  team_id: string;
  patch_name?: string;
  cve_id?: string;
  status: PatchStatus;
  metadata?: Record<string, any>;
  collected_at: string;
  created_at: string;
  updated_at: string;
}

export interface SecurityVulnerability {
  id: string;
  team_id: string;
  title: string;
  cve_id?: string;
  severity: string;
  cvss_score?: number;
  description?: string;
  published_at?: string;
  refs?: string[];
  source?: string;
  status?: string;
  assigned_to?: string;
  cloud_asset_id?: string;
  affected_instances?: string[];
  remediated_at?: string;
  discovered_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Types pour les données de création
export interface CreateCloudAssetConfigurationData {
  asset_id: string;
  team_id: string;
  os?: string;
  cpu?: string;
  ram?: string;
  ip?: string;
  metadata?: Record<string, any>;
}

export interface CreateCloudInstalledPackageData {
  asset_id: string;
  team_id: string;
  package_name: string;
  version?: string;
  source?: string;
  metadata?: Record<string, any>;
}

export interface CreateCloudRunningProcessData {
  asset_id: string;
  team_id: string;
  process_name: string;
  pid?: number;
  path?: string;
  metadata?: Record<string, any>;
}

export interface CreateCloudPatchStatusData {
  asset_id: string;
  team_id: string;
  patch_name?: string;
  cve_id?: string;
  status: PatchStatus;
  metadata?: Record<string, any>;
}

export interface CreateSecurityVulnerabilityData {
  team_id: string;
  title: string;
  cve_id?: string;
  severity: string;
  cvss_score?: number;
  description?: string;
  published_at?: string;
  refs?: string[];
  source?: string;
  status?: string;
  assigned_to?: string;
  cloud_asset_id?: string;
  affected_instances?: string[];
  metadata?: Record<string, any>;
}

// Types pour les données de mise à jour
export interface UpdateCloudAssetConfigurationData {
  os?: string;
  cpu?: string;
  ram?: string;
  ip?: string;
  metadata?: Record<string, any>;
}

export interface UpdateCloudInstalledPackageData {
  package_name?: string;
  version?: string;
  source?: string;
  metadata?: Record<string, any>;
}

export interface UpdateCloudRunningProcessData {
  process_name?: string;
  pid?: number;
  path?: string;
  metadata?: Record<string, any>;
}

export interface UpdateCloudPatchStatusData {
  patch_name?: string;
  cve_id?: string;
  status?: PatchStatus;
  metadata?: Record<string, any>;
}

export interface UpdateSecurityVulnerabilityData {
  severity?: string;
  cvss_score?: number;
  description?: string;
  published_at?: string;
  refs?: string[];
  source?: string;
  metadata?: Record<string, any>;
}

// Types pour les filtres
export interface CloudAssetConfigurationFilters {
  asset_id?: string;
  team_id?: string;
  os?: string;
  collected_after?: string;
  collected_before?: string;
}

export interface CloudInstalledPackageFilters {
  asset_id?: string;
  team_id?: string;
  package_name?: string;
  source?: string;
  collected_after?: string;
  collected_before?: string;
}

export interface CloudRunningProcessFilters {
  asset_id?: string;
  team_id?: string;
  process_name?: string;
  collected_after?: string;
  collected_before?: string;
}

export interface CloudPatchStatusFilters {
  asset_id?: string;
  team_id?: string;
  cve_id?: string;
  status?: PatchStatus;
  collected_after?: string;
  collected_before?: string;
}

export interface SecurityVulnerabilityFilters {
  severity?: string;
  cvss_score_min?: number;
  cvss_score_max?: number;
  published_after?: string;
  published_before?: string;
  source?: string;
}

// Types pour les statistiques
export interface CloudAssetStats {
  total_assets: number;
  assets_by_os: Record<string, number>;
  assets_by_status: Record<string, number>;
  recent_configurations: number;
  outdated_patches: number;
  critical_vulnerabilities: number;
}

export interface SecurityStats {
  total_vulnerabilities: number;
  vulnerabilities_by_severity: Record<string, number>;
  vulnerabilities_by_source: Record<string, number>;
  recent_vulnerabilities: number;
  average_cvss_score: number;
  patched_vulnerabilities: number;
}

// Types pour les rapports
export interface AssetInventoryReport {
  asset_id: string;
  asset_name: string;
  os: string;
  cpu: string;
  ram: string;
  ip: string;
  packages_count: number;
  processes_count: number;
  patches_applied: number;
  patches_pending: number;
  vulnerabilities_count: number;
  last_updated: string;
}

export interface SecurityReport {
  cve_id: string;
  severity: string;
  cvss_score: number;
  description: string;
  affected_assets: number;
  patched_assets: number;
  published_at: string;
  status: 'critical' | 'high' | 'medium' | 'low' | 'info';
} 