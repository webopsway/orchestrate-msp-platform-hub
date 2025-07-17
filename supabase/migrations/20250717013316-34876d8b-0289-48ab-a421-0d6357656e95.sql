-- Supprimer la politique existante et créer des politiques plus spécifiques
DROP POLICY IF EXISTS "Team members can access their document blocks" ON public.document_content_blocks;

-- Politique pour la lecture
CREATE POLICY "Team members can read their document blocks" 
ON public.document_content_blocks 
FOR SELECT 
USING (
  is_msp_admin() OR 
  (is_user_in_msp_organization() AND user_has_permission('documentation'::text, 'read'::text)) OR 
  (EXISTS (
    SELECT 1 FROM team_memberships tm
    WHERE tm.user_id = auth.uid() AND tm.team_id = document_content_blocks.team_id
  ))
);

-- Politique pour l'insertion
CREATE POLICY "Team members can create document blocks" 
ON public.document_content_blocks 
FOR INSERT 
WITH CHECK (
  is_msp_admin() OR 
  (is_user_in_msp_organization() AND user_has_permission('documentation'::text, 'create'::text)) OR 
  (EXISTS (
    SELECT 1 FROM team_memberships tm
    WHERE tm.user_id = auth.uid() AND tm.team_id = document_content_blocks.team_id
  ))
);

-- Politique pour la mise à jour
CREATE POLICY "Team members can update their document blocks" 
ON public.document_content_blocks 
FOR UPDATE 
USING (
  is_msp_admin() OR 
  (is_user_in_msp_organization() AND user_has_permission('documentation'::text, 'update'::text)) OR 
  (EXISTS (
    SELECT 1 FROM team_memberships tm
    WHERE tm.user_id = auth.uid() AND tm.team_id = document_content_blocks.team_id
  ))
)
WITH CHECK (
  is_msp_admin() OR 
  (is_user_in_msp_organization() AND user_has_permission('documentation'::text, 'update'::text)) OR 
  (EXISTS (
    SELECT 1 FROM team_memberships tm
    WHERE tm.user_id = auth.uid() AND tm.team_id = document_content_blocks.team_id
  ))
);

-- Politique pour la suppression
CREATE POLICY "Team members can delete their document blocks" 
ON public.document_content_blocks 
FOR DELETE 
USING (
  is_msp_admin() OR 
  (is_user_in_msp_organization() AND user_has_permission('documentation'::text, 'delete'::text)) OR 
  (EXISTS (
    SELECT 1 FROM team_memberships tm
    WHERE tm.user_id = auth.uid() AND tm.team_id = document_content_blocks.team_id
  ))
);