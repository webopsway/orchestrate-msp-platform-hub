-- Créer une fonction pour gérer le premier utilisateur comme admin MSP
CREATE OR REPLACE FUNCTION public.handle_first_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_count INTEGER;
    msp_org_id UUID;
    default_team_id UUID;
BEGIN
    -- Compter le nombre d'utilisateurs existants
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    
    -- Si c'est le premier utilisateur, le configurer comme admin MSP
    IF user_count = 0 THEN
        -- Créer l'organisation MSP par défaut
        INSERT INTO public.organizations (name, type, is_msp)
        VALUES ('Mon Organisation MSP', 'msp', true)
        RETURNING id INTO msp_org_id;
        
        -- Créer l'équipe par défaut
        INSERT INTO public.teams (name, description, organization_id)
        VALUES ('Équipe MSP', 'Équipe principale de l''organisation MSP', msp_org_id)
        RETURNING id INTO default_team_id;
        
        -- Configurer le profil comme admin MSP
        UPDATE public.profiles 
        SET is_msp_admin = true,
            default_organization_id = msp_org_id,
            default_team_id = default_team_id
        WHERE id = NEW.id;
        
        -- Créer l'adhésion à l'organisation
        INSERT INTO public.organization_memberships (user_id, organization_id, role)
        VALUES (NEW.id, msp_org_id, 'admin');
        
        -- Créer l'adhésion à l'équipe
        INSERT INTO public.team_memberships (user_id, team_id, role)
        VALUES (NEW.id, default_team_id, 'owner');
        
        -- Créer la session utilisateur
        INSERT INTO public.user_sessions (
            user_id, current_organization_id, current_team_id, is_msp
        ) VALUES (
            NEW.id, msp_org_id, default_team_id, true
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le nouveau trigger pour gérer le premier utilisateur
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Créer le trigger pour gérer le premier utilisateur après création du profil
CREATE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_first_user();