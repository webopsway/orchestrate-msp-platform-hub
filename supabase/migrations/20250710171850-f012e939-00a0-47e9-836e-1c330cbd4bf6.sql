-- Create roles table
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create permissions table
CREATE TABLE public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    resource TEXT NOT NULL, -- e.g., 'users', 'organizations', 'teams'
    action TEXT NOT NULL,   -- e.g., 'view', 'create', 'update', 'delete'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create role_permissions junction table
CREATE TABLE public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    granted_by UUID, -- Could reference auth.users but nullable for system grants
    UNIQUE(role_id, permission_id)
);

-- Create user_roles table (separate from the enum-based system)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- References auth.users
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE, -- Role scope (team-specific)
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE, -- Role scope (org-specific)
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    granted_by UUID, -- Could reference auth.users
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id, role_id, team_id, organization_id)
);

-- Enable RLS on all tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Roles: Everyone can view, MSP admins can manage
CREATE POLICY "Anyone can view roles"
    ON public.roles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "MSP admins can manage roles"
    ON public.roles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.is_msp_admin = true
        )
    );

-- Permissions: Everyone can view, MSP admins can manage
CREATE POLICY "Anyone can view permissions"
    ON public.permissions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "MSP admins can manage permissions"
    ON public.permissions FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.is_msp_admin = true
        )
    );

-- Role Permissions: Everyone can view, MSP admins can manage
CREATE POLICY "Anyone can view role permissions"
    ON public.role_permissions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "MSP admins can manage role permissions"
    ON public.role_permissions FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.is_msp_admin = true
        )
    );

-- User Roles: Users can view their own, org/team managers and MSP admins can manage
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        -- MSP admins can view all
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.is_msp_admin = true
        ) OR
        -- Organization managers can view roles in their org
        (organization_id IS NOT NULL AND user_has_organization_access(organization_id)) OR
        -- Team access
        (team_id IS NOT NULL AND user_has_team_access(team_id))
    );

CREATE POLICY "Managers and MSP admins can assign roles"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (
        -- MSP admins can manage all roles
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.is_msp_admin = true
        ) OR
        -- Organization managers can assign roles in their organization
        (organization_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.organization_memberships om
            WHERE om.user_id = auth.uid() 
            AND om.organization_id = user_roles.organization_id
            AND om.role IN ('admin', 'manager')
        )) OR
        -- Team managers can assign roles in their team
        (team_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.team_memberships tm
            WHERE tm.user_id = auth.uid() 
            AND tm.team_id = user_roles.team_id
            AND tm.role = 'manager'
        ))
    );

-- Insert standard roles
INSERT INTO public.roles (name, display_name, description, is_system_role) VALUES
    ('member', 'Membre', 'Utilisateur standard avec accès en lecture', true),
    ('manager', 'Manager', 'Gestionnaire avec droits de modification', true),
    ('msp', 'MSP Admin', 'Administrateur MSP avec accès complet', true),
    ('viewer', 'Visualiseur', 'Accès en lecture seule', true),
    ('editor', 'Éditeur', 'Accès en lecture et écriture', true),
    ('admin', 'Administrateur', 'Administrateur avec droits étendus', true);

-- Insert standard permissions
INSERT INTO public.permissions (name, display_name, description, resource, action) VALUES
    -- User management
    ('users.view', 'Voir les utilisateurs', 'Consulter la liste des utilisateurs', 'users', 'view'),
    ('users.create', 'Créer des utilisateurs', 'Ajouter de nouveaux utilisateurs', 'users', 'create'),
    ('users.update', 'Modifier les utilisateurs', 'Modifier les informations utilisateur', 'users', 'update'),
    ('users.delete', 'Supprimer des utilisateurs', 'Supprimer des comptes utilisateur', 'users', 'delete'),
    
    -- Organization management
    ('organizations.view', 'Voir les organisations', 'Consulter les organisations', 'organizations', 'view'),
    ('organizations.create', 'Créer des organisations', 'Ajouter de nouvelles organisations', 'organizations', 'create'),
    ('organizations.update', 'Modifier les organisations', 'Modifier les organisations', 'organizations', 'update'),
    ('organizations.delete', 'Supprimer des organisations', 'Supprimer des organisations', 'organizations', 'delete'),
    
    -- Team management
    ('teams.view', 'Voir les équipes', 'Consulter les équipes', 'teams', 'view'),
    ('teams.create', 'Créer des équipes', 'Ajouter de nouvelles équipes', 'teams', 'create'),
    ('teams.update', 'Modifier les équipes', 'Modifier les équipes', 'teams', 'update'),
    ('teams.delete', 'Supprimer des équipes', 'Supprimer des équipes', 'teams', 'delete'),
    
    -- ITSM
    ('incidents.view', 'Voir les incidents', 'Consulter les incidents', 'incidents', 'view'),
    ('incidents.create', 'Créer des incidents', 'Signaler de nouveaux incidents', 'incidents', 'create'),
    ('incidents.update', 'Modifier les incidents', 'Mettre à jour les incidents', 'incidents', 'update'),
    ('incidents.delete', 'Supprimer des incidents', 'Supprimer des incidents', 'incidents', 'delete'),
    
    -- Infrastructure
    ('infrastructure.view', 'Voir l\'infrastructure', 'Consulter l\'inventaire infrastructure', 'infrastructure', 'view'),
    ('infrastructure.create', 'Créer des ressources', 'Ajouter des ressources infrastructure', 'infrastructure', 'create'),
    ('infrastructure.update', 'Modifier l\'infrastructure', 'Modifier les ressources', 'infrastructure', 'update'),
    ('infrastructure.delete', 'Supprimer des ressources', 'Supprimer des ressources', 'infrastructure', 'delete'),
    
    -- Monitoring
    ('monitoring.view', 'Voir la supervision', 'Consulter les données de supervision', 'monitoring', 'view'),
    ('monitoring.create', 'Créer des alertes', 'Configurer des alertes', 'monitoring', 'create'),
    ('monitoring.update', 'Modifier la supervision', 'Modifier la configuration', 'monitoring', 'update'),
    
    -- Settings
    ('settings.view', 'Voir les paramètres', 'Consulter les paramètres', 'settings', 'view'),
    ('settings.update', 'Modifier les paramètres', 'Modifier la configuration système', 'settings', 'update');

-- Assign permissions to roles
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE 
    -- Member: Basic view permissions
    (r.name = 'member' AND p.action = 'view' AND p.resource IN ('users', 'teams', 'incidents', 'infrastructure', 'monitoring')) OR
    (r.name = 'member' AND p.name IN ('incidents.create')) OR
    
    -- Viewer: All view permissions
    (r.name = 'viewer' AND p.action = 'view') OR
    
    -- Editor: View and basic CRUD except delete
    (r.name = 'editor' AND p.action IN ('view', 'create', 'update') AND p.resource NOT IN ('users', 'organizations', 'settings')) OR
    (r.name = 'editor' AND p.action = 'view' AND p.resource IN ('users', 'organizations')) OR
    
    -- Manager: All permissions except system settings and user management
    (r.name = 'manager' AND p.resource NOT IN ('settings') AND NOT (p.resource = 'users' AND p.action IN ('create', 'delete'))) OR
    (r.name = 'manager' AND p.name = 'users.view') OR
    
    -- Admin: All permissions except MSP-specific
    (r.name = 'admin' AND p.resource != 'settings') OR
    (r.name = 'admin' AND p.name = 'settings.view') OR
    
    -- MSP: All permissions
    (r.name = 'msp');

-- Add triggers for updated_at
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX idx_user_roles_team_id ON public.user_roles(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX idx_user_roles_organization_id ON public.user_roles(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_user_roles_active ON public.user_roles(is_active) WHERE is_active = true;
CREATE INDEX idx_permissions_resource_action ON public.permissions(resource, action);