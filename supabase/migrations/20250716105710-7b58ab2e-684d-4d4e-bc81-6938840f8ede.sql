-- Création de fonctions utilitaires pour le RBAC dans les politiques RLS

-- Fonction pour vérifier si l'utilisateur fait partie de l'organisation MSP
CREATE OR REPLACE FUNCTION public.is_user_in_msp_organization()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_memberships om
    JOIN public.organizations o ON o.id = om.organization_id
    WHERE om.user_id = auth.uid() 
    AND o.is_msp = TRUE
  );
$$;

-- Fonction pour vérifier si l'utilisateur a une permission spécifique
CREATE OR REPLACE FUNCTION public.user_has_permission(p_resource text, p_action text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = auth.uid()
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
    AND p.resource = p_resource
    AND p.action = p_action
  );
$$;

-- Fonction pour vérifier si l'utilisateur peut accéder aux données d'une organisation cliente
CREATE OR REPLACE FUNCTION public.user_can_access_client_org(p_client_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_memberships om
    JOIN public.organizations o ON o.id = om.organization_id
    JOIN public.msp_client_relations mcr ON mcr.msp_organization_id = o.id
    WHERE om.user_id = auth.uid()
    AND o.is_msp = true
    AND mcr.client_organization_id = p_client_org_id
    AND mcr.is_active = true
    AND (mcr.end_date IS NULL OR mcr.end_date > now())
  );
$$;

-- Mise à jour des politiques existantes pour inclure les utilisateurs MSP avec permissions

-- Organizations: MSP admins + utilisateurs MSP avec permissions appropriées
DROP POLICY IF EXISTS "msp_admins_can_access_all_organizations" ON public.organizations;
CREATE POLICY "organizations_access_policy" 
ON public.organizations 
FOR ALL 
USING (
  is_msp_admin() 
  OR (
    is_user_in_msp_organization() 
    AND user_has_permission('organizations', 'read')
  )
  OR (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.user_id = auth.uid() 
      AND om.organization_id = organizations.id
    )
  )
) 
WITH CHECK (
  is_msp_admin() 
  OR (
    is_user_in_msp_organization() 
    AND user_has_permission('organizations', 'create')
  )
);

-- Teams: MSP admins + utilisateurs MSP avec permissions + membres des équipes
DROP POLICY IF EXISTS "msp_admins_can_access_all_teams" ON public.teams;
CREATE POLICY "teams_access_policy" 
ON public.teams 
FOR ALL 
USING (
  is_msp_admin()
  OR (
    is_user_in_msp_organization() 
    AND user_has_permission('teams', 'read')
  )
  OR (
    EXISTS (
      SELECT 1 FROM team_memberships tm
      WHERE tm.user_id = auth.uid() 
      AND tm.team_id = teams.id
    )
  )
  OR (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.user_id = auth.uid() 
      AND om.organization_id = teams.organization_id
    )
  )
) 
WITH CHECK (
  is_msp_admin()
  OR (
    is_user_in_msp_organization() 
    AND user_has_permission('teams', 'create')
  )
);

-- Cloud Accounts: Accès selon les permissions et relations client
DROP POLICY IF EXISTS "msp_admins_can_access_all_cloud_accounts" ON public.cloud_accounts;
CREATE POLICY "cloud_accounts_access_policy" 
ON public.cloud_accounts 
FOR ALL 
USING (
  is_msp_admin()
  OR (
    is_user_in_msp_organization() 
    AND user_has_permission('assets', 'read')
    AND user_can_access_client_org(cloud_accounts.client_organization_id)
  )
  OR (
    EXISTS (
      SELECT 1 FROM team_memberships tm
      WHERE tm.user_id = auth.uid() 
      AND tm.team_id = cloud_accounts.team_id
    )
  )
) 
WITH CHECK (
  is_msp_admin()
  OR (
    is_user_in_msp_organization() 
    AND user_has_permission('assets', 'create')
    AND user_can_access_client_org(cloud_accounts.client_organization_id)
  )
);

-- ITSM Incidents: Accès selon les permissions et équipe
DROP POLICY IF EXISTS "msp_admins_full_access_itsm_incidents" ON public.itsm_incidents;
CREATE POLICY "itsm_incidents_access_policy" 
ON public.itsm_incidents 
FOR ALL 
USING (
  is_msp_admin()
  OR (
    is_user_in_msp_organization() 
    AND user_has_permission('incidents', 'read')
  )
  OR (
    EXISTS (
      SELECT 1 FROM team_memberships tm
      WHERE tm.user_id = auth.uid() 
      AND tm.team_id = itsm_incidents.team_id
    )
  )
  OR created_by = auth.uid()
  OR assigned_to = auth.uid()
) 
WITH CHECK (
  is_msp_admin()
  OR (
    is_user_in_msp_organization() 
    AND user_has_permission('incidents', 'create')
  )
  OR (
    EXISTS (
      SELECT 1 FROM team_memberships tm
      WHERE tm.user_id = auth.uid() 
      AND tm.team_id = itsm_incidents.team_id
    )
  )
);

-- ITSM Service Requests: Accès selon les permissions et équipe
DROP POLICY IF EXISTS "msp_admins_full_access_itsm_service_requests" ON public.itsm_service_requests;
CREATE POLICY "itsm_service_requests_access_policy" 
ON public.itsm_service_requests 
FOR ALL 
USING (
  is_msp_admin()
  OR (
    is_user_in_msp_organization() 
    AND user_has_permission('incidents', 'read')
  )
  OR (
    EXISTS (
      SELECT 1 FROM team_memberships tm
      WHERE tm.user_id = auth.uid() 
      AND tm.team_id = itsm_service_requests.team_id
    )
  )
  OR requested_by = auth.uid()
  OR assigned_to = auth.uid()
) 
WITH CHECK (
  is_msp_admin()
  OR (
    is_user_in_msp_organization() 
    AND user_has_permission('incidents', 'create')
  )
  OR (
    EXISTS (
      SELECT 1 FROM team_memberships tm
      WHERE tm.user_id = auth.uid() 
      AND tm.team_id = itsm_service_requests.team_id
    )
  )
);

-- Security Vulnerabilities: Accès selon les permissions et équipe
DROP POLICY IF EXISTS "msp_admins_full_access_security_vulnerabilities" ON public.security_vulnerabilities;
CREATE POLICY "security_vulnerabilities_access_policy" 
ON public.security_vulnerabilities 
FOR ALL 
USING (
  is_msp_admin()
  OR (
    is_user_in_msp_organization() 
    AND user_has_permission('vulnerabilities', 'read')
  )
  OR (
    EXISTS (
      SELECT 1 FROM team_memberships tm
      WHERE tm.user_id = auth.uid() 
      AND tm.team_id = security_vulnerabilities.team_id
    )
  )
  OR assigned_to = auth.uid()
) 
WITH CHECK (
  is_msp_admin()
  OR (
    is_user_in_msp_organization() 
    AND user_has_permission('vulnerabilities', 'create')
  )
  OR (
    EXISTS (
      SELECT 1 FROM team_memberships tm
      WHERE tm.user_id = auth.uid() 
      AND tm.team_id = security_vulnerabilities.team_id
    )
  )
);

-- Profiles: Accès élargi pour les utilisateurs MSP
DROP POLICY IF EXISTS "msp_admins_can_access_all_profiles" ON public.profiles;
CREATE POLICY "profiles_access_policy" 
ON public.profiles 
FOR ALL 
USING (
  is_msp_admin()
  OR id = auth.uid()
  OR (
    is_user_in_msp_organization() 
    AND user_has_permission('users', 'read')
  )
  OR (
    EXISTS (
      SELECT 1
      FROM organization_memberships om1,
           organization_memberships om2
      WHERE om1.user_id = auth.uid() 
      AND om2.user_id = profiles.id 
      AND om1.organization_id = om2.organization_id
    )
  )
) 
WITH CHECK (
  is_msp_admin() 
  OR id = auth.uid()
  OR (
    is_user_in_msp_organization() 
    AND user_has_permission('users', 'create')
  )
);