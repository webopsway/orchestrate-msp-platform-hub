-- Vérifier et corriger les politiques RLS pour team_documents

-- D'abord, activer RLS sur team_documents si pas déjà fait
ALTER TABLE public.team_documents ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "MSP admin accès total team_documents" ON public.team_documents;
DROP POLICY IF EXISTS "Team members can access their documents" ON public.team_documents;
DROP POLICY IF EXISTS "Team members can create documents" ON public.team_documents;
DROP POLICY IF EXISTS "Team members can update their documents" ON public.team_documents;
DROP POLICY IF EXISTS "Team members can delete their documents" ON public.team_documents;

-- Créer une politique complète pour MSP admin
CREATE POLICY "MSP admin accès total team_documents" 
ON public.team_documents 
FOR ALL 
USING (is_msp_admin())
WITH CHECK (is_msp_admin());

-- Politique pour la lecture des documents
CREATE POLICY "Team members can read their documents" 
ON public.team_documents 
FOR SELECT 
USING (
  is_msp_admin() 
  OR (
    is_user_in_msp_organization() 
    AND user_has_permission('documentation'::text, 'read'::text)
  ) 
  OR (
    EXISTS (
      SELECT 1 
      FROM team_memberships tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.team_id = team_documents.team_id
    )
  )
);

-- Politique pour la création de documents
CREATE POLICY "Team members can create documents" 
ON public.team_documents 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    is_msp_admin() 
    OR (
      is_user_in_msp_organization() 
      AND user_has_permission('documentation'::text, 'create'::text)
    ) 
    OR (
      EXISTS (
        SELECT 1 
        FROM team_memberships tm 
        WHERE tm.user_id = auth.uid() 
        AND tm.team_id = team_documents.team_id
      )
    )
  )
);

-- Politique pour la mise à jour des documents
CREATE POLICY "Team members can update their documents" 
ON public.team_documents 
FOR UPDATE 
USING (
  is_msp_admin() 
  OR (
    is_user_in_msp_organization() 
    AND user_has_permission('documentation'::text, 'update'::text)
  ) 
  OR (
    EXISTS (
      SELECT 1 
      FROM team_memberships tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.team_id = team_documents.team_id
    )
  )
)
WITH CHECK (
  is_msp_admin() 
  OR (
    is_user_in_msp_organization() 
    AND user_has_permission('documentation'::text, 'update'::text)
  ) 
  OR (
    EXISTS (
      SELECT 1 
      FROM team_memberships tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.team_id = team_documents.team_id
    )
  )
);

-- Politique pour la suppression des documents
CREATE POLICY "Team members can delete their documents" 
ON public.team_documents 
FOR DELETE 
USING (
  is_msp_admin() 
  OR (
    is_user_in_msp_organization() 
    AND user_has_permission('documentation'::text, 'delete'::text)
  ) 
  OR (
    EXISTS (
      SELECT 1 
      FROM team_memberships tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.team_id = team_documents.team_id
    )
  )
);