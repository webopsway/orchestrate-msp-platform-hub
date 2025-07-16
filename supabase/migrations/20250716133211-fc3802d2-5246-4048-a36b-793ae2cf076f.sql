-- Ajouter la politique MSP admin accès total sur toutes les tables principales

-- app_settings
DROP POLICY IF EXISTS "MSP admin accès total" ON public.app_settings;
CREATE POLICY "MSP admin accès total"
  ON public.app_settings
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- backup_executions
DROP POLICY IF EXISTS "MSP admin accès total" ON public.backup_executions;
CREATE POLICY "MSP admin accès total"
  ON public.backup_executions
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- backup_jobs
DROP POLICY IF EXISTS "MSP admin accès total" ON public.backup_jobs;
CREATE POLICY "MSP admin accès total"
  ON public.backup_jobs
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- cloud_account_profiles
DROP POLICY IF EXISTS "MSP admin accès total" ON public.cloud_account_profiles;
CREATE POLICY "MSP admin accès total"
  ON public.cloud_account_profiles
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- cloud_accounts
DROP POLICY IF EXISTS "MSP admin accès total" ON public.cloud_accounts;
CREATE POLICY "MSP admin accès total"
  ON public.cloud_accounts
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- cloud_asset
DROP POLICY IF EXISTS "MSP admin accès total" ON public.cloud_asset;
CREATE POLICY "MSP admin accès total"
  ON public.cloud_asset
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- cloud_asset_configurations
DROP POLICY IF EXISTS "MSP admin accès total" ON public.cloud_asset_configurations;
CREATE POLICY "MSP admin accès total"
  ON public.cloud_asset_configurations
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- cloud_credentials
DROP POLICY IF EXISTS "MSP admin accès total" ON public.cloud_credentials;
CREATE POLICY "MSP admin accès total"
  ON public.cloud_credentials
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- cloud_installed_packages
DROP POLICY IF EXISTS "MSP admin accès total" ON public.cloud_installed_packages;
CREATE POLICY "MSP admin accès total"
  ON public.cloud_installed_packages
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- cloud_patch_status
DROP POLICY IF EXISTS "MSP admin accès total" ON public.cloud_patch_status;
CREATE POLICY "MSP admin accès total"
  ON public.cloud_patch_status
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- cloud_providers
DROP POLICY IF EXISTS "MSP admin accès total" ON public.cloud_providers;
CREATE POLICY "MSP admin accès total"
  ON public.cloud_providers
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- cloud_running_processes
DROP POLICY IF EXISTS "MSP admin accès total" ON public.cloud_running_processes;
CREATE POLICY "MSP admin accès total"
  ON public.cloud_running_processes
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- documentation
DROP POLICY IF EXISTS "MSP admin accès total" ON public.documentation;
CREATE POLICY "MSP admin accès total"
  ON public.documentation
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- infrastructure_docs
DROP POLICY IF EXISTS "MSP admin accès total" ON public.infrastructure_docs;
CREATE POLICY "MSP admin accès total"
  ON public.infrastructure_docs
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- itsm_change_requests
DROP POLICY IF EXISTS "MSP admin accès total" ON public.itsm_change_requests;
CREATE POLICY "MSP admin accès total"
  ON public.itsm_change_requests
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- itsm_comments
DROP POLICY IF EXISTS "MSP admin accès total" ON public.itsm_comments;
CREATE POLICY "MSP admin accès total"
  ON public.itsm_comments
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- itsm_configurations
DROP POLICY IF EXISTS "MSP admin accès total" ON public.itsm_configurations;
CREATE POLICY "MSP admin accès total"
  ON public.itsm_configurations
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- itsm_incidents
DROP POLICY IF EXISTS "MSP admin accès total" ON public.itsm_incidents;
CREATE POLICY "MSP admin accès total"
  ON public.itsm_incidents
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- itsm_service_requests
DROP POLICY IF EXISTS "MSP admin accès total" ON public.itsm_service_requests;
CREATE POLICY "MSP admin accès total"
  ON public.itsm_service_requests
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- itsm_sla_policies
DROP POLICY IF EXISTS "MSP admin accès total" ON public.itsm_sla_policies;
CREATE POLICY "MSP admin accès total"
  ON public.itsm_sla_policies
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- itsm_sla_tracking
DROP POLICY IF EXISTS "MSP admin accès total" ON public.itsm_sla_tracking;
CREATE POLICY "MSP admin accès total"
  ON public.itsm_sla_tracking
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- monitoring_alerts
DROP POLICY IF EXISTS "MSP admin accès total" ON public.monitoring_alerts;
CREATE POLICY "MSP admin accès total"
  ON public.monitoring_alerts
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- msp_client_relations
DROP POLICY IF EXISTS "MSP admin accès total" ON public.msp_client_relations;
CREATE POLICY "MSP admin accès total"
  ON public.msp_client_relations
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- notification_transports
DROP POLICY IF EXISTS "MSP admin accès total" ON public.notification_transports;
CREATE POLICY "MSP admin accès total"
  ON public.notification_transports
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- notifications
DROP POLICY IF EXISTS "MSP admin accès total" ON public.notifications;
CREATE POLICY "MSP admin accès total"
  ON public.notifications
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- organization_memberships
DROP POLICY IF EXISTS "MSP admin accès total" ON public.organization_memberships;
CREATE POLICY "MSP admin accès total"
  ON public.organization_memberships
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- organization_types
DROP POLICY IF EXISTS "MSP admin accès total" ON public.organization_types;
CREATE POLICY "MSP admin accès total"
  ON public.organization_types
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- organizations
DROP POLICY IF EXISTS "MSP admin accès total" ON public.organizations;
CREATE POLICY "MSP admin accès total"
  ON public.organizations
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- patch_schedules
DROP POLICY IF EXISTS "MSP admin accès total" ON public.patch_schedules;
CREATE POLICY "MSP admin accès total"
  ON public.patch_schedules
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- permissions
DROP POLICY IF EXISTS "MSP admin accès total" ON public.permissions;
CREATE POLICY "MSP admin accès total"
  ON public.permissions
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- profiles
DROP POLICY IF EXISTS "MSP admin accès total" ON public.profiles;
CREATE POLICY "MSP admin accès total"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- role_permissions
DROP POLICY IF EXISTS "MSP admin accès total" ON public.role_permissions;
CREATE POLICY "MSP admin accès total"
  ON public.role_permissions
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- roles
DROP POLICY IF EXISTS "MSP admin accès total" ON public.roles;
CREATE POLICY "MSP admin accès total"
  ON public.roles
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- security_vulnerabilities
DROP POLICY IF EXISTS "MSP admin accès total" ON public.security_vulnerabilities;
CREATE POLICY "MSP admin accès total"
  ON public.security_vulnerabilities
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- team_documents
DROP POLICY IF EXISTS "MSP admin accès total" ON public.team_documents;
CREATE POLICY "MSP admin accès total"
  ON public.team_documents
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- team_memberships
DROP POLICY IF EXISTS "MSP admin accès total" ON public.team_memberships;
CREATE POLICY "MSP admin accès total"
  ON public.team_memberships
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- teams
DROP POLICY IF EXISTS "MSP admin accès total" ON public.teams;
CREATE POLICY "MSP admin accès total"
  ON public.teams
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- uptime_checks
DROP POLICY IF EXISTS "MSP admin accès total" ON public.uptime_checks;
CREATE POLICY "MSP admin accès total"
  ON public.uptime_checks
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- user_roles
DROP POLICY IF EXISTS "MSP admin accès total" ON public.user_roles;
CREATE POLICY "MSP admin accès total"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (is_msp_admin());

-- user_roles_catalog
DROP POLICY IF EXISTS "MSP admin accès total" ON public.user_roles_catalog;
CREATE POLICY "MSP admin accès total"
  ON public.user_roles_catalog
  FOR ALL
  TO authenticated
  USING (is_msp_admin());