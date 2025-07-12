-- Recréer toutes les politiques RLS basées uniquement sur le profil utilisateur et les team_memberships

-- Politiques pour app_settings
CREATE POLICY "settings_access_policy" ON public.app_settings
FOR ALL TO authenticated
USING (is_msp_admin() OR team_id IS NULL)
WITH CHECK (is_msp_admin() OR team_id IS NOT NULL);

-- Politiques pour backup_executions (uniquement MSP admins)
CREATE POLICY "backup_executions_access_policy" ON public.backup_executions
FOR ALL TO authenticated
USING (is_msp_admin())
WITH CHECK (is_msp_admin());

-- Politiques pour les tables avec team_id
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

-- Recréer les politiques pour itsm_service_requests
CREATE POLICY "itsm_service_requests_read_policy" ON public.itsm_service_requests
FOR SELECT TO authenticated
USING (
  is_msp_admin() OR 
  EXISTS (
    SELECT 1 FROM team_memberships tm 
    WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_service_requests.team_id
  )
);

CREATE POLICY "itsm_service_requests_insert_policy" ON public.itsm_service_requests
FOR INSERT TO authenticated
WITH CHECK (
  is_msp_admin() OR 
  EXISTS (
    SELECT 1 FROM team_memberships tm 
    WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_service_requests.team_id
  )
);

CREATE POLICY "itsm_service_requests_update_policy" ON public.itsm_service_requests
FOR UPDATE TO authenticated
USING (
  is_msp_admin() OR 
  EXISTS (
    SELECT 1 FROM team_memberships tm 
    WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_service_requests.team_id
  )
);

CREATE POLICY "itsm_service_requests_delete_policy" ON public.itsm_service_requests
FOR DELETE TO authenticated
USING (is_msp_admin());