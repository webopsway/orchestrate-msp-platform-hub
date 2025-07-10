-- Create cloud_providers table
CREATE TABLE public.cloud_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    api_endpoint TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on cloud_providers
ALTER TABLE public.cloud_providers ENABLE ROW LEVEL SECURITY;

-- RLS policies for cloud_providers (readable by all authenticated users, manageable by MSP admins)
CREATE POLICY "All authenticated users can view cloud providers"
    ON public.cloud_providers
    FOR SELECT
    TO authenticated
    USING (is_active = true);

CREATE POLICY "MSP admins can manage cloud providers"
    ON public.cloud_providers
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.is_msp_admin = true
        )
    );

-- Insert default cloud providers
INSERT INTO public.cloud_providers (name, display_name, api_endpoint) VALUES
    ('aws', 'Amazon Web Services', 'https://ec2.amazonaws.com'),
    ('azure', 'Microsoft Azure', 'https://management.azure.com'),
    ('gcp', 'Google Cloud Platform', 'https://compute.googleapis.com'),
    ('oracle', 'Oracle Cloud Infrastructure', 'https://iaas.cloud.oracle.com'),
    ('digitalocean', 'DigitalOcean', 'https://api.digitalocean.com'),
    ('vultr', 'Vultr', 'https://api.vultr.com'),
    ('linode', 'Linode', 'https://api.linode.com'),
    ('other', 'Other Provider', null);

-- Modify cloud_instances table to reference cloud_providers
ALTER TABLE public.cloud_instances 
    DROP CONSTRAINT IF EXISTS cloud_instances_cloud_provider_check,
    ADD COLUMN cloud_provider_id UUID REFERENCES public.cloud_providers(id);

-- Update existing records to reference the new cloud_providers table
UPDATE public.cloud_instances 
SET cloud_provider_id = (
    SELECT id FROM public.cloud_providers 
    WHERE name = cloud_instances.cloud_provider
);

-- Make cloud_provider_id NOT NULL after data migration
ALTER TABLE public.cloud_instances 
    ALTER COLUMN cloud_provider_id SET NOT NULL,
    DROP COLUMN cloud_provider;

-- Add trigger for updated_at on cloud_providers
CREATE TRIGGER update_cloud_providers_updated_at
    BEFORE UPDATE ON public.cloud_providers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_cloud_instances_cloud_provider_id ON public.cloud_instances(cloud_provider_id);
CREATE INDEX idx_cloud_providers_name ON public.cloud_providers(name);
CREATE INDEX idx_cloud_providers_active ON public.cloud_providers(is_active) WHERE is_active = true;