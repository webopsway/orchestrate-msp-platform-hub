-- Politiques RLS complètes pour MSP FULL ADMIN sur toutes les tables

-- App Settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_app_settings" ON public.app_settings FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- Backup Executions  
ALTER TABLE public.backup_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_backup_executions" ON public.backup_executions FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- Backup Jobs
ALTER TABLE public.backup_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_backup_jobs" ON public.backup_jobs FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- Cloud Account Profiles
ALTER TABLE public.cloud_account_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_cloud_account_profiles" ON public.cloud_account_profiles FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- Cloud Asset
ALTER TABLE public.cloud_asset ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_cloud_asset" ON public.cloud_asset FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- Cloud Asset Configurations
ALTER TABLE public.cloud_asset_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_cloud_asset_configurations" ON public.cloud_asset_configurations FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- Cloud Credentials
ALTER TABLE public.cloud_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_cloud_credentials" ON public.cloud_credentials FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- Cloud Installed Packages
ALTER TABLE public.cloud_installed_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_cloud_installed_packages" ON public.cloud_installed_packages FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- Cloud Patch Status
ALTER TABLE public.cloud_patch_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_cloud_patch_status" ON public.cloud_patch_status FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- Cloud Providers
ALTER TABLE public.cloud_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_cloud_providers" ON public.cloud_providers FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- Cloud Running Processes
ALTER TABLE public.cloud_running_processes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_cloud_running_processes" ON public.cloud_running_processes FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- Documentation
ALTER TABLE public.documentation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_documentation" ON public.documentation FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- Infrastructure Docs
ALTER TABLE public.infrastructure_docs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_infrastructure_docs" ON public.infrastructure_docs FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- ITSM Change Requests
ALTER TABLE public.itsm_change_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_itsm_change_requests" ON public.itsm_change_requests FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- ITSM Comments
ALTER TABLE public.itsm_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_itsm_comments" ON public.itsm_comments FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- ITSM Configurations
ALTER TABLE public.itsm_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_itsm_configurations" ON public.itsm_configurations FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- ITSM Incidents
ALTER TABLE public.itsm_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_itsm_incidents" ON public.itsm_incidents FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- ITSM SLA Policies
ALTER TABLE public.itsm_sla_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_itsm_sla_policies" ON public.itsm_sla_policies FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- ITSM SLA Tracking
ALTER TABLE public.itsm_sla_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_itsm_sla_tracking" ON public.itsm_sla_tracking FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- Monitoring Alerts
ALTER TABLE public.monitoring_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_monitoring_alerts" ON public.monitoring_alerts FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- Notification Transports
ALTER TABLE public.notification_transports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_notification_transports" ON public.notification_transports FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_notifications" ON public.notifications FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- Organization Types
ALTER TABLE public.organization_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_organization_types" ON public.organization_types FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- Patch Schedules
ALTER TABLE public.patch_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_patch_schedules" ON public.patch_schedules FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- Permissions
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_permissions" ON public.permissions FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- Role Permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_role_permissions" ON public.role_permissions FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- Roles
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_roles" ON public.roles FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- Security Vulnerabilities
ALTER TABLE public.security_vulnerabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_security_vulnerabilities" ON public.security_vulnerabilities FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- Team Documents
ALTER TABLE public.team_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_team_documents" ON public.team_documents FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- Uptime Checks
ALTER TABLE public.uptime_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_uptime_checks" ON public.uptime_checks FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- User Roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_user_roles" ON public.user_roles FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());

-- User Roles Catalog
ALTER TABLE public.user_roles_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msp_admins_full_access_user_roles_catalog" ON public.user_roles_catalog FOR ALL USING (is_msp_admin()) WITH CHECK (is_msp_admin());