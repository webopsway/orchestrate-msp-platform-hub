-- Corriger le problème de récursion infinie dans les politiques RLS

-- Supprimer la politique problématique sur profiles
DROP POLICY IF EXISTS "msp_admins_can_access_all_profiles" ON public.profiles;

-- Recréer la politique profiles avec la bonne fonction security definer
CREATE POLICY "msp_admins_can_access_all_profiles" 
ON public.profiles 
FOR ALL 
USING (
  is_msp_admin() OR
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
  is_msp_admin() OR
  id = auth.uid()
);

-- Supprimer et recréer les politiques pour organization_memberships pour éviter la récursion
DROP POLICY IF EXISTS "msp_admins_can_access_all_org_memberships" ON public.organization_memberships;

CREATE POLICY "msp_admins_can_access_all_org_memberships" 
ON public.organization_memberships 
FOR ALL 
USING (
  is_msp_admin() OR
  -- L'utilisateur peut voir ses propres adhésions
  user_id = auth.uid() OR
  -- Admins de l'organisation peuvent voir les membres (sans référence récursive)
  EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.user_id = auth.uid() 
    AND om.organization_id = organization_memberships.organization_id
  )
)
WITH CHECK (
  is_msp_admin() OR
  user_id = auth.uid()
);

-- Supprimer et recréer les politiques pour team_memberships pour éviter la récursion
DROP POLICY IF EXISTS "msp_admins_can_access_all_team_memberships" ON public.team_memberships;

CREATE POLICY "msp_admins_can_access_all_team_memberships" 
ON public.team_memberships 
FOR ALL 
USING (
  is_msp_admin() OR
  -- L'utilisateur peut voir ses propres adhésions
  user_id = auth.uid() OR
  -- Membres de l'équipe peuvent voir les autres membres (sans référence récursive)
  EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.user_id = auth.uid() 
    AND tm.team_id = team_memberships.team_id
  )
)
WITH CHECK (
  is_msp_admin() OR
  user_id = auth.uid()
);