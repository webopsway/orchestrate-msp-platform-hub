-- Create custom types for roles and statuses
CREATE TYPE public.organization_type AS ENUM ('client', 'esn', 'msp');
CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'technician', 'user');
CREATE TYPE public.team_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- Organizations table (clients, ESN, MSP)
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type organization_type NOT NULL,
    parent_organization_id UUID REFERENCES public.organizations(id),
    is_msp BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Teams within organizations
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- User profiles with organization and team context
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    default_organization_id UUID REFERENCES public.organizations(id),
    default_team_id UUID REFERENCES public.teams(id),
    is_msp_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- User memberships in organizations
CREATE TABLE public.organization_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, organization_id)
);

-- User memberships in teams
CREATE TABLE public.team_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    role team_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, team_id)
);

-- Session context table for RLS variables
CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    current_organization_id UUID REFERENCES public.organizations(id),
    current_team_id UUID REFERENCES public.teams(id),
    is_msp BOOLEAN DEFAULT FALSE,
    session_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '24 hours')
);

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_session()
RETURNS TABLE(
    current_organization_id UUID,
    current_team_id UUID,
    is_msp BOOLEAN
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT 
        us.current_organization_id,
        us.current_team_id,
        us.is_msp
    FROM public.user_sessions us
    WHERE us.user_id = auth.uid()
    AND us.expires_at > now()
    ORDER BY us.updated_at DESC
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_has_organization_access(org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organization_memberships om
        WHERE om.user_id = auth.uid() 
        AND om.organization_id = org_id
    ) OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() 
        AND p.is_msp_admin = TRUE
    );
$$;

CREATE OR REPLACE FUNCTION public.user_has_team_access(team_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.team_memberships tm
        WHERE tm.user_id = auth.uid() 
        AND tm.team_id = team_id
    ) OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() 
        AND p.is_msp_admin = TRUE
    );
$$;

-- RLS Policies for Organizations
CREATE POLICY "Users can view organizations they belong to or MSP admins can view all"
ON public.organizations FOR SELECT
TO authenticated
USING (
    public.user_has_organization_access(id) OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_msp_admin = TRUE)
);

CREATE POLICY "MSP admins can manage all organizations"
ON public.organizations FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_msp_admin = TRUE));

-- RLS Policies for Teams
CREATE POLICY "Users can view teams they belong to or have organization access"
ON public.teams FOR SELECT
TO authenticated
USING (
    public.user_has_team_access(id) OR
    public.user_has_organization_access(organization_id)
);

CREATE POLICY "Organization admins and MSP admins can manage teams"
ON public.teams FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.organization_memberships om
        WHERE om.user_id = auth.uid() 
        AND om.organization_id = teams.organization_id
        AND om.role IN ('admin', 'manager')
    ) OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_msp_admin = TRUE)
);

-- RLS Policies for Profiles
CREATE POLICY "Users can view their own profile and MSP admins can view all"
ON public.profiles FOR SELECT
TO authenticated
USING (
    id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_msp_admin = TRUE)
);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- RLS Policies for Organization Memberships
CREATE POLICY "Users can view memberships for organizations they belong to"
ON public.organization_memberships FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR
    public.user_has_organization_access(organization_id)
);

-- RLS Policies for Team Memberships
CREATE POLICY "Users can view memberships for teams they belong to"
ON public.team_memberships FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR
    public.user_has_team_access(team_id)
);

-- RLS Policies for User Sessions
CREATE POLICY "Users can manage their own sessions"
ON public.user_sessions FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name'
    );
    RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update session context
CREATE OR REPLACE FUNCTION public.set_user_session_context(
    p_organization_id UUID DEFAULT NULL,
    p_team_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_msp BOOLEAN := FALSE;
BEGIN
    -- Check if user is MSP admin
    SELECT is_msp_admin INTO v_is_msp
    FROM public.profiles
    WHERE id = auth.uid();

    -- Insert or update user session
    INSERT INTO public.user_sessions (
        user_id,
        current_organization_id,
        current_team_id,
        is_msp,
        updated_at,
        expires_at
    )
    VALUES (
        auth.uid(),
        p_organization_id,
        p_team_id,
        v_is_msp,
        now(),
        now() + interval '24 hours'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        current_organization_id = EXCLUDED.current_organization_id,
        current_team_id = EXCLUDED.current_team_id,
        is_msp = EXCLUDED.is_msp,
        updated_at = now(),
        expires_at = now() + interval '24 hours';
END;
$$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at
    BEFORE UPDATE ON public.user_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default MSP organization
INSERT INTO public.organizations (name, type, is_msp) 
VALUES ('MSP Global', 'msp', TRUE);

-- Indexes for performance
CREATE INDEX idx_organizations_type ON public.organizations(type);
CREATE INDEX idx_organizations_parent ON public.organizations(parent_organization_id);
CREATE INDEX idx_teams_organization ON public.teams(organization_id);
CREATE INDEX idx_profiles_default_org ON public.profiles(default_organization_id);
CREATE INDEX idx_org_memberships_user ON public.organization_memberships(user_id);
CREATE INDEX idx_org_memberships_org ON public.organization_memberships(organization_id);
CREATE INDEX idx_team_memberships_user ON public.team_memberships(user_id);
CREATE INDEX idx_team_memberships_team ON public.team_memberships(team_id);
CREATE INDEX idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON public.user_sessions(expires_at);