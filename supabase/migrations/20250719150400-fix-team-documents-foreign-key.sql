-- Migration pour corriger les contraintes de clé étrangère de team_documents
-- Permettre aux utilisateurs MSP de créer des documents pour n'importe quelle équipe

-- 1. Supprimer la contrainte existante qui peut causer des problèmes
ALTER TABLE public.team_documents 
DROP CONSTRAINT IF EXISTS documentation_created_by_fkey;

-- 2. Recréer la contrainte sans vérification d'appartenance à l'équipe
-- (l'utilisateur doit juste exister dans profiles)
ALTER TABLE public.team_documents 
ADD CONSTRAINT team_documents_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;

-- 3. Supprimer et recréer la contrainte updated_by si elle existe
ALTER TABLE public.team_documents 
DROP CONSTRAINT IF EXISTS documentation_updated_by_fkey;

ALTER TABLE public.team_documents 
ADD CONSTRAINT team_documents_updated_by_fkey 
FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 4. Supprimer et recréer la contrainte team_id
ALTER TABLE public.team_documents 
DROP CONSTRAINT IF EXISTS documentation_team_id_fkey;

ALTER TABLE public.team_documents 
ADD CONSTRAINT team_documents_team_id_fkey 
FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

-- 5. Mettre à jour les politiques RLS pour s'assurer qu'elles fonctionnent correctement
-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "docs_team_and_msp_access" ON public.team_documents;
DROP POLICY IF EXISTS "docs_esn_readonly_access" ON public.team_documents;
DROP POLICY IF EXISTS "msp_users_can_access_documentation" ON public.team_documents;

-- Créer une nouvelle politique simplifiée qui permet aux MSP de créer des documents partout
CREATE POLICY "team_documents_msp_and_team_access" 
ON public.team_documents 
FOR ALL 
USING (
    -- MSP admin a accès total
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
        AND tm.team_id = team_documents.team_id
    ))
    OR
    -- Accès pour les managers de l'organisation propriétaire de l'équipe
    (EXISTS (
        SELECT 1 FROM organization_memberships om
        JOIN teams t ON om.organization_id = t.organization_id
        WHERE om.user_id = auth.uid() 
        AND om.role IN ('admin', 'manager')
        AND t.id = team_documents.team_id
    ))
    OR
    -- Accès ESN aux documents des clients via les relations MSP
    (EXISTS (
        SELECT 1 FROM msp_client_relations mcr
        JOIN teams client_team ON mcr.client_organization_id = client_team.organization_id
        JOIN organization_memberships esn_om ON mcr.esn_organization_id = esn_om.organization_id
        WHERE esn_om.user_id = auth.uid()
        AND client_team.id = team_documents.team_id
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
        AND tm.team_id = team_documents.team_id
    ))
    OR
    -- Managers de l'organisation peuvent créer/modifier
    (EXISTS (
        SELECT 1 FROM organization_memberships om
        JOIN teams t ON om.organization_id = t.organization_id
        WHERE om.user_id = auth.uid() 
        AND om.role IN ('admin', 'manager')
        AND t.id = team_documents.team_id
    ))
    OR
    -- ESN peuvent créer/modifier dans les équipes clients via les relations MSP
    (EXISTS (
        SELECT 1 FROM msp_client_relations mcr
        JOIN teams client_team ON mcr.client_organization_id = client_team.organization_id
        JOIN organization_memberships esn_om ON mcr.esn_organization_id = esn_om.organization_id
        WHERE esn_om.user_id = auth.uid()
        AND client_team.id = team_documents.team_id
        AND mcr.is_active = true
        AND (mcr.end_date IS NULL OR mcr.end_date > now())
        AND esn_om.role IN ('admin', 'manager')
    ))
);

-- 6. Ajouter un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_team_documents_created_by ON public.team_documents(created_by);
CREATE INDEX IF NOT EXISTS idx_team_documents_team_id ON public.team_documents(team_id);
CREATE INDEX IF NOT EXISTS idx_team_documents_created_at ON public.team_documents(created_at);

-- 7. Vérifier que RLS est activé
ALTER TABLE public.team_documents ENABLE ROW LEVEL SECURITY; 