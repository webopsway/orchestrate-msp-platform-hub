-- Corriger TOUTES les politiques RLS problématiques qui causent des récursions infinies

-- 1. Corriger organization_memberships - récursion sur la même table
DROP POLICY IF EXISTS "msp_admins_can_access_all_org_memberships" ON public.organization_memberships;
CREATE POLICY "msp_admins_can_access_all_org_memberships" 
ON public.organization_memberships 
FOR ALL 
USING (
  is_msp_admin() OR
  user_id = auth.uid()
)
WITH CHECK (
  is_msp_admin() OR
  user_id = auth.uid()
);

-- 2. Corriger team_memberships - récursion sur la même table
DROP POLICY IF EXISTS "msp_admins_can_access_all_team_memberships" ON public.team_memberships;
CREATE POLICY "msp_admins_can_access_all_team_memberships" 
ON public.team_memberships 
FOR ALL 
USING (
  is_msp_admin() OR
  user_id = auth.uid()
)
WITH CHECK (
  is_msp_admin() OR
  user_id = auth.uid()
);

-- 3. Corriger organizations - éviter la référence directe à profiles dans la politique
DROP POLICY IF EXISTS "msp_admins_can_access_all_organizations" ON public.organizations;
CREATE POLICY "msp_admins_can_access_all_organizations" 
ON public.organizations 
FOR ALL 
USING (
  is_msp_admin() OR
  EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.user_id = auth.uid() AND om.organization_id = organizations.id
  )
)
WITH CHECK (
  is_msp_admin() OR
  EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.user_id = auth.uid() AND om.organization_id = organizations.id
  )
);

-- 4. Corriger teams - éviter la référence directe à profiles dans la politique
DROP POLICY IF EXISTS "msp_admins_can_access_all_teams" ON public.teams;
CREATE POLICY "msp_admins_can_access_all_teams" 
ON public.teams 
FOR ALL 
USING (
  is_msp_admin() OR
  EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.user_id = auth.uid() AND tm.team_id = teams.id
  ) OR
  EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.user_id = auth.uid() AND om.organization_id = teams.organization_id
  )
)
WITH CHECK (
  is_msp_admin() OR
  EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.user_id = auth.uid() AND tm.team_id = teams.id
  ) OR
  EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.user_id = auth.uid() AND om.organization_id = teams.organization_id
  )
);

-- 5. Corriger cloud_accounts - éviter la référence directe à profiles
DROP POLICY IF EXISTS "msp_admins_can_access_all_cloud_accounts" ON public.cloud_accounts;
CREATE POLICY "msp_admins_can_access_all_cloud_accounts" 
ON public.cloud_accounts 
FOR ALL 
USING (
  is_msp_admin() OR
  EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.user_id = auth.uid() AND tm.team_id = cloud_accounts.team_id
  )
)
WITH CHECK (
  is_msp_admin() OR
  EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.user_id = auth.uid() AND tm.team_id = cloud_accounts.team_id
  )
);

-- 6. Vérifier que toutes les autres politiques utilisent is_msp_admin() pour éviter les récursions
-- Les politiques "msp_admins_full_access_*" utilisent déjà uniquement is_msp_admin() donc elles sont correctes