-- Ajouter les politiques RLS pour les incidents ITSM
ALTER TABLE public.itsm_incidents ENABLE ROW LEVEL SECURITY;

-- Politiques pour itsm_incidents
CREATE POLICY "itsm_incidents_read_policy" 
ON public.itsm_incidents
FOR SELECT
TO authenticated
USING (
  is_msp_admin() OR 
  EXISTS (
    SELECT 1 FROM team_memberships tm
    WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_incidents.team_id
  )
);

CREATE POLICY "itsm_incidents_insert_policy" 
ON public.itsm_incidents
FOR INSERT
TO authenticated
WITH CHECK (
  is_msp_admin() OR 
  EXISTS (
    SELECT 1 FROM team_memberships tm
    WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_incidents.team_id
  )
);

CREATE POLICY "itsm_incidents_update_policy" 
ON public.itsm_incidents
FOR UPDATE
TO authenticated
USING (
  is_msp_admin() OR 
  EXISTS (
    SELECT 1 FROM team_memberships tm
    WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_incidents.team_id
  )
);

CREATE POLICY "itsm_incidents_delete_policy" 
ON public.itsm_incidents
FOR DELETE
TO authenticated
USING (is_msp_admin());

-- Ajouter les politiques RLS pour les demandes de changement ITSM
ALTER TABLE public.itsm_change_requests ENABLE ROW LEVEL SECURITY;

-- Politiques pour itsm_change_requests
CREATE POLICY "itsm_change_requests_read_policy" 
ON public.itsm_change_requests
FOR SELECT
TO authenticated
USING (
  is_msp_admin() OR 
  EXISTS (
    SELECT 1 FROM team_memberships tm
    WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_change_requests.team_id
  )
);

CREATE POLICY "itsm_change_requests_insert_policy" 
ON public.itsm_change_requests
FOR INSERT
TO authenticated
WITH CHECK (
  is_msp_admin() OR 
  EXISTS (
    SELECT 1 FROM team_memberships tm
    WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_change_requests.team_id
  )
);

CREATE POLICY "itsm_change_requests_update_policy" 
ON public.itsm_change_requests
FOR UPDATE
TO authenticated
USING (
  is_msp_admin() OR 
  EXISTS (
    SELECT 1 FROM team_memberships tm
    WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_change_requests.team_id
  )
);

CREATE POLICY "itsm_change_requests_delete_policy" 
ON public.itsm_change_requests
FOR DELETE
TO authenticated
USING (is_msp_admin());

-- Ajouter les politiques RLS pour les commentaires ITSM
ALTER TABLE public.itsm_comments ENABLE ROW LEVEL SECURITY;

-- Politiques pour itsm_comments
CREATE POLICY "itsm_comments_read_policy" 
ON public.itsm_comments
FOR SELECT
TO authenticated
USING (
  is_msp_admin() OR 
  EXISTS (
    SELECT 1 FROM team_memberships tm
    WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_comments.team_id
  )
);

CREATE POLICY "itsm_comments_insert_policy" 
ON public.itsm_comments
FOR INSERT
TO authenticated
WITH CHECK (
  is_msp_admin() OR 
  EXISTS (
    SELECT 1 FROM team_memberships tm
    WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_comments.team_id
  )
);

CREATE POLICY "itsm_comments_update_policy" 
ON public.itsm_comments
FOR UPDATE
TO authenticated
USING (
  is_msp_admin() OR 
  (created_by = auth.uid() AND EXISTS (
    SELECT 1 FROM team_memberships tm
    WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_comments.team_id
  ))
);

CREATE POLICY "itsm_comments_delete_policy" 
ON public.itsm_comments
FOR DELETE
TO authenticated
USING (
  is_msp_admin() OR 
  (created_by = auth.uid() AND EXISTS (
    SELECT 1 FROM team_memberships tm
    WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_comments.team_id
  ))
);