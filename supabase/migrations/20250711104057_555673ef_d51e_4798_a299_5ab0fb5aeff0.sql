-- Récupérer l'ID de l'utilisateur et le configurer comme admin MSP
DO $$
DECLARE
    user_uuid UUID;
    msp_org_id UUID;
    default_team_id UUID;
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
    RETURNING id INTO default_team_id;
    
    -- Configurer le profil comme admin MSP
    UPDATE public.profiles 
    SET is_msp_admin = true,
        default_organization_id = msp_org_id,
        default_team_id = default_team_id
    WHERE id = user_uuid;
    
    -- Créer l'adhésion à l'organisation
    INSERT INTO public.organization_memberships (user_id, organization_id, role)
    VALUES (user_uuid, msp_org_id, 'admin');
    
    -- Créer l'adhésion à l'équipe
    INSERT INTO public.team_memberships (user_id, team_id, role)
    VALUES (user_uuid, default_team_id, 'owner');
    
    -- Créer la session utilisateur
    INSERT INTO public.user_sessions (
        user_id, current_organization_id, current_team_id, is_msp, expires_at
    ) VALUES (
        user_uuid, msp_org_id, default_team_id, true, now() + interval '24 hours'
    );
    
    RAISE NOTICE 'Utilisateur % configuré comme admin MSP avec organisation % et équipe %', 
        user_uuid, msp_org_id, default_team_id;
END $$;