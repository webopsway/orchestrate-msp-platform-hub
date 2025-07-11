-- Ajouter des données de test pour ITSM
DO $$
DECLARE
    user_uuid UUID;
    team_uuid UUID;
BEGIN
    -- Récupérer l'ID de l'utilisateur et de l'équipe
    SELECT p.id, p.default_team_id 
    INTO user_uuid, team_uuid
    FROM public.profiles p 
    WHERE p.email = 'steeve.clotilde@opsway.fr';
    
    IF user_uuid IS NULL OR team_uuid IS NULL THEN
        RAISE EXCEPTION 'Utilisateur ou équipe non trouvé';
    END IF;
    
    -- Ajouter des incidents de test
    INSERT INTO public.itsm_incidents (
        team_id, title, description, priority, status, created_by
    ) VALUES 
    (team_uuid, 'Serveur web en panne', 'Le serveur web principal ne répond plus depuis ce matin', 'high', 'open', user_uuid),
    (team_uuid, 'Problème de connexion réseau', 'Certains utilisateurs rapportent des problèmes de connexion', 'medium', 'in_progress', user_uuid),
    (team_uuid, 'Base de données lente', 'Les requêtes de base de données prennent beaucoup de temps', 'low', 'resolved', user_uuid);
    
    -- Ajouter des changements de test
    INSERT INTO public.itsm_change_requests (
        team_id, title, description, status, requested_by, scheduled_date
    ) VALUES 
    (team_uuid, 'Mise à jour du système', 'Mise à jour vers la nouvelle version du système', 'pending_approval', user_uuid, '2025-07-15 10:00:00'),
    (team_uuid, 'Migration serveur', 'Migration vers le nouveau serveur cloud', 'approved', user_uuid, '2025-07-20 14:00:00');
    
    RAISE NOTICE 'Données de test ITSM ajoutées pour l''utilisateur % et l''équipe %', user_uuid, team_uuid;
END $$;