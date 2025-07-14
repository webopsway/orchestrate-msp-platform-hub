-- Migration pour diagnostiquer et corriger l'accès aux données ITSM
-- Date: 2025-07-13

-- 1. Vérifier l'état actuel de l'utilisateur MSP
DO $$
DECLARE
    user_uuid UUID;
    msp_org_id UUID;
    team_id_var UUID;
    team_membership_count INTEGER;
    org_membership_count INTEGER;
BEGIN
    -- Trouver l'ID de l'utilisateur par email
    SELECT id INTO user_uuid 
    FROM public.profiles 
    WHERE email = 'steeve.clotilde@opsway.fr';
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'Utilisateur avec email steeve.clotilde@opsway.fr non trouvé';
    END IF;
    
    RAISE NOTICE '🔍 Diagnostic pour utilisateur: %', user_uuid;
    
    -- Vérifier le profil utilisateur
    RAISE NOTICE '📋 Profil utilisateur:';
    RAISE NOTICE '   - is_msp_admin: %', (SELECT is_msp_admin FROM public.profiles WHERE id = user_uuid);
    RAISE NOTICE '   - default_organization_id: %', (SELECT default_organization_id FROM public.profiles WHERE id = user_uuid);
    RAISE NOTICE '   - default_team_id: %', (SELECT default_team_id FROM public.profiles WHERE id = user_uuid);
    
    -- Vérifier les adhésions aux organisations
    SELECT COUNT(*) INTO org_membership_count
    FROM public.organization_memberships 
    WHERE user_id = user_uuid;
    
    RAISE NOTICE '🏢 Adhésions aux organisations: %', org_membership_count;
    
    -- Vérifier les adhésions aux équipes
    SELECT COUNT(*) INTO team_membership_count
    FROM public.team_memberships 
    WHERE user_id = user_uuid;
    
    RAISE NOTICE '👥 Adhésions aux équipes: %', team_membership_count;
    
    -- Vérifier les données ITSM existantes
    RAISE NOTICE '📊 Données ITSM existantes:';
    RAISE NOTICE '   - itsm_service_requests: %', (SELECT COUNT(*) FROM public.itsm_service_requests);
    RAISE NOTICE '   - itsm_incidents: %', (SELECT COUNT(*) FROM public.itsm_incidents);
    RAISE NOTICE '   - itsm_change_requests: %', (SELECT COUNT(*) FROM public.itsm_change_requests);
    
    -- Si l'utilisateur n'a pas d'organisation par défaut, en créer une
    IF (SELECT default_organization_id FROM public.profiles WHERE id = user_uuid) IS NULL THEN
        RAISE NOTICE '⚠️  Pas d''organisation par défaut, création d''une organisation MSP...';
        
        -- Créer l'organisation MSP
        INSERT INTO public.organizations (name, type, is_msp)
        VALUES ('OpsWay MSP', 'msp', true)
        RETURNING id INTO msp_org_id;
        
        -- Créer l'équipe par défaut
        INSERT INTO public.teams (name, description, organization_id)
        VALUES ('Équipe Principale', 'Équipe principale d''OpsWay MSP', msp_org_id)
        RETURNING id INTO team_id_var;
        
        -- Mettre à jour le profil
        UPDATE public.profiles 
        SET is_msp_admin = true,
            default_organization_id = msp_org_id,
            default_team_id = team_id_var
        WHERE id = user_uuid;
        
        -- Créer les adhésions
        INSERT INTO public.organization_memberships (user_id, organization_id, role)
        VALUES (user_uuid, msp_org_id, 'admin')
        ON CONFLICT (user_id, organization_id) DO NOTHING;
        
        INSERT INTO public.team_memberships (user_id, team_id, role)
        VALUES (user_uuid, team_id_var, 'owner')
        ON CONFLICT (user_id, team_id) DO NOTHING;
        
        RAISE NOTICE '✅ Organisation MSP créée: %', msp_org_id;
        RAISE NOTICE '✅ Équipe créée: %', team_id_var;
    ELSE
        -- Récupérer les IDs existants
        SELECT default_organization_id, default_team_id 
        INTO msp_org_id, team_id_var
        FROM public.profiles 
        WHERE id = user_uuid;
        
        RAISE NOTICE '✅ Organisation existante: %', msp_org_id;
        RAISE NOTICE '✅ Équipe existante: %', team_id_var;
        
        -- S'assurer que les adhésions existent
        INSERT INTO public.organization_memberships (user_id, organization_id, role)
        VALUES (user_uuid, msp_org_id, 'admin')
        ON CONFLICT (user_id, organization_id) DO NOTHING;
        
        INSERT INTO public.team_memberships (user_id, team_id, role)
        VALUES (user_uuid, team_id_var, 'owner')
        ON CONFLICT (user_id, team_id) DO NOTHING;
    END IF;
    
    -- S'assurer que l'utilisateur est admin MSP
    UPDATE public.profiles 
    SET is_msp_admin = true
    WHERE id = user_uuid AND is_msp_admin IS NOT TRUE;
    
    RAISE NOTICE '✅ Utilisateur configuré comme admin MSP';
    
    -- Vérifier les politiques RLS
    RAISE NOTICE '🔒 Vérification des politiques RLS:';
    RAISE NOTICE '   - Politique itsm_service_requests: %', (
        SELECT COUNT(*) FROM pg_policies 
        WHERE tablename = 'itsm_service_requests' 
        AND schemaname = 'public'
    );
    
END $$;

-- 2. Créer des données de test si aucune n'existe
DO $$
DECLARE
    user_uuid UUID;
    team_id_var UUID;
    request_count INTEGER;
BEGIN
    -- Trouver l'utilisateur
    SELECT id INTO user_uuid 
    FROM public.profiles 
    WHERE email = 'steeve.clotilde@opsway.fr';
    
    -- Trouver l'équipe par défaut
    SELECT default_team_id INTO team_id_var
    FROM public.profiles 
    WHERE id = user_uuid;
    
    -- Compter les demandes existantes
    SELECT COUNT(*) INTO request_count
    FROM public.itsm_service_requests;
    
    RAISE NOTICE '📊 Demandes de service existantes: %', request_count;
    
    -- Créer des données de test si aucune n'existe
    IF request_count = 0 THEN
        RAISE NOTICE '📝 Création de données de test...';
        
        INSERT INTO public.itsm_service_requests (
            title, description, priority, status, urgency, impact,
            service_category, requested_by, team_id
        ) VALUES 
        ('Problème de connexion VPN', 'Les utilisateurs ne peuvent pas se connecter au VPN', 'high', 'open', 'high', 'medium', 'network', user_uuid, team_id_var),
        ('Mise à jour des serveurs', 'Mise à jour de sécurité des serveurs de production', 'medium', 'in_progress', 'medium', 'high', 'maintenance', user_uuid, team_id_var),
        ('Nouveau poste de travail', 'Installation d''un nouveau poste de travail pour le département RH', 'low', 'resolved', 'low', 'low', 'hardware', user_uuid, team_id_var),
        ('Problème d''email', 'Les emails ne sont pas reçus par certains utilisateurs', 'critical', 'open', 'critical', 'high', 'email', user_uuid, team_id_var),
        ('Sauvegarde défaillante', 'La sauvegarde automatique échoue depuis 2 jours', 'high', 'in_progress', 'high', 'high', 'backup', user_uuid, team_id_var);
        
        RAISE NOTICE '✅ 5 demandes de service de test créées';
    ELSE
        RAISE NOTICE '✅ Des données existent déjà, pas de création de données de test';
    END IF;
END $$;

-- 3. Vérifier les permissions finales
DO $$
DECLARE
    user_uuid UUID;
    can_access BOOLEAN;
BEGIN
    -- Trouver l'utilisateur
    SELECT id INTO user_uuid 
    FROM public.profiles 
    WHERE email = 'steeve.clotilde@opsway.fr';
    
    -- Tester l'accès aux données ITSM
    SELECT EXISTS (
        SELECT 1 FROM public.itsm_service_requests 
        WHERE team_id = (SELECT default_team_id FROM public.profiles WHERE id = user_uuid)
        LIMIT 1
    ) INTO can_access;
    
    RAISE NOTICE '🔍 Test d''accès aux données ITSM: %', can_access;
    
    -- Afficher un résumé final
    RAISE NOTICE '📋 Résumé final:';
    RAISE NOTICE '   - Utilisateur: %', user_uuid;
    RAISE NOTICE '   - Admin MSP: %', (SELECT is_msp_admin FROM public.profiles WHERE id = user_uuid);
    RAISE NOTICE '   - Équipe par défaut: %', (SELECT default_team_id FROM public.profiles WHERE id = user_uuid);
    RAISE NOTICE '   - Demandes de service: %', (SELECT COUNT(*) FROM public.itsm_service_requests);
    RAISE NOTICE '   - Accès aux données: %', can_access;
END $$; 