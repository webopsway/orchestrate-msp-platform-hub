-- Supprimer les politiques RLS qui utilisent les fonctions de session obsolètes
DROP POLICY IF EXISTS "settings_access_policy" ON public.app_settings;
DROP POLICY IF EXISTS "backup_executions_access_policy" ON public.backup_executions;
DROP POLICY IF EXISTS "cloud_asset_access_policy" ON public.cloud_asset;
DROP POLICY IF EXISTS "cloud_credentials_access_policy" ON public.cloud_credentials;
DROP POLICY IF EXISTS "documentation_access_policy" ON public.documentation;
DROP POLICY IF EXISTS "itsm_comments_access_policy" ON public.itsm_comments;
DROP POLICY IF EXISTS "notification_transports_access_policy" ON public.notification_transports;
DROP POLICY IF EXISTS "notifications_access_policy" ON public.notifications;
DROP POLICY IF EXISTS "patch_schedules_access_policy" ON public.patch_schedules;
DROP POLICY IF EXISTS "uptime_checks_access_policy" ON public.uptime_checks;

-- Supprimer les politiques spécifiques aux sessions
DROP POLICY IF EXISTS "backup_jobs_access_policy" ON public.backup_jobs;
DROP POLICY IF EXISTS "itsm_change_requests_access_policy" ON public.itsm_change_requests;
DROP POLICY IF EXISTS "itsm_incidents_access_policy" ON public.itsm_incidents;
DROP POLICY IF EXISTS "infrastructure_docs_access_policy" ON public.infrastructure_docs;
DROP POLICY IF EXISTS "monitoring_alerts_access_policy" ON public.monitoring_alerts;
DROP POLICY IF EXISTS "security_vulnerabilities_access_policy" ON public.security_vulnerabilities;

-- Supprimer les fonctions liées aux sessions
DROP FUNCTION IF EXISTS public.get_current_user_session();
DROP FUNCTION IF EXISTS public.set_user_session_context(uuid, uuid);
DROP FUNCTION IF EXISTS public.initialize_user_session(uuid, uuid);
DROP FUNCTION IF EXISTS public.set_app_session_variables(uuid, boolean);
DROP FUNCTION IF EXISTS public.get_app_session_variables();
DROP FUNCTION IF EXISTS public.test_session_variables();
DROP FUNCTION IF EXISTS public.auto_init_msp_admin_session();

-- Supprimer la table user_sessions
DROP TABLE IF EXISTS public.user_sessions;

-- Recréer les politiques RLS simplifiées basées uniquement sur le profil utilisateur
CREATE POLICY "settings_access_policy" ON public.app_settings
FOR ALL TO authenticated
USING (is_msp_admin() OR team_id IS NULL)
WITH CHECK (is_msp_admin() OR team_id IS NOT NULL);

CREATE POLICY "backup_executions_access_policy" ON public.backup_executions
FOR ALL TO authenticated
USING (is_msp_admin())
WITH CHECK (is_msp_admin());

CREATE POLICY "cloud_asset_access_policy" ON public.cloud_asset
FOR ALL TO authenticated
USING (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = cloud_asset.team_id
))
WITH CHECK (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = cloud_asset.team_id
));

CREATE POLICY "cloud_credentials_access_policy" ON public.cloud_credentials
FOR ALL TO authenticated
USING (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = cloud_credentials.team_id
))
WITH CHECK (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = cloud_credentials.team_id
));

CREATE POLICY "documentation_access_policy" ON public.documentation
FOR ALL TO authenticated
USING (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = documentation.team_id
))
WITH CHECK (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = documentation.team_id
));

CREATE POLICY "itsm_comments_access_policy" ON public.itsm_comments
FOR ALL TO authenticated
USING (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_comments.team_id
))
WITH CHECK (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_comments.team_id
));

CREATE POLICY "notification_transports_access_policy" ON public.notification_transports
FOR ALL TO authenticated
USING (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = notification_transports.team_id
))
WITH CHECK (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = notification_transports.team_id
));

CREATE POLICY "notifications_access_policy" ON public.notifications
FOR ALL TO authenticated
USING (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = notifications.team_id
))
WITH CHECK (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = notifications.team_id
));

CREATE POLICY "patch_schedules_access_policy" ON public.patch_schedules
FOR ALL TO authenticated
USING (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = patch_schedules.team_id
))
WITH CHECK (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = patch_schedules.team_id
));

CREATE POLICY "uptime_checks_access_policy" ON public.uptime_checks
FOR ALL TO authenticated
USING (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = uptime_checks.team_id
))
WITH CHECK (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = uptime_checks.team_id
));

-- Politiques simplifiées pour les autres tables
CREATE POLICY "backup_jobs_access_policy" ON public.backup_jobs
FOR ALL TO authenticated
USING (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = backup_jobs.team_id
))
WITH CHECK (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = backup_jobs.team_id
));

CREATE POLICY "itsm_change_requests_access_policy" ON public.itsm_change_requests
FOR ALL TO authenticated
USING (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_change_requests.team_id
))
WITH CHECK (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_change_requests.team_id
));

CREATE POLICY "itsm_incidents_access_policy" ON public.itsm_incidents
FOR ALL TO authenticated
USING (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_incidents.team_id
))
WITH CHECK (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_incidents.team_id
));

CREATE POLICY "infrastructure_docs_access_policy" ON public.infrastructure_docs
FOR ALL TO authenticated
USING (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = infrastructure_docs.team_id
))
WITH CHECK (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = infrastructure_docs.team_id
));

CREATE POLICY "monitoring_alerts_access_policy" ON public.monitoring_alerts
FOR ALL TO authenticated
USING (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = monitoring_alerts.team_id
))
WITH CHECK (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = monitoring_alerts.team_id
));

CREATE POLICY "security_vulnerabilities_access_policy" ON public.security_vulnerabilities
FOR ALL TO authenticated
USING (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = security_vulnerabilities.team_id
))
WITH CHECK (is_msp_admin() OR EXISTS (
  SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = security_vulnerabilities.team_id
));