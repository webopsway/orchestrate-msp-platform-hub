-- Rename columns in cloud_assets table from instance_* to asset_*
ALTER TABLE public.cloud_assets RENAME COLUMN instance_id TO asset_id;
ALTER TABLE public.cloud_assets RENAME COLUMN instance_name TO asset_name;
ALTER TABLE public.cloud_assets RENAME COLUMN instance_type TO asset_type;

-- Drop existing indexes on the old column names
DROP INDEX IF EXISTS idx_cloud_assets_instance_type;

-- Create new indexes with updated column names
CREATE INDEX IF NOT EXISTS idx_cloud_assets_asset_type ON public.cloud_assets(asset_type) WHERE asset_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cloud_assets_asset_id ON public.cloud_assets(asset_id);

-- Add index on asset_name for search functionality
CREATE INDEX IF NOT EXISTS idx_cloud_assets_asset_name ON public.cloud_assets(asset_name) WHERE asset_name IS NOT NULL;