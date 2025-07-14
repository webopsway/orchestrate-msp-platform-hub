-- Mise à jour des politiques RLS pour permettre l'accès ESN aux documentations des clients

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "docs_team_isolation" ON public.documentation;
DROP POLICY IF EXISTS "docs_manager_scope" ON public.documentation;
DROP POLICY IF EXISTS "docs_msp_access" ON public.documentation;

-- Nouvelle politique pour l'accès aux documents basée sur les relations MSP-Client-ESN
CREATE POLICY "docs_team_and_msp_access" 
ON public.documentation 
FOR ALL 
USING (
    -- MSP admin a accès à tout
    (EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() 
        AND p.is_msp_admin = true
    ))
    OR
    -- Accès pour les membres de l'équipe propriétaire du document
    (EXISTS (
        SELECT 1 FROM team_memberships tm
        WHERE tm.user_id = auth.uid() 
        AND tm.team_id = documentation.team_id
    ))
    OR
    -- Accès pour les managers de l'organisation propriétaire de l'équipe
    (EXISTS (
        SELECT 1 FROM organization_memberships om
        JOIN teams t ON om.organization_id = t.organization_id
        WHERE om.user_id = auth.uid() 
        AND om.role IN ('admin', 'manager')
        AND t.id = documentation.team_id
    ))
    OR
    -- Nouvelle règle: Accès ESN aux documents des clients via les relations MSP
    (EXISTS (
        SELECT 1 FROM msp_client_relations mcr
        JOIN teams client_team ON mcr.client_organization_id = client_team.organization_id
        JOIN organization_memberships esn_om ON mcr.esn_organization_id = esn_om.organization_id
        WHERE esn_om.user_id = auth.uid()
        AND client_team.id = documentation.team_id
        AND mcr.is_active = true
        AND (mcr.end_date IS NULL OR mcr.end_date > now())
    ))
)
WITH CHECK (
    -- MSP admin peut créer/modifier partout
    (EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() 
        AND p.is_msp_admin = true
    ))
    OR
    -- Membres de l'équipe peuvent créer/modifier
    (EXISTS (
        SELECT 1 FROM team_memberships tm
        WHERE tm.user_id = auth.uid() 
        AND tm.team_id = documentation.team_id
    ))
    OR
    -- Managers de l'organisation peuvent créer/modifier
    (EXISTS (
        SELECT 1 FROM organization_memberships om
        JOIN teams t ON om.organization_id = t.organization_id
        WHERE om.user_id = auth.uid() 
        AND om.role IN ('admin', 'manager')
        AND t.id = documentation.team_id
    ))
);

-- Politique spécifique pour la lecture seule des ESN sur les documents clients
CREATE POLICY "docs_esn_readonly_access" 
ON public.documentation 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM msp_client_relations mcr
        JOIN teams client_team ON mcr.client_organization_id = client_team.organization_id
        JOIN organization_memberships esn_om ON mcr.esn_organization_id = esn_om.organization_id
        WHERE esn_om.user_id = auth.uid()
        AND client_team.id = documentation.team_id
        AND mcr.is_active = true
        AND (mcr.end_date IS NULL OR mcr.end_date > now())
        AND esn_om.role IN ('admin', 'manager', 'technician')
    )
);

-- Mise à jour des politiques de stockage pour inclure l'accès ESN
DROP POLICY IF EXISTS "Users can view their team documents" ON storage.objects;

CREATE POLICY "Users can view team and client documents" 
ON storage.objects 
FOR SELECT 
USING (
    bucket_id = 'documents' 
    AND (
        -- MSP admin accès total
        (EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() 
            AND p.is_msp_admin = true
        ))
        OR
        -- Accès à l'équipe courante
        ((storage.foldername(name))[1]::uuid IN (
            SELECT tm.team_id 
            FROM team_memberships tm 
            WHERE tm.user_id = auth.uid()
        ))
        OR
        -- Accès ESN aux documents des clients
        ((storage.foldername(name))[1]::uuid IN (
            SELECT client_team.id
            FROM msp_client_relations mcr
            JOIN teams client_team ON mcr.client_organization_id = client_team.organization_id
            JOIN organization_memberships esn_om ON mcr.esn_organization_id = esn_om.organization_id
            WHERE esn_om.user_id = auth.uid()
            AND mcr.is_active = true
            AND (mcr.end_date IS NULL OR mcr.end_date > now())
        ))
    )
);