-- Supprimer d'abord toutes les politiques existantes sur itsm_service_requests s'il y en a
DROP POLICY IF EXISTS "itsm_service_requests_read_policy" ON public.itsm_service_requests;
DROP POLICY IF EXISTS "itsm_service_requests_insert_policy" ON public.itsm_service_requests;
DROP POLICY IF EXISTS "itsm_service_requests_update_policy" ON public.itsm_service_requests;
DROP POLICY IF EXISTS "itsm_service_requests_delete_policy" ON public.itsm_service_requests;

-- Recréer les politiques pour itsm_service_requests basées uniquement sur team_memberships
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