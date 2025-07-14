-- Attribuer le rôle MSP Admin à l'utilisateur steeve.clotilde@opsway.fr
DO $$
DECLARE
    user_uuid UUID;
    msp_role_id UUID := '1701bfb1-a667-4415-a596-630e1fb0f14d';
    user_org_id UUID;
    user_team_id UUID;
BEGIN
    -- Récupérer l'ID de l'utilisateur et ses IDs d'organisation/équipe
    SELECT id, default_organization_id, default_team_id 
    INTO user_uuid, user_org_id, user_team_id
    FROM public.profiles 
    WHERE email = 'steeve.clotilde@opsway.fr';
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'Utilisateur avec email steeve.clotilde@opsway.fr non trouvé';
    END IF;
    
    -- Supprimer les rôles existants pour éviter les doublons
    DELETE FROM public.user_roles WHERE user_id = user_uuid;
    
    -- Attribuer le rôle MSP Admin au niveau organisation
    INSERT INTO public.user_roles (
        user_id, 
        role_id, 
        organization_id,
        granted_by,
        is_active
    ) VALUES (
        user_uuid, 
        msp_role_id, 
        user_org_id,
        user_uuid,
        true
    );
    
    -- Attribuer également le rôle au niveau équipe
    INSERT INTO public.user_roles (
        user_id, 
        role_id, 
        team_id,
        granted_by,
        is_active
    ) VALUES (
        user_uuid, 
        msp_role_id, 
        user_team_id,
        user_uuid,
        true
    );
    
    RAISE NOTICE 'Rôle MSP Admin attribué à l''utilisateur % pour organisation % et équipe %', 
        user_uuid, user_org_id, user_team_id;
END $$;