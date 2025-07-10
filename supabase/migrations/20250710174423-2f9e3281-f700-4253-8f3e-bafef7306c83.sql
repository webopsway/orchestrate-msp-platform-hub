-- Rename cloud_assets table to cloud_asset (singular)
ALTER TABLE public.cloud_assets RENAME TO cloud_asset;

-- Update indexes to reflect new table name
DROP INDEX IF EXISTS idx_cloud_assets_team_id;
DROP INDEX IF EXISTS idx_cloud_assets_cloud_provider_id;
DROP INDEX IF EXISTS idx_cloud_assets_status;
DROP INDEX IF EXISTS idx_cloud_assets_asset_type;
DROP INDEX IF EXISTS idx_cloud_assets_asset_id;
DROP INDEX IF EXISTS idx_cloud_assets_asset_name;
DROP INDEX IF EXISTS idx_cloud_assets_region;

-- Recreate indexes with new table name
CREATE INDEX IF NOT EXISTS idx_cloud_asset_team_id ON public.cloud_asset(team_id);
CREATE INDEX IF NOT EXISTS idx_cloud_asset_cloud_provider_id ON public.cloud_asset(cloud_provider_id);
CREATE INDEX IF NOT EXISTS idx_cloud_asset_status ON public.cloud_asset(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cloud_asset_asset_type ON public.cloud_asset(asset_type) WHERE asset_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cloud_asset_asset_id ON public.cloud_asset(asset_id);
CREATE INDEX IF NOT EXISTS idx_cloud_asset_asset_name ON public.cloud_asset(asset_name) WHERE asset_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cloud_asset_region ON public.cloud_asset(region) WHERE region IS NOT NULL;

-- Update trigger name
DROP TRIGGER IF EXISTS update_cloud_assets_updated_at ON public.cloud_asset;
CREATE TRIGGER update_cloud_asset_updated_at
    BEFORE UPDATE ON public.cloud_asset
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update RLS policies
DROP POLICY IF EXISTS "Users can access cloud instances from their current team contex" ON public.cloud_asset;
DROP POLICY IF EXISTS "cloud_assets_team_isolation" ON public.cloud_asset;
DROP POLICY IF EXISTS "cloud_assets_manager_scope" ON public.cloud_asset;

-- Recreate RLS policies with updated names
CREATE POLICY "Users can access cloud instances from their current team context"
    ON public.cloud_asset
    FOR ALL
    TO authenticated
    USING (
        team_id = (
            SELECT current_team_id FROM public.get_current_user_session() LIMIT 1
        ) OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.is_msp_admin = true
        )
    );

CREATE POLICY "cloud_asset_team_isolation"
    ON public.cloud_asset
    FOR ALL
    TO authenticated
    USING (
        COALESCE(current_setting('app.is_msp', true)::boolean, false) = true OR
        team_id = COALESCE(current_setting('app.current_team', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid)
    )
    WITH CHECK (
        COALESCE(current_setting('app.is_msp', true)::boolean, false) = true OR
        team_id = COALESCE(current_setting('app.current_team', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid)
    );

CREATE POLICY "cloud_asset_manager_scope"
    ON public.cloud_asset
    FOR SELECT
    TO authenticated
    USING (
        COALESCE(current_setting('app.is_msp', true)::boolean, false) = true OR
        EXISTS (
            SELECT 1
            FROM organization_memberships om
            JOIN teams t ON om.organization_id = t.organization_id
            WHERE om.user_id = auth.uid()
            AND om.role IN ('admin', 'manager')
            AND t.id = cloud_asset.team_id
        )
    );