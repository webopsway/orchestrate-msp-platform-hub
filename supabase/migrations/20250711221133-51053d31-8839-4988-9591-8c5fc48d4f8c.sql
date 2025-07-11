-- Supprimer l'ancienne politique RLS
DROP POLICY IF EXISTS "itsm_service_requests_access_policy" ON public.itsm_service_requests;

-- Créer de nouvelles politiques RLS pour les demandes de service basées sur les rôles organisationnels

-- Politique pour la lecture (SELECT)
CREATE POLICY "itsm_service_requests_read_policy"
ON public.itsm_service_requests
FOR SELECT
TO authenticated
USING (
    -- MSP Admins peuvent voir tout
    is_msp_admin() OR 
    
    -- Équipes MSP peuvent voir les tickets de tous leurs clients
    (
        EXISTS (
            SELECT 1 FROM public.user_sessions us
            JOIN public.teams t ON t.id = us.current_team_id
            JOIN public.organizations o ON o.id = t.organization_id
            WHERE us.user_id = auth.uid() 
            AND o.is_msp = true
            AND EXISTS (
                SELECT 1 FROM public.teams client_team
                JOIN public.organizations client_org ON client_org.id = client_team.organization_id
                WHERE client_team.id = itsm_service_requests.team_id
                AND EXISTS (
                    SELECT 1 FROM public.msp_client_relations mcr
                    WHERE mcr.msp_organization_id = o.id
                    AND mcr.client_organization_id = client_org.id
                    AND mcr.is_active = true
                )
            )
        )
    ) OR
    
    -- Équipes ESN peuvent voir les tickets des clients qu'ils gèrent
    (
        EXISTS (
            SELECT 1 FROM public.user_sessions us
            JOIN public.teams t ON t.id = us.current_team_id
            JOIN public.organizations o ON o.id = t.organization_id
            WHERE us.user_id = auth.uid() 
            AND o.type = 'esn'
            AND EXISTS (
                SELECT 1 FROM public.teams client_team
                JOIN public.organizations client_org ON client_org.id = client_team.organization_id
                WHERE client_team.id = itsm_service_requests.team_id
                AND EXISTS (
                    SELECT 1 FROM public.msp_client_relations mcr
                    WHERE mcr.esn_organization_id = o.id
                    AND mcr.client_organization_id = client_org.id
                    AND mcr.is_active = true
                )
            )
        )
    ) OR
    
    -- Clients peuvent voir seulement leurs propres tickets d'équipe
    (
        team_id = (
            SELECT current_team_id 
            FROM public.get_current_user_session() 
            LIMIT 1
        )
    )
);

-- Politique pour l'insertion (INSERT)
CREATE POLICY "itsm_service_requests_insert_policy"
ON public.itsm_service_requests
FOR INSERT
TO authenticated
WITH CHECK (
    -- MSP Admins peuvent créer partout
    is_msp_admin() OR 
    
    -- Équipes MSP peuvent créer des tickets pour tous leurs clients
    (
        EXISTS (
            SELECT 1 FROM public.user_sessions us
            JOIN public.teams t ON t.id = us.current_team_id
            JOIN public.organizations o ON o.id = t.organization_id
            WHERE us.user_id = auth.uid() 
            AND o.is_msp = true
            AND EXISTS (
                SELECT 1 FROM public.teams client_team
                JOIN public.organizations client_org ON client_org.id = client_team.organization_id
                WHERE client_team.id = itsm_service_requests.team_id
                AND EXISTS (
                    SELECT 1 FROM public.msp_client_relations mcr
                    WHERE mcr.msp_organization_id = o.id
                    AND mcr.client_organization_id = client_org.id
                    AND mcr.is_active = true
                )
            )
        )
    ) OR
    
    -- Équipes ESN peuvent créer des tickets pour les clients qu'ils gèrent
    (
        EXISTS (
            SELECT 1 FROM public.user_sessions us
            JOIN public.teams t ON t.id = us.current_team_id
            JOIN public.organizations o ON o.id = t.organization_id
            WHERE us.user_id = auth.uid() 
            AND o.type = 'esn'
            AND EXISTS (
                SELECT 1 FROM public.teams client_team
                JOIN public.organizations client_org ON client_org.id = client_team.organization_id
                WHERE client_team.id = itsm_service_requests.team_id
                AND EXISTS (
                    SELECT 1 FROM public.msp_client_relations mcr
                    WHERE mcr.esn_organization_id = o.id
                    AND mcr.client_organization_id = client_org.id
                    AND mcr.is_active = true
                )
            )
        )
    ) OR
    
    -- Clients peuvent créer des tickets seulement pour leur équipe
    (
        team_id = (
            SELECT current_team_id 
            FROM public.get_current_user_session() 
            LIMIT 1
        )
    )
);

-- Politique pour la mise à jour (UPDATE)
CREATE POLICY "itsm_service_requests_update_policy"
ON public.itsm_service_requests
FOR UPDATE
TO authenticated
USING (
    -- MSP Admins peuvent modifier tout
    is_msp_admin() OR 
    
    -- Équipes MSP peuvent modifier les tickets de tous leurs clients
    (
        EXISTS (
            SELECT 1 FROM public.user_sessions us
            JOIN public.teams t ON t.id = us.current_team_id
            JOIN public.organizations o ON o.id = t.organization_id
            WHERE us.user_id = auth.uid() 
            AND o.is_msp = true
            AND EXISTS (
                SELECT 1 FROM public.teams client_team
                JOIN public.organizations client_org ON client_org.id = client_team.organization_id
                WHERE client_team.id = itsm_service_requests.team_id
                AND EXISTS (
                    SELECT 1 FROM public.msp_client_relations mcr
                    WHERE mcr.msp_organization_id = o.id
                    AND mcr.client_organization_id = client_org.id
                    AND mcr.is_active = true
                )
            )
        )
    ) OR
    
    -- Équipes ESN peuvent modifier les tickets des clients qu'ils gèrent
    (
        EXISTS (
            SELECT 1 FROM public.user_sessions us
            JOIN public.teams t ON t.id = us.current_team_id
            JOIN public.organizations o ON o.id = t.organization_id
            WHERE us.user_id = auth.uid() 
            AND o.type = 'esn'
            AND EXISTS (
                SELECT 1 FROM public.teams client_team
                JOIN public.organizations client_org ON client_org.id = client_team.organization_id
                WHERE client_team.id = itsm_service_requests.team_id
                AND EXISTS (
                    SELECT 1 FROM public.msp_client_relations mcr
                    WHERE mcr.esn_organization_id = o.id
                    AND mcr.client_organization_id = client_org.id
                    AND mcr.is_active = true
                )
            )
        )
    ) OR
    
    -- Clients peuvent modifier seulement leurs propres tickets d'équipe
    (
        team_id = (
            SELECT current_team_id 
            FROM public.get_current_user_session() 
            LIMIT 1
        )
    )
);

-- Politique pour la suppression (DELETE)
CREATE POLICY "itsm_service_requests_delete_policy"
ON public.itsm_service_requests
FOR DELETE
TO authenticated
USING (
    -- Seuls les MSP Admins peuvent supprimer
    is_msp_admin()
);