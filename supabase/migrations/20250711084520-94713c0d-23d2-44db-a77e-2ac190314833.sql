-- Fonction pour diagnostiquer les permissions utilisateur
CREATE OR REPLACE FUNCTION public.diagnose_user_permissions()
RETURNS TABLE(
  user_id UUID,
  is_msp_admin BOOLEAN,
  has_session BOOLEAN,
  session_team_id UUID,
  session_org_id UUID,
  org_memberships_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.is_msp_admin,
    us.id IS NOT NULL as has_session,
    us.current_team_id,
    us.current_organization_id,
    COALESCE((SELECT COUNT(*) FROM organization_memberships om WHERE om.user_id = p.id), 0) as org_memberships_count
  FROM profiles p
  LEFT JOIN user_sessions us ON us.user_id = p.id AND us.expires_at > now()
  WHERE p.id = auth.uid();
END;
$$;

-- Fonction améliorée pour vérifier si l'utilisateur est MSP admin
CREATE OR REPLACE FUNCTION public.is_msp_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT is_msp_admin FROM public.profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

-- Fonction pour initialiser automatiquement une session pour les MSP admins
CREATE OR REPLACE FUNCTION public.auto_init_msp_admin_session()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_msp BOOLEAN;
  v_default_org_id UUID;
  v_first_org_id UUID;
  v_first_team_id UUID;
BEGIN
  -- Vérifier si c'est un MSP admin
  SELECT is_msp_admin INTO v_is_msp
  FROM public.profiles
  WHERE id = v_user_id;
  
  IF v_is_msp THEN
    -- Obtenir l'organisation par défaut ou la première organisation MSP
    SELECT default_organization_id INTO v_default_org_id
    FROM public.profiles
    WHERE id = v_user_id;
    
    -- Si pas d'organisation par défaut, prendre la première organisation MSP
    IF v_default_org_id IS NULL THEN
      SELECT id INTO v_first_org_id
      FROM public.organizations
      WHERE is_msp = true
      ORDER BY created_at
      LIMIT 1;
      
      v_default_org_id := v_first_org_id;
    END IF;
    
    -- Obtenir la première équipe de l'organisation
    SELECT id INTO v_first_team_id
    FROM public.teams
    WHERE organization_id = v_default_org_id
    ORDER BY created_at
    LIMIT 1;
    
    -- Créer ou mettre à jour la session
    INSERT INTO public.user_sessions (
      user_id,
      current_organization_id,
      current_team_id,
      is_msp,
      updated_at,
      expires_at
    )
    VALUES (
      v_user_id,
      v_default_org_id,
      v_first_team_id,
      true,
      now(),
      now() + interval '24 hours'
    )
    ON CONFLICT (user_id) DO UPDATE SET
      current_organization_id = COALESCE(EXCLUDED.current_organization_id, user_sessions.current_organization_id),
      current_team_id = COALESCE(EXCLUDED.current_team_id, user_sessions.current_team_id),
      is_msp = true,
      updated_at = now(),
      expires_at = now() + interval '24 hours';
      
    -- Définir les variables de session PostgreSQL
    PERFORM public.set_app_session_variables(v_first_team_id, true);
  END IF;
END;
$$;

-- Politique RLS simplifiée pour les organisations qui permet l'accès aux MSP admins
DROP POLICY IF EXISTS "organizations_read_policy" ON public.organizations;

CREATE POLICY "organizations_read_policy" 
ON public.organizations 
FOR SELECT 
USING (
  public.is_msp_admin() OR 
  public.user_has_organization_access(id)
);

-- Politique pour permettre aux MSP admins de créer des organisations
DROP POLICY IF EXISTS "organizations_insert_policy" ON public.organizations;

CREATE POLICY "organizations_insert_policy" 
ON public.organizations 
FOR INSERT 
WITH CHECK (
  public.is_msp_admin()
);

-- Politique pour permettre aux MSP admins de modifier les organisations
DROP POLICY IF EXISTS "organizations_update_policy" ON public.organizations;

CREATE POLICY "organizations_update_policy" 
ON public.organizations 
FOR UPDATE 
USING (
  public.is_msp_admin() OR 
  (EXISTS (
    SELECT 1
    FROM organization_memberships om
    WHERE om.user_id = auth.uid() 
    AND om.organization_id = organizations.id 
    AND om.role = ANY (ARRAY['admin'::user_role, 'manager'::user_role])
  ))
);

-- Politique pour permettre aux MSP admins de supprimer les organisations
DROP POLICY IF EXISTS "organizations_delete_policy" ON public.organizations;

CREATE POLICY "organizations_delete_policy" 
ON public.organizations 
FOR DELETE 
USING (
  public.is_msp_admin()
);