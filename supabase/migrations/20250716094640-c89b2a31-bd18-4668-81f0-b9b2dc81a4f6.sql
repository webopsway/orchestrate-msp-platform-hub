-- Créer les politiques RLS pour donner accès complet aux MSP admins

-- Organizations: MSP admins peuvent voir toutes les organisations
CREATE POLICY "msp_admins_can_access_all_organizations" 
ON public.organizations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_msp_admin = true
  ) OR
  -- Utilisateur membre de l'organisation
  EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.user_id = auth.uid() AND om.organization_id = organizations.id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_msp_admin = true
  ) OR
  EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.user_id = auth.uid() AND om.organization_id = organizations.id
  )
);

-- Teams: MSP admins peuvent voir toutes les équipes
CREATE POLICY "msp_admins_can_access_all_teams" 
ON public.teams 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_msp_admin = true
  ) OR
  -- Utilisateur membre de l'équipe
  EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.user_id = auth.uid() AND tm.team_id = teams.id
  ) OR
  -- Utilisateur admin de l'organisation parent
  EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.user_id = auth.uid() AND om.organization_id = teams.organization_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_msp_admin = true
  ) OR
  EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.user_id = auth.uid() AND tm.team_id = teams.id
  ) OR
  EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.user_id = auth.uid() AND om.organization_id = teams.organization_id
  )
);

-- Profiles: MSP admins peuvent voir tous les profils
CREATE POLICY "msp_admins_can_access_all_profiles" 
ON public.profiles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_msp_admin = true
  ) OR
  -- L'utilisateur peut voir son propre profil
  id = auth.uid() OR
  -- Utilisateurs de la même organisation
  EXISTS (
    SELECT 1 FROM public.organization_memberships om1, public.organization_memberships om2
    WHERE om1.user_id = auth.uid() 
    AND om2.user_id = profiles.id
    AND om1.organization_id = om2.organization_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_msp_admin = true
  ) OR
  id = auth.uid()
);

-- Organization memberships: MSP admins peuvent voir toutes les adhésions
CREATE POLICY "msp_admins_can_access_all_org_memberships" 
ON public.organization_memberships 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_msp_admin = true
  ) OR
  -- L'utilisateur peut voir ses propres adhésions
  user_id = auth.uid() OR
  -- Admins de l'organisation peuvent voir les membres
  EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.user_id = auth.uid() 
    AND om.organization_id = organization_memberships.organization_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_msp_admin = true
  ) OR
  user_id = auth.uid()
);

-- Team memberships: MSP admins peuvent voir toutes les adhésions d'équipe
CREATE POLICY "msp_admins_can_access_all_team_memberships" 
ON public.team_memberships 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_msp_admin = true
  ) OR
  -- L'utilisateur peut voir ses propres adhésions
  user_id = auth.uid() OR
  -- Membres de l'équipe peuvent voir les autres membres
  EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.user_id = auth.uid() 
    AND tm.team_id = team_memberships.team_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_msp_admin = true
  ) OR
  user_id = auth.uid()
);

-- Cloud accounts: MSP admins peuvent voir tous les comptes cloud
CREATE POLICY "msp_admins_can_access_all_cloud_accounts" 
ON public.cloud_accounts 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_msp_admin = true
  ) OR
  -- Accès si l'utilisateur fait partie de l'équipe
  EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.user_id = auth.uid() AND tm.team_id = cloud_accounts.team_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_msp_admin = true
  ) OR
  EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.user_id = auth.uid() AND tm.team_id = cloud_accounts.team_id
  )
);

-- Activer RLS sur toutes les tables principales
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_accounts ENABLE ROW LEVEL SECURITY;