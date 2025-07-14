-- Rename cloud_instances table to cloud_assets
ALTER TABLE public.cloud_instances RENAME TO cloud_assets;

-- Update indexes to reflect the new table name
-- Drop old indexes with old naming
DROP INDEX IF EXISTS idx_cloud_instances_team_id;
DROP INDEX IF EXISTS idx_cloud_instances_cloud_provider_id;

-- Create new indexes with updated naming
CREATE INDEX idx_cloud_assets_team_id ON public.cloud_assets(team_id);
CREATE INDEX idx_cloud_assets_cloud_provider_id ON public.cloud_assets(cloud_provider_id);

-- Update the trigger name for consistency
DROP TRIGGER IF EXISTS update_cloud_instances_updated_at ON public.cloud_assets;
CREATE TRIGGER update_cloud_assets_updated_at
    BEFORE UPDATE ON public.cloud_assets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add team_id to cloud_assets table if it doesn't exist (for multi-tenant isolation)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cloud_assets' 
        AND column_name = 'team_id'
    ) THEN
        ALTER TABLE public.cloud_assets ADD COLUMN team_id UUID NOT NULL REFERENCES public.teams(id);
        CREATE INDEX idx_cloud_assets_team_id_new ON public.cloud_assets(team_id);
    END IF;
    
    -- Log the migration
    RAISE LOG 'Table cloud_instances successfully renamed to cloud_assets';
END $$;

-- Enable RLS on cloud_assets for multi-tenant isolation
ALTER TABLE public.cloud_assets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cloud_assets
CREATE POLICY "cloud_assets_team_isolation" 
ON public.cloud_assets
FOR ALL
TO authenticated
USING (
  -- MSP admins can see all
  COALESCE(current_setting('app.is_msp', true)::boolean, false) = true
  OR 
  -- Users can only see cloud assets from their current team
  team_id = COALESCE(current_setting('app.current_team', true)::UUID, '00000000-0000-0000-0000-000000000000'::UUID)
)
WITH CHECK (
  -- MSP admins can create/update all
  COALESCE(current_setting('app.is_msp', true)::boolean, false) = true
  OR 
  -- Users can only create/update cloud assets in their current team
  team_id = COALESCE(current_setting('app.current_team', true)::UUID, '00000000-0000-0000-0000-000000000000'::UUID)
);

-- Manager scope policy for cloud assets
CREATE POLICY "cloud_assets_manager_scope" 
ON public.cloud_assets
FOR SELECT
TO authenticated
USING (
  -- MSP admins can see all
  COALESCE(current_setting('app.is_msp', true)::boolean, false) = true
  OR 
  -- Organization managers can see cloud assets from teams in their organizations
  EXISTS (
    SELECT 1
    FROM public.organization_memberships om
    JOIN public.teams t ON om.organization_id = t.organization_id
    WHERE om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager')
      AND t.id = public.cloud_assets.team_id
  )
);

-- Add additional useful indexes for cloud assets
CREATE INDEX IF NOT EXISTS idx_cloud_assets_status ON public.cloud_assets(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cloud_assets_instance_type ON public.cloud_assets(instance_type) WHERE instance_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cloud_assets_region ON public.cloud_assets(region) WHERE region IS NOT NULL;