-- Récupérer l'ID de l'utilisateur et le configurer comme admin MSP
DO $$
DECLARE
    user_uuid UUID;
    msp_org_id UUID;
    team_id_var UUID;
BEGIN
    -- Trouver l'ID de l'utilisateur par email
    SELECT id INTO user_uuid 
    FROM public.profiles 
    WHERE email = 'steeve.clotilde@opsway.fr';
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'Utilisateur avec email steeve.clotilde@opsway.fr non trouvé';
    END IF;
    
    -- Créer l'organisation MSP
    INSERT INTO public.organizations (name, type, is_msp)
    VALUES ('OpsWay MSP', 'msp', true)
    RETURNING id INTO msp_org_id;
    
    -- Créer l'équipe par défaut
    INSERT INTO public.teams (name, description, organization_id)
    VALUES ('Équipe Principale', 'Équipe principale d''OpsWay MSP', msp_org_id)
    RETURNING id INTO team_id_var;
    
    -- Configurer le profil comme admin MSP
    UPDATE public.profiles 
    SET is_msp_admin = true,
        default_organization_id = msp_org_id,
        default_team_id = team_id_var
    WHERE id = user_uuid;
    
    -- Créer l'adhésion à l'organisation
    INSERT INTO public.organization_memberships (user_id, organization_id, role)
    VALUES (user_uuid, msp_org_id, 'admin');
    
    -- Créer l'adhésion à l'équipe
    INSERT INTO public.team_memberships (user_id, team_id, role)
    VALUES (user_uuid, team_id_var, 'owner');
    
    -- Créer ou mettre à jour la session utilisateur
    INSERT INTO public.user_sessions (
        user_id, current_organization_id, current_team_id, is_msp, expires_at
    ) VALUES (
        user_uuid, msp_org_id, team_id_var, true, now() + interval '24 hours'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        current_organization_id = EXCLUDED.current_organization_id,
        current_team_id = EXCLUDED.current_team_id,
        is_msp = EXCLUDED.is_msp,
        expires_at = EXCLUDED.expires_at,
        updated_at = now();
    
    RAISE NOTICE 'Utilisateur % configuré comme admin MSP avec organisation % et équipe %', 
        user_uuid, msp_org_id, team_id_var;
END $$;