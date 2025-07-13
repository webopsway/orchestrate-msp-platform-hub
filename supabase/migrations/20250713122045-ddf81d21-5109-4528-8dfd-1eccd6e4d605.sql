-- Create cloud_accounts table for MSP-managed cloud accounts
CREATE TABLE public.cloud_accounts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    provider_id UUID NOT NULL REFERENCES public.cloud_providers(id) ON DELETE RESTRICT,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    client_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    account_identifier TEXT NOT NULL, -- AWS Account ID, Azure Subscription ID, etc.
    region TEXT,
    environment TEXT DEFAULT 'production',
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(provider_id, account_identifier, team_id)
);

-- Create cloud_account_profiles table for user access to accounts
CREATE TABLE public.cloud_account_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES public.cloud_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('viewer', 'operator', 'admin')),
    granted_by UUID NOT NULL REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}',
    UNIQUE(account_id, user_id)
);

-- Enable RLS on both tables
ALTER TABLE public.cloud_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_account_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cloud_accounts (MSP admin only management)
CREATE POLICY "cloud_accounts_read_policy" 
ON public.cloud_accounts 
FOR SELECT 
TO authenticated
USING (
    is_msp_admin() OR 
    EXISTS (
        SELECT 1 FROM team_memberships tm 
        WHERE tm.user_id = auth.uid() AND tm.team_id = cloud_accounts.team_id
    ) OR
    EXISTS (
        SELECT 1 FROM cloud_account_profiles cap 
        WHERE cap.account_id = cloud_accounts.id 
        AND cap.user_id = auth.uid() 
        AND cap.is_active = true
        AND (cap.expires_at IS NULL OR cap.expires_at > now())
    )
);

CREATE POLICY "cloud_accounts_insert_policy" 
ON public.cloud_accounts 
FOR INSERT 
TO authenticated
WITH CHECK (is_msp_admin());

CREATE POLICY "cloud_accounts_update_policy" 
ON public.cloud_accounts 
FOR UPDATE 
TO authenticated
USING (is_msp_admin());

CREATE POLICY "cloud_accounts_delete_policy" 
ON public.cloud_accounts 
FOR DELETE 
TO authenticated
USING (is_msp_admin());

-- RLS Policies for cloud_account_profiles
CREATE POLICY "cloud_account_profiles_read_policy" 
ON public.cloud_account_profiles 
FOR SELECT 
TO authenticated
USING (
    is_msp_admin() OR 
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM cloud_accounts ca 
        JOIN team_memberships tm ON ca.team_id = tm.team_id
        WHERE ca.id = cloud_account_profiles.account_id 
        AND tm.user_id = auth.uid()
        AND tm.role IN ('admin', 'owner')
    )
);

CREATE POLICY "cloud_account_profiles_insert_policy" 
ON public.cloud_account_profiles 
FOR INSERT 
TO authenticated
WITH CHECK (
    is_msp_admin() OR
    EXISTS (
        SELECT 1 FROM cloud_accounts ca 
        JOIN team_memberships tm ON ca.team_id = tm.team_id
        WHERE ca.id = cloud_account_profiles.account_id 
        AND tm.user_id = auth.uid()
        AND tm.role IN ('admin', 'owner')
    )
);

CREATE POLICY "cloud_account_profiles_update_policy" 
ON public.cloud_account_profiles 
FOR UPDATE 
TO authenticated
USING (
    is_msp_admin() OR
    EXISTS (
        SELECT 1 FROM cloud_accounts ca 
        JOIN team_memberships tm ON ca.team_id = tm.team_id
        WHERE ca.id = cloud_account_profiles.account_id 
        AND tm.user_id = auth.uid()
        AND tm.role IN ('admin', 'owner')
    )
);

CREATE POLICY "cloud_account_profiles_delete_policy" 
ON public.cloud_account_profiles 
FOR DELETE 
TO authenticated
USING (
    is_msp_admin() OR
    EXISTS (
        SELECT 1 FROM cloud_accounts ca 
        JOIN team_memberships tm ON ca.team_id = tm.team_id
        WHERE ca.id = cloud_account_profiles.account_id 
        AND tm.user_id = auth.uid()
        AND tm.role IN ('admin', 'owner')
    )
);

-- Add triggers for updated_at
CREATE TRIGGER update_cloud_accounts_updated_at
    BEFORE UPDATE ON public.cloud_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_cloud_accounts_team_id ON public.cloud_accounts(team_id);
CREATE INDEX idx_cloud_accounts_provider_id ON public.cloud_accounts(provider_id);
CREATE INDEX idx_cloud_accounts_client_org_id ON public.cloud_accounts(client_organization_id);
CREATE INDEX idx_cloud_accounts_active ON public.cloud_accounts(is_active) WHERE is_active = true;

CREATE INDEX idx_cloud_account_profiles_account_id ON public.cloud_account_profiles(account_id);
CREATE INDEX idx_cloud_account_profiles_user_id ON public.cloud_account_profiles(user_id);
CREATE INDEX idx_cloud_account_profiles_active ON public.cloud_account_profiles(is_active) WHERE is_active = true;