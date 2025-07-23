-- Migration pour les domaines personnalisés multi-tenant
-- Permet aux administrateurs MSP de définir des URL personnalisées pour chaque ESN et leurs clients

-- Table des domaines personnalisés par tenant
CREATE TABLE IF NOT EXISTS public.tenant_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Domaine/sous-domaine personnalisé (ex: "acme-corp", "esn-alpha", "client-beta")
    domain_name TEXT NOT NULL UNIQUE,
    
    -- URL complète (ex: "acme-corp.platform.com", "esn-alpha.myapp.fr")
    full_url TEXT NOT NULL UNIQUE,
    
    -- Organisation associée (ESN ou client)
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Type de tenant
    tenant_type TEXT NOT NULL CHECK (tenant_type IN ('esn', 'client', 'msp')) DEFAULT 'client',
    
    -- Statut du domaine
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Configuration de branding personnalisé
    branding JSONB DEFAULT '{}',
    
    -- Configuration de l'interface (couleurs, logo, etc.)
    ui_config JSONB DEFAULT '{}',
    
    -- Métadonnées supplémentaires
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NOT NULL REFERENCES public.profiles(id)
);

-- Index pour les performances
CREATE INDEX idx_tenant_domains_domain_name ON public.tenant_domains(domain_name);
CREATE INDEX idx_tenant_domains_full_url ON public.tenant_domains(full_url);
CREATE INDEX idx_tenant_domains_organization_id ON public.tenant_domains(organization_id);
CREATE INDEX idx_tenant_domains_active ON public.tenant_domains(is_active) WHERE is_active = true;

-- Table de configuration des accès par tenant
CREATE TABLE IF NOT EXISTS public.tenant_access_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Référence au domaine tenant
    tenant_domain_id UUID NOT NULL REFERENCES public.tenant_domains(id) ON DELETE CASCADE,
    
    -- Organisation qui a accès (peut être différente de celle du domaine pour les relations MSP-Client)
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Type d'accès
    access_type TEXT NOT NULL CHECK (access_type IN ('full', 'limited', 'readonly')) DEFAULT 'full',
    
    -- Modules accessibles via cette URL
    allowed_modules JSONB DEFAULT '[]',
    
    -- Restrictions d'accès
    access_restrictions JSONB DEFAULT '{}',
    
    -- Actif
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Contrainte unique : un domaine peut avoir plusieurs accès mais une org ne peut avoir qu'un seul type d'accès par domaine
    UNIQUE(tenant_domain_id, organization_id)
);

-- Index pour tenant_access_config
CREATE INDEX idx_tenant_access_config_domain_id ON public.tenant_access_config(tenant_domain_id);
CREATE INDEX idx_tenant_access_config_organization_id ON public.tenant_access_config(organization_id);

-- Fonction pour résoudre le tenant basé sur le domaine
CREATE OR REPLACE FUNCTION public.resolve_tenant_by_domain(p_domain_name TEXT)
RETURNS TABLE(
    tenant_id UUID,
    organization_id UUID,
    tenant_type TEXT,
    domain_name TEXT,
    full_url TEXT,
    branding JSONB,
    ui_config JSONB,
    allowed_organizations UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        td.id as tenant_id,
        td.organization_id,
        td.tenant_type,
        td.domain_name,
        td.full_url,
        td.branding,
        td.ui_config,
        ARRAY(
            SELECT tac.organization_id 
            FROM public.tenant_access_config tac 
            WHERE tac.tenant_domain_id = td.id AND tac.is_active = true
        ) as allowed_organizations
    FROM public.tenant_domains td
    WHERE td.domain_name = p_domain_name 
       OR td.full_url = p_domain_name
       AND td.is_active = true;
END;
$$;

-- Fonction pour obtenir la configuration d'accès d'une organisation à un tenant
CREATE OR REPLACE FUNCTION public.get_tenant_access_config(
    p_tenant_domain_id UUID,
    p_organization_id UUID
)
RETURNS TABLE(
    access_type TEXT,
    allowed_modules JSONB,
    access_restrictions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tac.access_type,
        tac.allowed_modules,
        tac.access_restrictions
    FROM public.tenant_access_config tac
    WHERE tac.tenant_domain_id = p_tenant_domain_id 
      AND tac.organization_id = p_organization_id
      AND tac.is_active = true;
END;
$$;

-- RLS pour tenant_domains
ALTER TABLE public.tenant_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_domains_msp_admin_full_access" 
ON public.tenant_domains 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_msp_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_msp_admin = true
  )
);

CREATE POLICY "tenant_domains_organization_read" 
ON public.tenant_domains 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.user_id = auth.uid() 
      AND om.organization_id = tenant_domains.organization_id
  )
);

-- RLS pour tenant_access_config
ALTER TABLE public.tenant_access_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_access_config_msp_admin_full_access" 
ON public.tenant_access_config 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_msp_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_msp_admin = true
  )
);

CREATE POLICY "tenant_access_config_organization_read" 
ON public.tenant_access_config 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.user_id = auth.uid() 
      AND om.organization_id = tenant_access_config.organization_id
  )
);

-- Trigger pour updated_at
CREATE TRIGGER update_tenant_domains_updated_at
    BEFORE UPDATE ON public.tenant_domains
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_access_config_updated_at
    BEFORE UPDATE ON public.tenant_access_config
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Exemples de données pour les tests (optionnel)
-- INSERT INTO public.tenant_domains (domain_name, full_url, organization_id, tenant_type, branding, ui_config, created_by)
-- VALUES 
--   ('acme-corp', 'acme-corp.platform.msp.com', (SELECT id FROM organizations WHERE name = 'ACME Corp' LIMIT 1), 'client', 
--    '{"logo": "/logos/acme.png", "company_name": "ACME Corporation"}',
--    '{"primary_color": "#1e40af", "secondary_color": "#3b82f6", "sidebar_style": "modern"}',
--    (SELECT id FROM profiles WHERE is_msp_admin = true LIMIT 1)
--   );

COMMENT ON TABLE public.tenant_domains IS 'Domaines personnalisés pour le multi-tenancy par URL';
COMMENT ON TABLE public.tenant_access_config IS 'Configuration des accès par tenant et organisation';
COMMENT ON FUNCTION public.resolve_tenant_by_domain(TEXT) IS 'Résout le tenant basé sur le nom de domaine';
COMMENT ON FUNCTION public.get_tenant_access_config(UUID, UUID) IS 'Récupère la configuration d''accès d''une organisation à un tenant'; 