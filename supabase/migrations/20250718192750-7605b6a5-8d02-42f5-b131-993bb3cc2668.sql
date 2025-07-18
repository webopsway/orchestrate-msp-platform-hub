-- Créer les tables pour la gestion des applications et services métiers

-- Table des services métiers
CREATE TABLE public.business_services (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    criticality TEXT NOT NULL CHECK (criticality IN ('low', 'medium', 'high', 'critical')),
    business_owner TEXT,
    technical_owner TEXT,
    service_level TEXT,
    metadata JSONB DEFAULT '{}',
    team_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NOT NULL
);

-- Table des applications
CREATE TABLE public.applications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    version TEXT,
    application_type TEXT NOT NULL CHECK (application_type IN ('web', 'mobile', 'desktop', 'service', 'api', 'database', 'other')),
    technology_stack TEXT[],
    repository_url TEXT,
    documentation_url TEXT,
    business_services TEXT[], -- IDs des services métiers associés
    metadata JSONB DEFAULT '{}',
    team_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NOT NULL
);

-- Table des dépendances entre services métiers et applications
CREATE TABLE public.application_dependencies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    business_service_id UUID NOT NULL REFERENCES public.business_services(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    dependency_type TEXT NOT NULL CHECK (dependency_type IN ('strong', 'weak', 'optional')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(business_service_id, application_id)
);

-- Table des déploiements d'applications sur les assets cloud
CREATE TABLE public.application_deployments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    cloud_asset_id UUID NOT NULL, -- Référence vers les assets cloud existants
    environment_name TEXT NOT NULL,
    deployment_type TEXT NOT NULL CHECK (deployment_type IN ('production', 'staging', 'development', 'test')),
    status TEXT NOT NULL CHECK (status IN ('running', 'stopped', 'deploying', 'error')),
    version TEXT,
    configuration JSONB DEFAULT '{}',
    health_check_url TEXT,
    deployment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB DEFAULT '{}',
    team_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    deployed_by UUID NOT NULL
);

-- Indexes pour les performances
CREATE INDEX idx_business_services_team_id ON public.business_services(team_id);
CREATE INDEX idx_business_services_criticality ON public.business_services(criticality);
CREATE INDEX idx_applications_team_id ON public.applications(team_id);
CREATE INDEX idx_applications_type ON public.applications(application_type);
CREATE INDEX idx_application_deployments_team_id ON public.application_deployments(team_id);
CREATE INDEX idx_application_deployments_application_id ON public.application_deployments(application_id);
CREATE INDEX idx_application_deployments_cloud_asset_id ON public.application_deployments(cloud_asset_id);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_business_services_updated_at
    BEFORE UPDATE ON public.business_services
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_application_deployments_updated_at
    BEFORE UPDATE ON public.application_deployments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Politiques RLS
ALTER TABLE public.business_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_deployments ENABLE ROW LEVEL SECURITY;

-- Politiques pour business_services
CREATE POLICY "MSP admin accès total business_services"
    ON public.business_services
    FOR ALL
    USING (is_msp_admin())
    WITH CHECK (is_msp_admin());

CREATE POLICY "business_services_access_policy"
    ON public.business_services
    FOR ALL
    USING (
        is_msp_admin() OR
        (is_user_in_msp_organization() AND user_has_permission('applications', 'read')) OR
        (EXISTS (
            SELECT 1 FROM team_memberships tm
            WHERE tm.user_id = auth.uid() AND tm.team_id = business_services.team_id
        ))
    )
    WITH CHECK (
        is_msp_admin() OR
        (is_user_in_msp_organization() AND user_has_permission('applications', 'create')) OR
        (EXISTS (
            SELECT 1 FROM team_memberships tm
            WHERE tm.user_id = auth.uid() AND tm.team_id = business_services.team_id
        ))
    );

-- Politiques pour applications
CREATE POLICY "MSP admin accès total applications"
    ON public.applications
    FOR ALL
    USING (is_msp_admin())
    WITH CHECK (is_msp_admin());

CREATE POLICY "applications_access_policy"
    ON public.applications
    FOR ALL
    USING (
        is_msp_admin() OR
        (is_user_in_msp_organization() AND user_has_permission('applications', 'read')) OR
        (EXISTS (
            SELECT 1 FROM team_memberships tm
            WHERE tm.user_id = auth.uid() AND tm.team_id = applications.team_id
        ))
    )
    WITH CHECK (
        is_msp_admin() OR
        (is_user_in_msp_organization() AND user_has_permission('applications', 'create')) OR
        (EXISTS (
            SELECT 1 FROM team_memberships tm
            WHERE tm.user_id = auth.uid() AND tm.team_id = applications.team_id
        ))
    );

-- Politiques pour application_dependencies
CREATE POLICY "MSP admin accès total application_dependencies"
    ON public.application_dependencies
    FOR ALL
    USING (is_msp_admin())
    WITH CHECK (is_msp_admin());

CREATE POLICY "application_dependencies_access_policy"
    ON public.application_dependencies
    FOR ALL
    USING (
        is_msp_admin() OR
        (EXISTS (
            SELECT 1 FROM business_services bs, team_memberships tm
            WHERE bs.id = application_dependencies.business_service_id
            AND tm.user_id = auth.uid() AND tm.team_id = bs.team_id
        )) OR
        (EXISTS (
            SELECT 1 FROM applications a, team_memberships tm
            WHERE a.id = application_dependencies.application_id
            AND tm.user_id = auth.uid() AND tm.team_id = a.team_id
        ))
    );

-- Politiques pour application_deployments
CREATE POLICY "MSP admin accès total application_deployments"
    ON public.application_deployments
    FOR ALL
    USING (is_msp_admin())
    WITH CHECK (is_msp_admin());

CREATE POLICY "application_deployments_access_policy"
    ON public.application_deployments
    FOR ALL
    USING (
        is_msp_admin() OR
        (is_user_in_msp_organization() AND user_has_permission('applications', 'read')) OR
        (EXISTS (
            SELECT 1 FROM team_memberships tm
            WHERE tm.user_id = auth.uid() AND tm.team_id = application_deployments.team_id
        ))
    )
    WITH CHECK (
        is_msp_admin() OR
        (is_user_in_msp_organization() AND user_has_permission('applications', 'create')) OR
        (EXISTS (
            SELECT 1 FROM team_memberships tm
            WHERE tm.user_id = auth.uid() AND tm.team_id = application_deployments.team_id
        ))
    );