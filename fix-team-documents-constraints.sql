-- Script SQL pour corriger les contraintes de clé étrangère de team_documents
-- À exécuter dans l'interface SQL de Supabase

-- 1. Supprimer les contraintes existantes qui causent des problèmes
ALTER TABLE public.team_documents 
DROP CONSTRAINT IF EXISTS documentation_created_by_fkey;

ALTER TABLE public.team_documents 
DROP CONSTRAINT IF EXISTS documentation_updated_by_fkey;

ALTER TABLE public.team_documents 
DROP CONSTRAINT IF EXISTS documentation_team_id_fkey;

-- 2. Recréer les contraintes avec les bons noms
ALTER TABLE public.team_documents 
ADD CONSTRAINT team_documents_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;

ALTER TABLE public.team_documents 
ADD CONSTRAINT team_documents_updated_by_fkey 
FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.team_documents 
ADD CONSTRAINT team_documents_team_id_fkey 
FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

-- 3. Supprimer les anciennes politiques RLS
DROP POLICY IF EXISTS "docs_team_and_msp_access" ON public.team_documents;
DROP POLICY IF EXISTS "docs_esn_readonly_access" ON public.team_documents;
DROP POLICY IF EXISTS "msp_users_can_access_documentation" ON public.team_documents;

-- 4. Créer une nouvelle politique simplifiée avec le nouveau système de rôles
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
    -- Accès pour les managers de l'organisation propriétaire de l'équipe (nouveau système de rôles)
    (EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        JOIN teams t ON ur.organization_id = t.organization_id
        WHERE ur.user_id = auth.uid() 
        AND r.name IN ('admin', 'manager')
        AND ur.is_active = true
        AND (ur.expires_at IS NULL OR ur.expires_at > now())
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
    -- Managers de l'organisation peuvent créer/modifier (nouveau système de rôles)
    (EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        JOIN teams t ON ur.organization_id = t.organization_id
        WHERE ur.user_id = auth.uid() 
        AND r.name IN ('admin', 'manager')
        AND ur.is_active = true
        AND (ur.expires_at IS NULL OR ur.expires_at > now())
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
    ))
);

-- 5. Ajouter des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_team_documents_created_by ON public.team_documents(created_by);
CREATE INDEX IF NOT EXISTS idx_team_documents_team_id ON public.team_documents(team_id);
CREATE INDEX IF NOT EXISTS idx_team_documents_created_at ON public.team_documents(created_at);

-- 6. Vérifier que RLS est activé
ALTER TABLE public.team_documents ENABLE ROW LEVEL SECURITY;

-- 7. Afficher un message de confirmation
SELECT 'Contraintes de team_documents corrigées avec succès!' as message; 