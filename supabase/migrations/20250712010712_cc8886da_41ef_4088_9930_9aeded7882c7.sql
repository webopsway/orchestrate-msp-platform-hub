-- Supprimer toutes les politiques RLS qui utilisent les fonctions de session obsolètes
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
DROP POLICY IF EXISTS "backup_jobs_access_policy" ON public.backup_jobs;
DROP POLICY IF EXISTS "itsm_change_requests_access_policy" ON public.itsm_change_requests;
DROP POLICY IF EXISTS "itsm_incidents_access_policy" ON public.itsm_incidents;
DROP POLICY IF EXISTS "infrastructure_docs_access_policy" ON public.infrastructure_docs;
DROP POLICY IF EXISTS "monitoring_alerts_access_policy" ON public.monitoring_alerts;
DROP POLICY IF EXISTS "security_vulnerabilities_access_policy" ON public.security_vulnerabilities;

-- Maintenant supprimer les fonctions liées aux sessions avec CASCADE
DROP FUNCTION IF EXISTS public.get_current_user_session() CASCADE;
DROP FUNCTION IF EXISTS public.set_user_session_context(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.initialize_user_session(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.set_app_session_variables(uuid, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.get_app_session_variables() CASCADE;
DROP FUNCTION IF EXISTS public.test_session_variables() CASCADE;
DROP FUNCTION IF EXISTS public.auto_init_msp_admin_session() CASCADE;

-- Supprimer la table user_sessions
DROP TABLE IF EXISTS public.user_sessions CASCADE;