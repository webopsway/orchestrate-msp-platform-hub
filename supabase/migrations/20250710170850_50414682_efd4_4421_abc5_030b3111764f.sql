-- Create function to set PostgreSQL session variables
CREATE OR REPLACE FUNCTION public.set_app_session_variables(
    p_team_id UUID DEFAULT NULL,
    p_is_msp BOOLEAN DEFAULT FALSE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Set app.current_team variable
    IF p_team_id IS NOT NULL THEN
        PERFORM set_config('app.current_team', p_team_id::text, false);
    ELSE
        PERFORM set_config('app.current_team', '', false);
    END IF;
    
    -- Set app.is_msp variable
    PERFORM set_config('app.is_msp', p_is_msp::text, false);
    
    -- Log for debugging
    RAISE LOG 'Session variables set: app.current_team=%, app.is_msp=%', 
        COALESCE(p_team_id::text, 'NULL'), p_is_msp;
END;
$$;

-- Create function to get current session variables
CREATE OR REPLACE FUNCTION public.get_app_session_variables()
RETURNS TABLE(current_team UUID, is_msp BOOLEAN)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN current_setting('app.current_team', true) = '' THEN NULL::UUID
            ELSE current_setting('app.current_team', true)::UUID
        END as current_team,
        COALESCE(current_setting('app.is_msp', true)::BOOLEAN, false) as is_msp;
END;
$$;

-- Create function to initialize user session with both database record and session variables
CREATE OR REPLACE FUNCTION public.initialize_user_session(
    p_organization_id UUID DEFAULT NULL,
    p_team_id UUID DEFAULT NULL
)
RETURNS TABLE(
    user_id UUID,
    organization_id UUID,
    team_id UUID,
    is_msp BOOLEAN,
    success BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_is_msp BOOLEAN := FALSE;
    v_final_org_id UUID;
    v_final_team_id UUID;
BEGIN
    -- Check if user is MSP admin
    SELECT is_msp_admin INTO v_is_msp
    FROM public.profiles
    WHERE id = v_user_id;
    
    -- Get default values if not provided
    IF p_organization_id IS NULL OR p_team_id IS NULL THEN
        SELECT 
            COALESCE(p_organization_id, default_organization_id),
            COALESCE(p_team_id, default_team_id)
        INTO v_final_org_id, v_final_team_id
        FROM public.profiles
        WHERE id = v_user_id;
    ELSE
        v_final_org_id := p_organization_id;
        v_final_team_id := p_team_id;
    END IF;
    
    -- Verify access permissions (skip if MSP admin)
    IF NOT v_is_msp THEN
        -- Check organization access
        IF v_final_org_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM public.organization_memberships
            WHERE user_id = v_user_id AND organization_id = v_final_org_id
        ) THEN
            RAISE EXCEPTION 'Access denied to organization %', v_final_org_id;
        END IF;
        
        -- Check team access
        IF v_final_team_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM public.team_memberships
            WHERE user_id = v_user_id AND team_id = v_final_team_id
        ) THEN
            RAISE EXCEPTION 'Access denied to team %', v_final_team_id;
        END IF;
    END IF;
    
    -- Set session variables in PostgreSQL
    PERFORM public.set_app_session_variables(v_final_team_id, v_is_msp);
    
    -- Update user_sessions table for persistence
    PERFORM public.set_user_session_context(v_final_org_id, v_final_team_id);
    
    -- Return session information
    RETURN QUERY
    SELECT 
        v_user_id,
        v_final_org_id,
        v_final_team_id,
        v_is_msp,
        true as success;
END;
$$;

-- Create function to test session variables (for debugging)
CREATE OR REPLACE FUNCTION public.test_session_variables()
RETURNS TABLE(
    current_team_var TEXT,
    is_msp_var TEXT,
    parsed_team UUID,
    parsed_is_msp BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        current_setting('app.current_team', true) as current_team_var,
        current_setting('app.is_msp', true) as is_msp_var,
        CASE 
            WHEN current_setting('app.current_team', true) = '' THEN NULL::UUID
            ELSE current_setting('app.current_team', true)::UUID
        END as parsed_team,
        COALESCE(current_setting('app.is_msp', true)::BOOLEAN, false) as parsed_is_msp;
END;
$$;