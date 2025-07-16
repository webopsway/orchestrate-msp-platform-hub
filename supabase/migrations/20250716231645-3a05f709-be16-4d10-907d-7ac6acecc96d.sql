-- Update RLS policies for cloud_environments to allow authenticated users to manage environments
DROP POLICY IF EXISTS "MSP admin accès total cloud_environments" ON public.cloud_environments;
DROP POLICY IF EXISTS "Authenticated users can read cloud_environments" ON public.cloud_environments;

-- Allow authenticated users to read cloud_environments
CREATE POLICY "Authenticated users can read cloud_environments" 
ON public.cloud_environments FOR SELECT 
TO authenticated 
USING (is_active = true);

-- Allow MSP admins and team members to manage cloud_environments
CREATE POLICY "MSP admins and team members can manage cloud_environments" 
ON public.cloud_environments FOR ALL 
TO authenticated 
USING (
  is_msp_admin() OR 
  EXISTS (
    SELECT 1 FROM team_memberships tm 
    WHERE tm.user_id = auth.uid()
  )
)
WITH CHECK (
  is_msp_admin() OR 
  EXISTS (
    SELECT 1 FROM team_memberships tm 
    WHERE tm.user_id = auth.uid()
  )
);