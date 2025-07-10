-- Création d'une fonction de sécurité pour vérifier si l'utilisateur est MSP Admin
CREATE OR REPLACE FUNCTION public.is_msp_admin()
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_msp_admin FROM public.profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

-- Fonction pour vérifier si l'utilisateur est dans une organisation MSP
CREATE OR REPLACE FUNCTION public.is_user_in_msp_organization()
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_memberships om
    JOIN public.organizations o ON o.id = om.organization_id
    WHERE om.user_id = auth.uid() 
    AND o.is_msp = TRUE
  );
$$;

-- Mise à jour des politiques RLS pour toutes les tables

-- 1. app_settings
DROP POLICY IF EXISTS "settings_isolation" ON public.app_settings;
CREATE POLICY "settings_access_policy" ON public.app_settings
FOR ALL USING (
  public.is_msp_admin() OR
  (COALESCE((current_setting('app.is_msp'::text, true))::boolean, false) = true) OR 
  (team_id = COALESCE((current_setting('app.current_team'::text, true))::uuid, '00000000-0000-0000-0000-000000000000'::uuid)) OR 
  (team_id IS NULL)
)
WITH CHECK (
  public.is_msp_admin() OR
  (COALESCE((current_setting('app.is_msp'::text, true))::boolean, false) = true) OR 
  ((team_id IS NOT NULL) AND (team_id = COALESCE((current_setting('app.current_team'::text, true))::uuid, '00000000-0000-0000-0000-000000000000'::uuid)))
);

-- 2. backup_executions
DROP POLICY IF EXISTS "backup_executions_team_isolation" ON public.backup_executions;
CREATE POLICY "backup_executions_access_policy" ON public.backup_executions
FOR ALL USING (
  public.is_msp_admin() OR
  (COALESCE((current_setting('app.is_msp'::text, true))::boolean, false) = true) OR 
  (team_id = COALESCE((current_setting('app.current_team'::text, true))::uuid, '00000000-0000-0000-0000-000000000000'::uuid))
)
WITH CHECK (
  public.is_msp_admin() OR
  (COALESCE((current_setting('app.is_msp'::text, true))::boolean, false) = true) OR 
  (team_id = COALESCE((current_setting('app.current_team'::text, true))::uuid, '00000000-0000-0000-0000-000000000000'::uuid))
);

-- 3. backup_jobs
DROP POLICY IF EXISTS "Users can access backup jobs from their current team context" ON public.backup_jobs;
CREATE POLICY "backup_jobs_access_policy" ON public.backup_jobs
FOR ALL USING (
  public.is_msp_admin() OR
  (team_id = (SELECT get_current_user_session.current_team_id FROM get_current_user_session() LIMIT 1))
);

-- 4. cloud_asset
DROP POLICY IF EXISTS "Users can access cloud instances from their current team contex" ON public.cloud_asset;
DROP POLICY IF EXISTS "cloud_asset_manager_scope" ON public.cloud_asset;
DROP POLICY IF EXISTS "cloud_asset_team_isolation" ON public.cloud_asset;
CREATE POLICY "cloud_asset_access_policy" ON public.cloud_asset
FOR ALL USING (
  public.is_msp_admin() OR
  (COALESCE((current_setting('app.is_msp'::text, true))::boolean, false) = true) OR 
  (team_id = COALESCE((current_setting('app.current_team'::text, true))::uuid, '00000000-0000-0000-0000-000000000000'::uuid)) OR
  (EXISTS (
    SELECT 1
    FROM organization_memberships om
    JOIN teams t ON om.organization_id = t.organization_id
    WHERE om.user_id = auth.uid() 
    AND om.role IN ('admin', 'manager') 
    AND t.id = cloud_asset.team_id
  ))
)
WITH CHECK (
  public.is_msp_admin() OR
  (COALESCE((current_setting('app.is_msp'::text, true))::boolean, false) = true) OR 
  (team_id = COALESCE((current_setting('app.current_team'::text, true))::uuid, '00000000-0000-0000-0000-000000000000'::uuid))
);

-- 5. cloud_credentials
DROP POLICY IF EXISTS "creds_manager_scope" ON public.cloud_credentials;
DROP POLICY IF EXISTS "creds_msp_access" ON public.cloud_credentials;
DROP POLICY IF EXISTS "creds_team_isolation" ON public.cloud_credentials;
CREATE POLICY "cloud_credentials_access_policy" ON public.cloud_credentials
FOR ALL USING (
  public.is_msp_admin() OR
  (COALESCE((current_setting('app.is_msp'::text, true))::boolean, false) = true) OR 
  (team_id = COALESCE((current_setting('app.current_team'::text, true))::uuid, '00000000-0000-0000-0000-000000000000'::uuid)) OR
  (EXISTS (
    SELECT 1
    FROM organization_memberships om
    JOIN teams t ON om.organization_id = t.organization_id
    WHERE om.user_id = auth.uid() 
    AND om.role IN ('admin', 'manager') 
    AND t.id = cloud_credentials.team_id
  ))
)
WITH CHECK (
  public.is_msp_admin() OR
  (COALESCE((current_setting('app.is_msp'::text, true))::boolean, false) = true) OR 
  (team_id = COALESCE((current_setting('app.current_team'::text, true))::uuid, '00000000-0000-0000-0000-000000000000'::uuid))
);

-- 6. cloud_providers (MSP admin only pour la gestion)
DROP POLICY IF EXISTS "All authenticated users can view cloud providers" ON public.cloud_providers;
DROP POLICY IF EXISTS "MSP admins can manage cloud providers" ON public.cloud_providers;
CREATE POLICY "cloud_providers_read_policy" ON public.cloud_providers
FOR SELECT USING (
  public.is_msp_admin() OR
  (is_active = true)
);
CREATE POLICY "cloud_providers_write_policy" ON public.cloud_providers
FOR INSERT, UPDATE, DELETE USING (
  public.is_msp_admin()
);

-- 7. documentation
DROP POLICY IF EXISTS "docs_manager_scope" ON public.documentation;
DROP POLICY IF EXISTS "docs_msp_access" ON public.documentation;
DROP POLICY IF EXISTS "docs_team_isolation" ON public.documentation;
CREATE POLICY "documentation_access_policy" ON public.documentation
FOR ALL USING (
  public.is_msp_admin() OR
  (COALESCE((current_setting('app.is_msp'::text, true))::boolean, false) = true) OR 
  (team_id = COALESCE((current_setting('app.current_team'::text, true))::uuid, '00000000-0000-0000-0000-000000000000'::uuid)) OR
  (EXISTS (
    SELECT 1
    FROM organization_memberships om
    JOIN teams t ON om.organization_id = t.organization_id
    WHERE om.user_id = auth.uid() 
    AND om.role IN ('admin', 'manager') 
    AND t.id = documentation.team_id
  ))
)
WITH CHECK (
  public.is_msp_admin() OR
  (COALESCE((current_setting('app.is_msp'::text, true))::boolean, false) = true) OR 
  (team_id = COALESCE((current_setting('app.current_team'::text, true))::uuid, '00000000-0000-0000-0000-000000000000'::uuid))
);

-- 8. infrastructure_docs
DROP POLICY IF EXISTS "Users can access documentation from their current team context" ON public.infrastructure_docs;
CREATE POLICY "infrastructure_docs_access_policy" ON public.infrastructure_docs
FOR ALL USING (
  public.is_msp_admin() OR
  (team_id = (SELECT get_current_user_session.current_team_id FROM get_current_user_session() LIMIT 1))
);

-- 9. itsm_change_requests
DROP POLICY IF EXISTS "Users can access change requests from their current team contex" ON public.itsm_change_requests;
CREATE POLICY "itsm_change_requests_access_policy" ON public.itsm_change_requests
FOR ALL USING (
  public.is_msp_admin() OR
  (team_id = (SELECT get_current_user_session.current_team_id FROM get_current_user_session() LIMIT 1))
);

-- 10. itsm_incidents
DROP POLICY IF EXISTS "Users can access incidents from their current team context" ON public.itsm_incidents;
CREATE POLICY "itsm_incidents_access_policy" ON public.itsm_incidents
FOR ALL USING (
  public.is_msp_admin() OR
  (team_id = (SELECT get_current_user_session.current_team_id FROM get_current_user_session() LIMIT 1))
);

-- 11. monitoring_alerts
DROP POLICY IF EXISTS "Users can access monitoring alerts from their current team cont" ON public.monitoring_alerts;
CREATE POLICY "monitoring_alerts_access_policy" ON public.monitoring_alerts
FOR ALL USING (
  public.is_msp_admin() OR
  (team_id = (SELECT get_current_user_session.current_team_id FROM get_current_user_session() LIMIT 1))
);

-- 12. notification_transports
DROP POLICY IF EXISTS "transports_manager_scope" ON public.notification_transports;
DROP POLICY IF EXISTS "transports_msp_access" ON public.notification_transports;
DROP POLICY IF EXISTS "transports_team_isolation" ON public.notification_transports;
CREATE POLICY "notification_transports_access_policy" ON public.notification_transports
FOR ALL USING (
  public.is_msp_admin() OR
  (COALESCE((current_setting('app.is_msp'::text, true))::boolean, false) = true) OR 
  (team_id = COALESCE((current_setting('app.current_team'::text, true))::uuid, '00000000-0000-0000-0000-000000000000'::uuid)) OR
  (EXISTS (
    SELECT 1
    FROM organization_memberships om
    JOIN teams t ON om.organization_id = t.organization_id
    WHERE om.user_id = auth.uid() 
    AND om.role IN ('admin', 'manager') 
    AND t.id = notification_transports.team_id
  ))
)
WITH CHECK (
  public.is_msp_admin() OR
  (COALESCE((current_setting('app.is_msp'::text, true))::boolean, false) = true) OR 
  (team_id = COALESCE((current_setting('app.current_team'::text, true))::uuid, '00000000-0000-0000-0000-000000000000'::uuid))
);

-- 13. notifications
DROP POLICY IF EXISTS "notifications_manager_scope" ON public.notifications;
DROP POLICY IF EXISTS "notifications_msp_access" ON public.notifications;
DROP POLICY IF EXISTS "notifications_team_isolation" ON public.notifications;
CREATE POLICY "notifications_access_policy" ON public.notifications
FOR ALL USING (
  public.is_msp_admin() OR
  (COALESCE((current_setting('app.is_msp'::text, true))::boolean, false) = true) OR 
  (team_id = COALESCE((current_setting('app.current_team'::text, true))::uuid, '00000000-0000-0000-0000-000000000000'::uuid)) OR
  (EXISTS (
    SELECT 1
    FROM organization_memberships om
    JOIN teams t ON om.organization_id = t.organization_id
    WHERE om.user_id = auth.uid() 
    AND om.role IN ('admin', 'manager') 
    AND t.id = notifications.team_id
  ))
)
WITH CHECK (
  public.is_msp_admin() OR
  (COALESCE((current_setting('app.is_msp'::text, true))::boolean, false) = true) OR 
  (team_id = COALESCE((current_setting('app.current_team'::text, true))::uuid, '00000000-0000-0000-0000-000000000000'::uuid))
);

-- 14. organization_memberships
DROP POLICY IF EXISTS "Users can view memberships for organizations they belong to" ON public.organization_memberships;
CREATE POLICY "organization_memberships_access_policy" ON public.organization_memberships
FOR ALL USING (
  public.is_msp_admin() OR
  (user_id = auth.uid()) OR 
  user_has_organization_access(organization_id)
);

-- 15. organizations
DROP POLICY IF EXISTS "MSP admins can manage all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view organizations they belong to or MSP admins can v" ON public.organizations;
CREATE POLICY "organizations_read_policy" ON public.organizations
FOR SELECT USING (
  public.is_msp_admin() OR
  user_has_organization_access(id)
);
CREATE POLICY "organizations_write_policy" ON public.organizations
FOR INSERT, UPDATE, DELETE USING (
  public.is_msp_admin() OR
  (EXISTS (
    SELECT 1
    FROM organization_memberships om
    WHERE om.user_id = auth.uid() 
    AND om.organization_id = organizations.id 
    AND om.role IN ('admin', 'manager')
  ))
);

-- 16. patch_schedules
DROP POLICY IF EXISTS "patch_schedules_manager_scope" ON public.patch_schedules;
DROP POLICY IF EXISTS "patch_schedules_msp_access" ON public.patch_schedules;
DROP POLICY IF EXISTS "patch_schedules_team_isolation" ON public.patch_schedules;
CREATE POLICY "patch_schedules_access_policy" ON public.patch_schedules
FOR ALL USING (
  public.is_msp_admin() OR
  (COALESCE((current_setting('app.is_msp'::text, true))::boolean, false) = true) OR 
  (team_id = COALESCE((current_setting('app.current_team'::text, true))::uuid, '00000000-0000-0000-0000-000000000000'::uuid)) OR
  (EXISTS (
    SELECT 1
    FROM organization_memberships om
    JOIN teams t ON om.organization_id = t.organization_id
    WHERE om.user_id = auth.uid() 
    AND om.role IN ('admin', 'manager') 
    AND t.id = patch_schedules.team_id
  ))
)
WITH CHECK (
  public.is_msp_admin() OR
  (COALESCE((current_setting('app.is_msp'::text, true))::boolean, false) = true) OR 
  (team_id = COALESCE((current_setting('app.current_team'::text, true))::uuid, '00000000-0000-0000-0000-000000000000'::uuid))
);

-- 17. permissions (lecture publique, écriture MSP admin uniquement)
DROP POLICY IF EXISTS "Anyone can view permissions" ON public.permissions;
DROP POLICY IF EXISTS "MSP admins can manage permissions" ON public.permissions;
CREATE POLICY "permissions_read_policy" ON public.permissions
FOR SELECT USING (TRUE);
CREATE POLICY "permissions_write_policy" ON public.permissions
FOR INSERT, UPDATE, DELETE USING (
  public.is_msp_admin()
);

-- 18. profiles
DROP POLICY IF EXISTS "MSP admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "profiles_read_policy" ON public.profiles
FOR SELECT USING (
  public.is_msp_admin() OR
  (id = auth.uid())
);
CREATE POLICY "profiles_write_policy" ON public.profiles
FOR UPDATE USING (
  public.is_msp_admin() OR
  (id = auth.uid())
);

-- 19. role_permissions (lecture publique, écriture MSP admin uniquement)
DROP POLICY IF EXISTS "Anyone can view role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "MSP admins can manage role permissions" ON public.role_permissions;
CREATE POLICY "role_permissions_read_policy" ON public.role_permissions
FOR SELECT USING (TRUE);
CREATE POLICY "role_permissions_write_policy" ON public.role_permissions
FOR INSERT, UPDATE, DELETE USING (
  public.is_msp_admin()
);

-- 20. roles (lecture publique, écriture MSP admin uniquement)
DROP POLICY IF EXISTS "Anyone can view roles" ON public.roles;
DROP POLICY IF EXISTS "MSP admins can manage roles" ON public.roles;
CREATE POLICY "roles_read_policy" ON public.roles
FOR SELECT USING (TRUE);
CREATE POLICY "roles_write_policy" ON public.roles
FOR INSERT, UPDATE, DELETE USING (
  public.is_msp_admin()
);

-- 21. security_vulnerabilities
DROP POLICY IF EXISTS "Users can access vulnerabilities from their current team contex" ON public.security_vulnerabilities;
CREATE POLICY "security_vulnerabilities_access_policy" ON public.security_vulnerabilities
FOR ALL USING (
  public.is_msp_admin() OR
  (team_id = (SELECT get_current_user_session.current_team_id FROM get_current_user_session() LIMIT 1))
);

-- 22. team_memberships
DROP POLICY IF EXISTS "Users can view memberships for teams they belong to" ON public.team_memberships;
CREATE POLICY "team_memberships_access_policy" ON public.team_memberships
FOR ALL USING (
  public.is_msp_admin() OR
  (user_id = auth.uid()) OR 
  user_has_team_access(team_id)
);

-- 23. teams
DROP POLICY IF EXISTS "Organization admins and MSP admins can manage teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view teams they belong to or have organization access" ON public.teams;
CREATE POLICY "teams_read_policy" ON public.teams
FOR SELECT USING (
  public.is_msp_admin() OR
  user_has_team_access(id) OR 
  user_has_organization_access(organization_id)
);
CREATE POLICY "teams_write_policy" ON public.teams
FOR INSERT, UPDATE, DELETE USING (
  public.is_msp_admin() OR
  (EXISTS (
    SELECT 1
    FROM organization_memberships om
    WHERE om.user_id = auth.uid() 
    AND om.organization_id = teams.organization_id 
    AND om.role IN ('admin', 'manager')
  ))
);

-- 24. uptime_checks
DROP POLICY IF EXISTS "uptime_checks_manager_scope" ON public.uptime_checks;
DROP POLICY IF EXISTS "uptime_checks_msp_access" ON public.uptime_checks;
DROP POLICY IF EXISTS "uptime_checks_team_isolation" ON public.uptime_checks;
CREATE POLICY "uptime_checks_access_policy" ON public.uptime_checks
FOR ALL USING (
  public.is_msp_admin() OR
  (COALESCE((current_setting('app.is_msp'::text, true))::boolean, false) = true) OR 
  (team_id = COALESCE((current_setting('app.current_team'::text, true))::uuid, '00000000-0000-0000-0000-000000000000'::uuid)) OR
  (EXISTS (
    SELECT 1
    FROM organization_memberships om
    JOIN teams t ON om.organization_id = t.organization_id
    WHERE om.user_id = auth.uid() 
    AND om.role IN ('admin', 'manager') 
    AND t.id = uptime_checks.team_id
  ))
)
WITH CHECK (
  public.is_msp_admin() OR
  (COALESCE((current_setting('app.is_msp'::text, true))::boolean, false) = true) OR 
  (team_id = COALESCE((current_setting('app.current_team'::text, true))::uuid, '00000000-0000-0000-0000-000000000000'::uuid))
);

-- 25. user_roles
DROP POLICY IF EXISTS "Managers and MSP admins can assign roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "user_roles_read_policy" ON public.user_roles
FOR SELECT USING (
  public.is_msp_admin() OR
  (user_id = auth.uid()) OR
  ((organization_id IS NOT NULL) AND user_has_organization_access(organization_id)) OR
  ((team_id IS NOT NULL) AND user_has_team_access(team_id))
);
CREATE POLICY "user_roles_write_policy" ON public.user_roles
FOR INSERT, UPDATE, DELETE USING (
  public.is_msp_admin() OR
  ((organization_id IS NOT NULL) AND (EXISTS (
    SELECT 1
    FROM organization_memberships om
    WHERE om.user_id = auth.uid() 
    AND om.organization_id = user_roles.organization_id 
    AND om.role IN ('admin', 'manager')
  ))) OR
  ((team_id IS NOT NULL) AND (EXISTS (
    SELECT 1
    FROM team_memberships tm
    WHERE tm.user_id = auth.uid() 
    AND tm.team_id = user_roles.team_id 
    AND tm.role IN ('admin', 'owner')
  )))
);

-- 26. user_sessions (utilisateur peut gérer ses propres sessions, MSP admin peut voir toutes)
DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.user_sessions;
CREATE POLICY "user_sessions_read_policy" ON public.user_sessions
FOR SELECT USING (
  public.is_msp_admin() OR
  (user_id = auth.uid())
);
CREATE POLICY "user_sessions_write_policy" ON public.user_sessions
FOR INSERT, UPDATE, DELETE USING (
  public.is_msp_admin() OR
  (user_id = auth.uid())
);