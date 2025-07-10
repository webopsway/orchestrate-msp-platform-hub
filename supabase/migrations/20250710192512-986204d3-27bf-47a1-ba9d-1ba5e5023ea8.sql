-- Create cloud_credentials table for multi-tenant cloud orchestration
CREATE TABLE IF NOT EXISTS public.cloud_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL,
    provider_id UUID NOT NULL REFERENCES public.cloud_providers(id) ON DELETE CASCADE,
    config JSONB NOT NULL DEFAULT '{}',
    configured_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT unique_team_provider UNIQUE(team_id, provider_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cloud_credentials_team_id ON public.cloud_credentials(team_id);
CREATE INDEX IF NOT EXISTS idx_cloud_credentials_provider_id ON public.cloud_credentials(provider_id);

-- Enable RLS on cloud_credentials
ALTER TABLE public.cloud_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Team isolation with MSP access
CREATE POLICY "creds_team_isolation" ON public.cloud_credentials
    FOR ALL
    USING (
        COALESCE(current_setting('app.is_msp', true)::boolean, false) = true
        OR team_id = COALESCE(current_setting('app.current_team', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid)
    )
    WITH CHECK (
        COALESCE(current_setting('app.is_msp', true)::boolean, false) = true
        OR team_id = COALESCE(current_setting('app.current_team', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid)
    );

-- Manager scope policy: Allow organization managers to manage credentials
CREATE POLICY "creds_manager_scope" ON public.cloud_credentials
    FOR SELECT
    USING (
        COALESCE(current_setting('app.is_msp', true)::boolean, false) = true
        OR EXISTS (
            SELECT 1 FROM organization_memberships om
            JOIN teams t ON om.organization_id = t.organization_id
            WHERE om.user_id = auth.uid() 
            AND om.role IN ('admin', 'manager')
            AND t.id = cloud_credentials.team_id
        )
    );

-- MSP access policy: Full access for MSP admins
CREATE POLICY "creds_msp_access" ON public.cloud_credentials
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.is_msp_admin = true
        )
    );

-- Add trigger for updated_at
CREATE TRIGGER update_cloud_credentials_updated_at
    BEFORE UPDATE ON public.cloud_credentials
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create backup_executions table for tracking backup tasks
CREATE TABLE IF NOT EXISTS public.backup_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL,
    provider_id UUID NOT NULL REFERENCES public.cloud_providers(id),
    task_type TEXT NOT NULL CHECK (task_type IN ('inventory', 'backup', 'restore')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    result_data JSONB DEFAULT '{}',
    triggered_by UUID NOT NULL,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_backup_executions_team_id ON public.backup_executions(team_id);
CREATE INDEX IF NOT EXISTS idx_backup_executions_status ON public.backup_executions(status);

-- Enable RLS on backup_executions
ALTER TABLE public.backup_executions ENABLE ROW LEVEL SECURITY;

-- Team isolation policy for backup executions
CREATE POLICY "backup_executions_team_isolation" ON public.backup_executions
    FOR ALL
    USING (
        COALESCE(current_setting('app.is_msp', true)::boolean, false) = true
        OR team_id = COALESCE(current_setting('app.current_team', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid)
    )
    WITH CHECK (
        COALESCE(current_setting('app.is_msp', true)::boolean, false) = true
        OR team_id = COALESCE(current_setting('app.current_team', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid)
    );

-- RPC Functions for triggering cloud orchestration tasks
CREATE OR REPLACE FUNCTION public.trigger_team_inventory(p_team_id UUID, p_provider_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    execution_id UUID;
    user_is_msp BOOLEAN;
    has_access BOOLEAN := false;
BEGIN
    -- Check if user is MSP admin
    SELECT is_msp_admin INTO user_is_msp
    FROM public.profiles
    WHERE id = auth.uid();
    
    -- Check access permissions
    IF user_is_msp THEN
        has_access := true;
    ELSE
        -- Check if user has access to the team
        SELECT EXISTS (
            SELECT 1 FROM team_memberships tm
            WHERE tm.user_id = auth.uid() AND tm.team_id = p_team_id
            UNION
            SELECT 1 FROM organization_memberships om
            JOIN teams t ON om.organization_id = t.organization_id
            WHERE om.user_id = auth.uid() 
            AND om.role IN ('admin', 'manager')
            AND t.id = p_team_id
        ) INTO has_access;
    END IF;
    
    IF NOT has_access THEN
        RAISE EXCEPTION 'Access denied to team %', p_team_id;
    END IF;
    
    -- Verify credentials exist for this team/provider
    IF NOT EXISTS (
        SELECT 1 FROM public.cloud_credentials 
        WHERE team_id = p_team_id AND provider_id = p_provider_id
    ) THEN
        RAISE EXCEPTION 'No credentials configured for team % and provider %', p_team_id, p_provider_id;
    END IF;
    
    -- Create execution record
    INSERT INTO public.backup_executions (
        team_id, provider_id, task_type, triggered_by
    ) VALUES (
        p_team_id, p_provider_id, 'inventory', auth.uid()
    ) RETURNING id INTO execution_id;
    
    -- Notify edge function (will be caught by the orchestration function)
    PERFORM pg_notify('cloud_orchestration', json_build_object(
        'execution_id', execution_id,
        'task_type', 'inventory',
        'team_id', p_team_id,
        'provider_id', p_provider_id
    )::text);
    
    RETURN execution_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_team_backup(p_team_id UUID, p_provider_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    execution_id UUID;
    user_is_msp BOOLEAN;
    has_access BOOLEAN := false;
BEGIN
    -- Check if user is MSP admin
    SELECT is_msp_admin INTO user_is_msp
    FROM public.profiles
    WHERE id = auth.uid();
    
    -- Check access permissions
    IF user_is_msp THEN
        has_access := true;
    ELSE
        -- Check if user has access to the team
        SELECT EXISTS (
            SELECT 1 FROM team_memberships tm
            WHERE tm.user_id = auth.uid() AND tm.team_id = p_team_id
            UNION
            SELECT 1 FROM organization_memberships om
            JOIN teams t ON om.organization_id = t.organization_id
            WHERE om.user_id = auth.uid() 
            AND om.role IN ('admin', 'manager')
            AND t.id = p_team_id
        ) INTO has_access;
    END IF;
    
    IF NOT has_access THEN
        RAISE EXCEPTION 'Access denied to team %', p_team_id;
    END IF;
    
    -- Verify credentials exist for this team/provider
    IF NOT EXISTS (
        SELECT 1 FROM public.cloud_credentials 
        WHERE team_id = p_team_id AND provider_id = p_provider_id
    ) THEN
        RAISE EXCEPTION 'No credentials configured for team % and provider %', p_team_id, p_provider_id;
    END IF;
    
    -- Create execution record
    INSERT INTO public.backup_executions (
        team_id, provider_id, task_type, triggered_by
    ) VALUES (
        p_team_id, p_provider_id, 'backup', auth.uid()
    ) RETURNING id INTO execution_id;
    
    -- Notify edge function
    PERFORM pg_notify('cloud_orchestration', json_build_object(
        'execution_id', execution_id,
        'task_type', 'backup',
        'team_id', p_team_id,
        'provider_id', p_provider_id
    )::text);
    
    RETURN execution_id;
END;
$$;

-- Function to update execution status (called by edge function)
CREATE OR REPLACE FUNCTION public.update_execution_status(
    p_execution_id UUID,
    p_status TEXT,
    p_error_message TEXT DEFAULT NULL,
    p_result_data JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.backup_executions
    SET 
        status = p_status,
        completed_at = CASE WHEN p_status IN ('completed', 'failed') THEN now() ELSE completed_at END,
        error_message = p_error_message,
        result_data = COALESCE(p_result_data, result_data)
    WHERE id = p_execution_id;
    
    -- Create monitoring alert for failures
    IF p_status = 'failed' THEN
        INSERT INTO public.monitoring_alerts (
            alert_name,
            alert_type,
            severity,
            message,
            team_id,
            metadata
        )
        SELECT 
            'Cloud Orchestration Failed',
            'orchestration',
            'high',
            format('Cloud orchestration task failed: %s', COALESCE(p_error_message, 'Unknown error')),
            be.team_id,
            jsonb_build_object(
                'execution_id', p_execution_id,
                'task_type', be.task_type,
                'provider_id', be.provider_id,
                'error_message', p_error_message
            )
        FROM public.backup_executions be
        WHERE be.id = p_execution_id;
    END IF;
END;
$$;