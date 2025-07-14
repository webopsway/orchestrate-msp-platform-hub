-- Create app_settings table for global MSP configuration
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    namespace TEXT NOT NULL,
    key TEXT NOT NULL,
    value JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT unique_team_namespace_key UNIQUE(team_id, namespace, key)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_settings_team_id ON public.app_settings(team_id);
CREATE INDEX IF NOT EXISTS idx_app_settings_namespace ON public.app_settings(namespace);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(key);

-- Enable RLS on app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: MSP sees everything, teams see only their own settings
CREATE POLICY "settings_isolation" ON public.app_settings
    FOR ALL
    USING (
        -- MSP admins can see and modify everything
        COALESCE(current_setting('app.is_msp', true)::boolean, false) = true
        OR
        -- Teams can only see their own settings
        team_id = COALESCE(current_setting('app.current_team', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid)
        OR
        -- Global settings (team_id IS NULL) are readable by everyone
        (team_id IS NULL)
    )
    WITH CHECK (
        -- Only MSP admins can create/modify settings
        COALESCE(current_setting('app.is_msp', true)::boolean, false) = true
        OR
        -- Teams can only create/modify their own settings (not global ones)
        (team_id IS NOT NULL AND team_id = COALESCE(current_setting('app.current_team', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid))
    );

-- Add trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON public.app_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- RPC Function: Get all namespaces
CREATE OR REPLACE FUNCTION public.get_namespaces()
RETURNS TABLE(namespace TEXT, is_global BOOLEAN, setting_count BIGINT)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT 
        s.namespace,
        (COUNT(*) FILTER (WHERE s.team_id IS NULL) > 0) as is_global,
        COUNT(*) as setting_count
    FROM public.app_settings s
    GROUP BY s.namespace
    ORDER BY s.namespace;
$$;

-- RPC Function: Get keys by namespace
CREATE OR REPLACE FUNCTION public.get_keys_by_namespace(p_namespace TEXT)
RETURNS TABLE(key TEXT, has_global BOOLEAN, has_team BOOLEAN, team_count BIGINT)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT 
        s.key,
        (COUNT(*) FILTER (WHERE s.team_id IS NULL) > 0) as has_global,
        (COUNT(*) FILTER (WHERE s.team_id IS NOT NULL) > 0) as has_team,
        COUNT(*) FILTER (WHERE s.team_id IS NOT NULL) as team_count
    FROM public.app_settings s
    WHERE s.namespace = p_namespace
    GROUP BY s.key
    ORDER BY s.key;
$$;

-- RPC Function: Get setting with inheritance (team setting overrides global)
CREATE OR REPLACE FUNCTION public.get_setting(
    p_team_id UUID,
    p_namespace TEXT,
    p_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
    setting_value JSONB;
BEGIN
    -- First try to get team-specific setting
    IF p_team_id IS NOT NULL THEN
        SELECT value INTO setting_value
        FROM public.app_settings
        WHERE team_id = p_team_id 
        AND namespace = p_namespace 
        AND key = p_key;
        
        -- If found, return it
        IF setting_value IS NOT NULL THEN
            RETURN setting_value;
        END IF;
    END IF;
    
    -- If no team setting found, try global setting
    SELECT value INTO setting_value
    FROM public.app_settings
    WHERE team_id IS NULL 
    AND namespace = p_namespace 
    AND key = p_key;
    
    -- Return global setting or NULL if not found
    RETURN setting_value;
END;
$$;

-- RPC Function: Set setting (global or team-specific)
CREATE OR REPLACE FUNCTION public.set_setting(
    p_team_id UUID,
    p_namespace TEXT,
    p_key TEXT,
    p_value JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    setting_id UUID;
    user_is_msp BOOLEAN;
BEGIN
    -- Check if user is MSP admin
    SELECT is_msp_admin INTO user_is_msp
    FROM public.profiles
    WHERE id = auth.uid();
    
    -- For global settings (team_id IS NULL), only MSP admins can modify
    IF p_team_id IS NULL AND NOT user_is_msp THEN
        RAISE EXCEPTION 'Only MSP admins can modify global settings';
    END IF;
    
    -- For team settings, check access
    IF p_team_id IS NOT NULL AND NOT user_is_msp THEN
        -- Check if user has access to the team
        IF NOT EXISTS (
            SELECT 1 FROM team_memberships tm
            WHERE tm.user_id = auth.uid() AND tm.team_id = p_team_id
            UNION
            SELECT 1 FROM organization_memberships om
            JOIN teams t ON om.organization_id = t.organization_id
            WHERE om.user_id = auth.uid() 
            AND om.role IN ('admin', 'manager')
            AND t.id = p_team_id
        ) THEN
            RAISE EXCEPTION 'Access denied to team %', p_team_id;
        END IF;
    END IF;
    
    -- Insert or update setting
    INSERT INTO public.app_settings (team_id, namespace, key, value)
    VALUES (p_team_id, p_namespace, p_key, p_value)
    ON CONFLICT (team_id, namespace, key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = now()
    RETURNING id INTO setting_id;
    
    RETURN setting_id;
END;
$$;

-- RPC Function: Delete setting
CREATE OR REPLACE FUNCTION public.delete_setting(
    p_team_id UUID,
    p_namespace TEXT,
    p_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_is_msp BOOLEAN;
    deleted_count INTEGER;
BEGIN
    -- Check if user is MSP admin
    SELECT is_msp_admin INTO user_is_msp
    FROM public.profiles
    WHERE id = auth.uid();
    
    -- For global settings (team_id IS NULL), only MSP admins can delete
    IF p_team_id IS NULL AND NOT user_is_msp THEN
        RAISE EXCEPTION 'Only MSP admins can delete global settings';
    END IF;
    
    -- For team settings, check access
    IF p_team_id IS NOT NULL AND NOT user_is_msp THEN
        -- Check if user has access to the team
        IF NOT EXISTS (
            SELECT 1 FROM team_memberships tm
            WHERE tm.user_id = auth.uid() AND tm.team_id = p_team_id
            UNION
            SELECT 1 FROM organization_memberships om
            JOIN teams t ON om.organization_id = t.organization_id
            WHERE om.user_id = auth.uid() 
            AND om.role IN ('admin', 'manager')
            AND t.id = p_team_id
        ) THEN
            RAISE EXCEPTION 'Access denied to team %', p_team_id;
        END IF;
    END IF;
    
    -- Delete the setting
    DELETE FROM public.app_settings
    WHERE team_id = p_team_id 
    AND namespace = p_namespace 
    AND key = p_key;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count > 0;
END;
$$;

-- Insert some default global settings for demonstration
INSERT INTO public.app_settings (team_id, namespace, key, value) VALUES
(NULL, 'ui', 'theme', '"default"'),
(NULL, 'ui', 'logo_url', '"https://example.com/logo.png"'),
(NULL, 'security', 'session_timeout', '3600'),
(NULL, 'notifications', 'email_enabled', 'true'),
(NULL, 'notifications', 'slack_webhook_url', '""'),
(NULL, 'backup', 'retention_days', '30'),
(NULL, 'backup', 'auto_backup', 'true')
ON CONFLICT (team_id, namespace, key) DO NOTHING;