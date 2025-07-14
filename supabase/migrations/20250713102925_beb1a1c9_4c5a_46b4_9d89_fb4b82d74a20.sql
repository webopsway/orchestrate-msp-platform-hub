-- Ajouter des champs spécifiques à la sécurité dans les métadonnées des incidents
-- Créer une fonction pour créer automatiquement un incident de sécurité
-- à partir d'une vulnérabilité ou d'un patch

-- Ajout de champs pour la sécurité dans les métadonnées (structure JSON)
-- Les champs incluront:
-- - ticket_type: 'security' pour identifier les tickets de sécurité
-- - vulnerability_id: référence à la vulnérabilité
-- - patch_schedule_id: référence au patch planifié
-- - remediation_plan: plan de remédiation
-- - asset_owner_team: équipe propriétaire de l'actif
-- - estimated_effort: effort estimé en heures
-- - risk_assessment: évaluation du risque

-- Créer une fonction pour créer automatiquement un ticket de sécurité
CREATE OR REPLACE FUNCTION public.create_security_incident(
    p_title TEXT,
    p_description TEXT,
    p_priority TEXT DEFAULT 'high',
    p_vulnerability_id UUID DEFAULT NULL,
    p_patch_schedule_id UUID DEFAULT NULL,
    p_remediation_plan TEXT DEFAULT NULL,
    p_asset_owner_team UUID DEFAULT NULL,
    p_estimated_effort INTEGER DEFAULT NULL,
    p_risk_assessment TEXT DEFAULT 'medium'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    incident_id UUID;
    user_team_id UUID;
    vulnerability_data JSONB;
    patch_data JSONB;
BEGIN
    -- Récupérer l'équipe de l'utilisateur actuel
    SELECT default_team_id INTO user_team_id
    FROM public.profiles
    WHERE id = auth.uid();
    
    IF user_team_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur sans équipe assignée';
    END IF;
    
    -- Récupérer les données de la vulnérabilité si fournie
    IF p_vulnerability_id IS NOT NULL THEN
        SELECT jsonb_build_object(
            'id', id,
            'title', title,
            'severity', severity,
            'cve_id', cve_id,
            'cloud_asset_id', cloud_asset_id
        ) INTO vulnerability_data
        FROM security_vulnerabilities
        WHERE id = p_vulnerability_id;
    END IF;
    
    -- Récupérer les données du patch si fourni
    IF p_patch_schedule_id IS NOT NULL THEN
        SELECT jsonb_build_object(
            'id', id,
            'description', description,
            'patch_type', patch_type,
            'scheduled_at', scheduled_at,
            'cloud_asset_id', cloud_asset_id
        ) INTO patch_data
        FROM patch_schedules
        WHERE id = p_patch_schedule_id;
    END IF;
    
    -- Créer l'incident de sécurité
    INSERT INTO public.itsm_incidents (
        title,
        description,
        priority,
        status,
        created_by,
        team_id,
        metadata
    ) VALUES (
        p_title,
        p_description,
        p_priority,
        'open',
        auth.uid(),
        user_team_id,
        jsonb_build_object(
            'ticket_type', 'security',
            'vulnerability_id', p_vulnerability_id,
            'patch_schedule_id', p_patch_schedule_id,
            'remediation_plan', p_remediation_plan,
            'asset_owner_team', p_asset_owner_team,
            'estimated_effort', p_estimated_effort,
            'risk_assessment', p_risk_assessment,
            'vulnerability_data', vulnerability_data,
            'patch_data', patch_data,
            'created_source', CASE 
                WHEN p_vulnerability_id IS NOT NULL THEN 'vulnerability'
                WHEN p_patch_schedule_id IS NOT NULL THEN 'patch'
                ELSE 'manual'
            END
        )
    ) RETURNING id INTO incident_id;
    
    RETURN incident_id;
END;
$$;