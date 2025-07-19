-- Fix RLS policy for document_content_blocks to allow authenticated users to create blocks
-- Drop existing restrictive INSERT policy
DROP POLICY IF EXISTS "Team members can create document blocks" ON public.document_content_blocks;

-- Create new INSERT policy that allows authenticated users to create blocks in their team
CREATE POLICY "Allow document block creation for team members" 
ON public.document_content_blocks 
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
        AND tm.team_id = document_content_blocks.team_id
      )
    )
  )
);