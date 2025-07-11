-- Créer la table pour les demandes de service ITSM
CREATE TABLE public.itsm_service_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'cancelled')),
    requested_by UUID NOT NULL REFERENCES public.profiles(id),
    assigned_to UUID REFERENCES public.profiles(id),
    team_id UUID NOT NULL REFERENCES public.teams(id),
    service_category TEXT DEFAULT 'general',
    urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
    impact TEXT DEFAULT 'medium' CHECK (impact IN ('low', 'medium', 'high', 'critical')),
    resolution TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Activer RLS
ALTER TABLE public.itsm_service_requests ENABLE ROW LEVEL SECURITY;

-- Créer la politique d'accès
CREATE POLICY "itsm_service_requests_access_policy"
ON public.itsm_service_requests
FOR ALL
TO authenticated
USING (
    is_msp_admin() OR 
    team_id = (
        SELECT current_team_id 
        FROM get_current_user_session() 
        LIMIT 1
    )
)
WITH CHECK (
    is_msp_admin() OR 
    team_id = (
        SELECT current_team_id 
        FROM get_current_user_session() 
        LIMIT 1
    )
);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_itsm_service_requests_updated_at
    BEFORE UPDATE ON public.itsm_service_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Créer un index pour améliorer les performances
CREATE INDEX idx_itsm_service_requests_team_id ON public.itsm_service_requests(team_id);
CREATE INDEX idx_itsm_service_requests_status ON public.itsm_service_requests(status);
CREATE INDEX idx_itsm_service_requests_assigned_to ON public.itsm_service_requests(assigned_to);
CREATE INDEX idx_itsm_service_requests_requested_by ON public.itsm_service_requests(requested_by);

-- Trigger pour auto-assignation des demandes créées par l'utilisateur
CREATE OR REPLACE FUNCTION auto_set_resolved_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour la date de résolution quand le statut change vers 'resolved' ou 'closed'
    IF NEW.status IN ('resolved', 'closed') AND OLD.status NOT IN ('resolved', 'closed') THEN
        NEW.resolved_at = now();
    ELSIF NEW.status NOT IN ('resolved', 'closed') THEN
        NEW.resolved_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_set_resolved_date
    BEFORE UPDATE ON public.itsm_service_requests
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_resolved_date();