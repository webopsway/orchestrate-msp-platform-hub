-- Create patch_schedules table
CREATE TABLE public.patch_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cloud_asset_id UUID NOT NULL REFERENCES public.cloud_asset(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    patch_type TEXT DEFAULT 'security',
    description TEXT,
    created_by UUID REFERENCES public.profiles(id),
    team_id UUID NOT NULL REFERENCES public.teams(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT patch_schedules_status_check CHECK (status IN ('scheduled', 'in_progress', 'completed', 'failed', 'cancelled'))
);

-- Add cloud_asset_id to security_vulnerabilities table if not exists
ALTER TABLE public.security_vulnerabilities 
ADD COLUMN IF NOT EXISTS cloud_asset_id UUID REFERENCES public.cloud_asset(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_patch_schedules_cloud_asset_id ON public.patch_schedules(cloud_asset_id);
CREATE INDEX IF NOT EXISTS idx_patch_schedules_scheduled_at ON public.patch_schedules(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_patch_schedules_status ON public.patch_schedules(status);
CREATE INDEX IF NOT EXISTS idx_patch_schedules_team_id ON public.patch_schedules(team_id);

CREATE INDEX IF NOT EXISTS idx_security_vulnerabilities_cloud_asset_id ON public.security_vulnerabilities(cloud_asset_id) WHERE cloud_asset_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_security_vulnerabilities_cve_id ON public.security_vulnerabilities(cve_id) WHERE cve_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_security_vulnerabilities_status ON public.security_vulnerabilities(status);

-- Enable RLS on patch_schedules
ALTER TABLE public.patch_schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for patch_schedules

-- Team isolation policy
CREATE POLICY "patch_schedules_team_isolation"
    ON public.patch_schedules
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

-- Manager scope policy
CREATE POLICY "patch_schedules_manager_scope"
    ON public.patch_schedules
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
            AND t.id = patch_schedules.team_id
        )
    );

-- MSP admin policy
CREATE POLICY "patch_schedules_msp_access"
    ON public.patch_schedules
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.is_msp_admin = true
        )
    );

-- Add trigger for updated_at on patch_schedules
CREATE TRIGGER update_patch_schedules_updated_at
    BEFORE UPDATE ON public.patch_schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add constraint to ensure scheduled_at is in the future for new schedules
CREATE OR REPLACE FUNCTION validate_patch_schedule_time()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.scheduled_at <= now() THEN
        RAISE EXCEPTION 'Scheduled time must be in the future';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_patch_schedule_time_trigger
    BEFORE INSERT ON public.patch_schedules
    FOR EACH ROW
    EXECUTE FUNCTION validate_patch_schedule_time();

-- Create function to automatically create security tickets from vulnerabilities
CREATE OR REPLACE FUNCTION create_security_ticket_from_vulnerability()
RETURNS TRIGGER AS $$
DECLARE
    ticket_title TEXT;
    ticket_description TEXT;
BEGIN
    -- Create a descriptive title and description
    ticket_title := 'Security Vulnerability: ' || COALESCE(NEW.cve_id, 'Unknown CVE');
    ticket_description := format(
        'Vulnerability detected: %s\nSeverity: %s\nCVE ID: %s\nAsset ID: %s\nDiscovered: %s',
        COALESCE(NEW.title, 'Unknown vulnerability'),
        NEW.severity,
        COALESCE(NEW.cve_id, 'N/A'),
        COALESCE(NEW.cloud_asset_id::text, 'N/A'),
        COALESCE(NEW.discovered_at::text, now()::text)
    );

    -- Create an incident ticket automatically
    INSERT INTO public.itsm_incidents (
        title,
        description,
        priority,
        status,
        created_by,
        team_id,
        metadata
    ) VALUES (
        ticket_title,
        ticket_description,
        CASE 
            WHEN NEW.severity IN ('critical', 'high') THEN 'high'
            WHEN NEW.severity = 'medium' THEN 'medium'
            ELSE 'low'
        END,
        'open',
        auth.uid(),
        NEW.team_id,
        jsonb_build_object(
            'vulnerability_id', NEW.id,
            'cve_id', NEW.cve_id,
            'auto_created', true,
            'source', 'vulnerability_scanner'
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create tickets for new vulnerabilities
CREATE TRIGGER auto_create_security_ticket
    AFTER INSERT ON public.security_vulnerabilities
    FOR EACH ROW
    EXECUTE FUNCTION create_security_ticket_from_vulnerability();