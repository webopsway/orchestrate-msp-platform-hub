-- Ajouter les politiques RLS pour la documentation pour permettre l'accès MSP avec permissions

-- D'abord, supprimer les politiques existantes pour éviter les conflits
DROP POLICY IF EXISTS "msp_admins_full_access_documentation" ON public.documentation;

-- Créer une politique pour les utilisateurs MSP avec permissions de lire les documentations
CREATE POLICY "msp_users_can_access_documentation"
ON public.documentation
FOR ALL
TO authenticated
USING (
    -- MSP admin a accès total
    is_msp_admin() OR
    -- Utilisateurs MSP dans l'organisation MSP avec permissions appropriées
    (
        is_user_in_msp_organization() AND
        user_has_permission('documentation', 'read') AND
        (
            -- Accès direct aux documentations de leur équipe
            EXISTS (
                SELECT 1 FROM team_memberships tm
                WHERE tm.user_id = auth.uid() 
                AND tm.team_id = documentation.team_id
            ) OR
            -- Accès aux documentations des équipes clients via les relations MSP
            EXISTS (
                SELECT 1 FROM msp_client_relations mcr
                JOIN teams client_team ON mcr.client_organization_id = client_team.organization_id
                JOIN organization_memberships msp_om ON mcr.msp_organization_id = msp_om.organization_id
                WHERE msp_om.user_id = auth.uid()
                AND client_team.id = documentation.team_id
                AND mcr.is_active = true
                AND (mcr.end_date IS NULL OR mcr.end_date > now())
            ) OR
            -- Accès aux documentations des équipes ESN via les relations MSP
            EXISTS (
                SELECT 1 FROM msp_client_relations mcr
                JOIN teams esn_team ON mcr.esn_organization_id = esn_team.organization_id
                JOIN organization_memberships msp_om ON mcr.msp_organization_id = msp_om.organization_id
                WHERE msp_om.user_id = auth.uid()
                AND esn_team.id = documentation.team_id
                AND mcr.is_active = true
                AND (mcr.end_date IS NULL OR mcr.end_date > now())
            )
        )
    ) OR
    -- Membres de l'équipe propriétaire du document
    EXISTS (
        SELECT 1 FROM team_memberships tm
        WHERE tm.user_id = auth.uid() 
        AND tm.team_id = documentation.team_id
    ) OR
    -- Managers de l'organisation propriétaire de l'équipe
    EXISTS (
        SELECT 1 FROM organization_memberships om
        JOIN teams t ON om.organization_id = t.organization_id
        WHERE om.user_id = auth.uid() 
        AND t.id = documentation.team_id
    )
)
WITH CHECK (
    -- MSP admin peut créer/modifier partout
    is_msp_admin() OR
    -- Utilisateurs MSP avec permissions de création
    (
        is_user_in_msp_organization() AND
        user_has_permission('documentation', 'create') AND
        (
            -- Peuvent créer dans leur équipe
            EXISTS (
                SELECT 1 FROM team_memberships tm
                WHERE tm.user_id = auth.uid() 
                AND tm.team_id = documentation.team_id
            ) OR
            -- Peuvent créer dans les équipes clients via les relations MSP
            EXISTS (
                SELECT 1 FROM msp_client_relations mcr
                JOIN teams client_team ON mcr.client_organization_id = client_team.organization_id
                JOIN organization_memberships msp_om ON mcr.msp_organization_id = msp_om.organization_id
                WHERE msp_om.user_id = auth.uid()
                AND client_team.id = documentation.team_id
                AND mcr.is_active = true
                AND (mcr.end_date IS NULL OR mcr.end_date > now())
            ) OR
            -- Peuvent créer dans les équipes ESN via les relations MSP
            EXISTS (
                SELECT 1 FROM msp_client_relations mcr
                JOIN teams esn_team ON mcr.esn_organization_id = esn_team.organization_id
                JOIN organization_memberships msp_om ON mcr.msp_organization_id = msp_om.organization_id
                WHERE msp_om.user_id = auth.uid()
                AND esn_team.id = documentation.team_id
                AND mcr.is_active = true
                AND (mcr.end_date IS NULL OR mcr.end_date > now())
            )
        )
    ) OR
    -- Membres de l'équipe peuvent créer/modifier
    EXISTS (
        SELECT 1 FROM team_memberships tm
        WHERE tm.user_id = auth.uid() 
        AND tm.team_id = documentation.team_id
    ) OR
    -- Managers de l'organisation peuvent créer/modifier
    EXISTS (
        SELECT 1 FROM organization_memberships om
        JOIN teams t ON om.organization_id = t.organization_id
        WHERE om.user_id = auth.uid() 
        AND t.id = documentation.team_id
    )
);