-- Migration corrigée pour initialiser les configurations ITSM par défaut

-- Fonction pour initialiser les configurations par défaut d'une équipe
CREATE OR REPLACE FUNCTION initialize_default_itsm_configs(p_team_id UUID)
RETURNS void AS $$
DECLARE
    default_user_id UUID;
BEGIN
    -- Récupérer un utilisateur par défaut (le premier trouvé)
    SELECT id INTO default_user_id FROM public.profiles LIMIT 1;
    
    -- Si aucun utilisateur trouvé, utiliser l'auth.uid() actuel ou une valeur par défaut
    IF default_user_id IS NULL THEN
        default_user_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
    END IF;

    -- Priorités par défaut
    INSERT INTO public.itsm_configurations (team_id, config_type, config_key, config_value, display_order, created_by)
    VALUES 
        (p_team_id, 'priorities', 'low', '{"label": "Faible", "color": "#10b981", "description": "Priorité faible"}', 1, default_user_id),
        (p_team_id, 'priorities', 'medium', '{"label": "Moyenne", "color": "#f59e0b", "description": "Priorité moyenne"}', 2, default_user_id),
        (p_team_id, 'priorities', 'high', '{"label": "Élevée", "color": "#ef4444", "description": "Priorité élevée"}', 3, default_user_id),
        (p_team_id, 'priorities', 'critical', '{"label": "Critique", "color": "#dc2626", "description": "Priorité critique"}', 4, default_user_id)
    ON CONFLICT (team_id, config_type, config_key) DO NOTHING;

    -- Statuts par défaut pour les incidents
    INSERT INTO public.itsm_configurations (team_id, config_type, config_key, config_value, display_order, created_by)
    VALUES 
        (p_team_id, 'statuses', 'open', '{"label": "Ouvert", "color": "#3b82f6", "category": "incident", "description": "Incident ouvert"}', 1, default_user_id),
        (p_team_id, 'statuses', 'in_progress', '{"label": "En cours", "color": "#f59e0b", "category": "incident", "description": "Incident en cours de traitement"}', 2, default_user_id),
        (p_team_id, 'statuses', 'resolved', '{"label": "Résolu", "color": "#10b981", "category": "incident", "description": "Incident résolu"}', 3, default_user_id),
        (p_team_id, 'statuses', 'closed', '{"label": "Fermé", "color": "#6b7280", "category": "incident", "description": "Incident fermé"}', 4, default_user_id)
    ON CONFLICT (team_id, config_type, config_key) DO NOTHING;

    -- Statuts par défaut pour les demandes de service
    INSERT INTO public.itsm_configurations (team_id, config_type, config_key, config_value, display_order, created_by)
    VALUES 
        (p_team_id, 'statuses', 'open_sr', '{"label": "Ouvert", "color": "#3b82f6", "category": "service_request", "description": "Demande ouverte"}', 1, default_user_id),
        (p_team_id, 'statuses', 'assigned', '{"label": "Assigné", "color": "#8b5cf6", "category": "service_request", "description": "Demande assignée"}', 2, default_user_id),
        (p_team_id, 'statuses', 'in_progress_sr', '{"label": "En cours", "color": "#f59e0b", "category": "service_request", "description": "Demande en cours de traitement"}', 3, default_user_id),
        (p_team_id, 'statuses', 'completed', '{"label": "Terminé", "color": "#10b981", "category": "service_request", "description": "Demande terminée"}', 4, default_user_id),
        (p_team_id, 'statuses', 'closed_sr', '{"label": "Fermé", "color": "#6b7280", "category": "service_request", "description": "Demande fermée"}', 5, default_user_id)
    ON CONFLICT (team_id, config_type, config_key) DO NOTHING;

    -- Catégories par défaut
    INSERT INTO public.itsm_configurations (team_id, config_type, config_key, config_value, display_order, created_by)
    VALUES 
        (p_team_id, 'categories', 'general', '{"label": "Général", "color": "#6b7280", "description": "Catégorie générale"}', 1, default_user_id),
        (p_team_id, 'categories', 'hardware', '{"label": "Matériel", "color": "#ef4444", "description": "Problèmes matériels"}', 2, default_user_id),
        (p_team_id, 'categories', 'software', '{"label": "Logiciel", "color": "#3b82f6", "description": "Problèmes logiciels"}', 3, default_user_id),
        (p_team_id, 'categories', 'network', '{"label": "Réseau", "color": "#10b981", "description": "Problèmes réseau"}', 4, default_user_id),
        (p_team_id, 'categories', 'access', '{"label": "Accès / Permissions", "color": "#f59e0b", "description": "Problèmes d''accès et permissions"}', 5, default_user_id),
        (p_team_id, 'categories', 'training', '{"label": "Formation", "color": "#8b5cf6", "description": "Demandes de formation"}', 6, default_user_id),
        (p_team_id, 'categories', 'procurement', '{"label": "Approvisionnement", "color": "#06b6d4", "description": "Demandes d''approvisionnement"}', 7, default_user_id),
        (p_team_id, 'categories', 'maintenance', '{"label": "Maintenance", "color": "#84cc16", "description": "Demandes de maintenance"}', 8, default_user_id)
    ON CONFLICT (team_id, config_type, config_key) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour initialiser automatiquement les configurations lors de la création d'une équipe
CREATE OR REPLACE FUNCTION auto_initialize_itsm_configs()
RETURNS trigger AS $$
BEGIN
    -- Appeler la fonction d'initialisation pour la nouvelle équipe
    PERFORM initialize_default_itsm_configs(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur la table teams
DROP TRIGGER IF EXISTS trigger_auto_initialize_itsm_configs ON public.teams;
CREATE TRIGGER trigger_auto_initialize_itsm_configs
    AFTER INSERT ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION auto_initialize_itsm_configs();

-- Initialiser les configurations pour les équipes existantes
DO $$
DECLARE
    team_record RECORD;
BEGIN
    FOR team_record IN SELECT id FROM public.teams LOOP
        PERFORM initialize_default_itsm_configs(team_record.id);
    END LOOP;
END;
$$;