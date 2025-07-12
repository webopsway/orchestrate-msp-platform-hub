-- Supprimer d'abord toutes les politiques qui dépendent des fonctions de session
DROP POLICY IF EXISTS "itsm_service_requests_read_policy" ON public.itsm_service_requests;
DROP POLICY IF EXISTS "itsm_service_requests_insert_policy" ON public.itsm_service_requests;
DROP POLICY IF EXISTS "itsm_service_requests_update_policy" ON public.itsm_service_requests;
DROP POLICY IF EXISTS "itsm_service_requests_delete_policy" ON public.itsm_service_requests;

-- Maintenant supprimer les fonctions liées aux sessions
DROP FUNCTION IF EXISTS public.get_current_user_session();
DROP FUNCTION IF EXISTS public.set_user_session_context(uuid, uuid);
DROP FUNCTION IF EXISTS public.initialize_user_session(uuid, uuid);
DROP FUNCTION IF EXISTS public.set_app_session_variables(uuid, boolean);
DROP FUNCTION IF EXISTS public.get_app_session_variables();
DROP FUNCTION IF EXISTS public.test_session_variables();
DROP FUNCTION IF EXISTS public.auto_init_msp_admin_session();

-- Supprimer la table user_sessions
DROP TABLE IF EXISTS public.user_sessions;

-- Recréer les politiques pour itsm_service_requests basées uniquement sur le profil utilisateur
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