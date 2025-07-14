-- Create business tables with team_id pattern for data isolation

-- ITSM Tables with team scoping
CREATE TABLE public.itsm_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID REFERENCES public.profiles(id),
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE public.itsm_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    change_type TEXT DEFAULT 'standard' CHECK (change_type IN ('emergency', 'standard', 'normal')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'implemented', 'failed')),
    requested_by UUID NOT NULL REFERENCES public.profiles(id),
    approved_by UUID REFERENCES public.profiles(id),
    scheduled_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Infrastructure inventory with team scoping
CREATE TABLE public.cloud_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    instance_id TEXT NOT NULL,
    instance_name TEXT,
    instance_type TEXT,
    cloud_provider TEXT NOT NULL CHECK (cloud_provider IN ('aws', 'azure', 'gcp', 'other')),
    region TEXT,
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'stopped', 'terminated', 'pending')),
    tags JSONB DEFAULT '{}'::jsonb,
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_scan TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(team_id, cloud_provider, instance_id)
);

CREATE TABLE public.security_vulnerabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    cve_id TEXT,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT,
    affected_instances UUID[] DEFAULT '{}',
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'remediated', 'false_positive')),
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    remediated_at TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Backup and monitoring with team scoping
CREATE TABLE public.backup_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'differential')),
    source_path TEXT NOT NULL,
    destination TEXT NOT NULL,
    schedule_cron TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'failed', 'completed')),
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE,
    retention_days INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE public.monitoring_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    alert_name TEXT NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('metric', 'log', 'uptime', 'security')),
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'suppressed')),
    source_system TEXT,
    message TEXT,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID REFERENCES public.profiles(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Documentation with team scoping
CREATE TABLE public.infrastructure_docs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    doc_type TEXT DEFAULT 'general' CHECK (doc_type IN ('general', 'runbook', 'architecture', 'procedure', 'policy')),
    version TEXT DEFAULT '1.0',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'archived')),
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    approved_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on all business tables
ALTER TABLE public.itsm_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itsm_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infrastructure_docs ENABLE ROW LEVEL SECURITY;

-- Create universal RLS policies for team-scoped tables
-- This pattern will be applied to all future business tables

-- ITSM Incidents policies
CREATE POLICY "Users can access incidents from their current team context"
ON public.itsm_incidents FOR ALL
TO authenticated
USING (
    team_id = (SELECT current_team_id FROM public.get_current_user_session() LIMIT 1) OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_msp_admin = TRUE)
);

-- ITSM Change Requests policies
CREATE POLICY "Users can access change requests from their current team context"
ON public.itsm_change_requests FOR ALL
TO authenticated
USING (
    team_id = (SELECT current_team_id FROM public.get_current_user_session() LIMIT 1) OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_msp_admin = TRUE)
);

-- Cloud Instances policies
CREATE POLICY "Users can access cloud instances from their current team context"
ON public.cloud_instances FOR ALL
TO authenticated
USING (
    team_id = (SELECT current_team_id FROM public.get_current_user_session() LIMIT 1) OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_msp_admin = TRUE)
);

-- Security Vulnerabilities policies
CREATE POLICY "Users can access vulnerabilities from their current team context"
ON public.security_vulnerabilities FOR ALL
TO authenticated
USING (
    team_id = (SELECT current_team_id FROM public.get_current_user_session() LIMIT 1) OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_msp_admin = TRUE)
);

-- Backup Jobs policies
CREATE POLICY "Users can access backup jobs from their current team context"
ON public.backup_jobs FOR ALL
TO authenticated
USING (
    team_id = (SELECT current_team_id FROM public.get_current_user_session() LIMIT 1) OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_msp_admin = TRUE)
);

-- Monitoring Alerts policies
CREATE POLICY "Users can access monitoring alerts from their current team context"
ON public.monitoring_alerts FOR ALL
TO authenticated
USING (
    team_id = (SELECT current_team_id FROM public.get_current_user_session() LIMIT 1) OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_msp_admin = TRUE)
);

-- Infrastructure Docs policies
CREATE POLICY "Users can access documentation from their current team context"
ON public.infrastructure_docs FOR ALL
TO authenticated
USING (
    team_id = (SELECT current_team_id FROM public.get_current_user_session() LIMIT 1) OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_msp_admin = TRUE)
);

-- Add triggers for updated_at on business tables
CREATE TRIGGER update_itsm_incidents_updated_at
    BEFORE UPDATE ON public.itsm_incidents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_itsm_change_requests_updated_at
    BEFORE UPDATE ON public.itsm_change_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cloud_instances_updated_at
    BEFORE UPDATE ON public.cloud_instances
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_security_vulnerabilities_updated_at
    BEFORE UPDATE ON public.security_vulnerabilities
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_backup_jobs_updated_at
    BEFORE UPDATE ON public.backup_jobs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monitoring_alerts_updated_at
    BEFORE UPDATE ON public.monitoring_alerts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_infrastructure_docs_updated_at
    BEFORE UPDATE ON public.infrastructure_docs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Performance indexes for team-scoped queries
CREATE INDEX idx_itsm_incidents_team_id ON public.itsm_incidents(team_id);
CREATE INDEX idx_itsm_incidents_status ON public.itsm_incidents(team_id, status);
CREATE INDEX idx_itsm_change_requests_team_id ON public.itsm_change_requests(team_id);
CREATE INDEX idx_itsm_change_requests_status ON public.itsm_change_requests(team_id, status);
CREATE INDEX idx_cloud_instances_team_id ON public.cloud_instances(team_id);
CREATE INDEX idx_cloud_instances_provider ON public.cloud_instances(team_id, cloud_provider);
CREATE INDEX idx_security_vulnerabilities_team_id ON public.security_vulnerabilities(team_id);
CREATE INDEX idx_security_vulnerabilities_severity ON public.security_vulnerabilities(team_id, severity);
CREATE INDEX idx_backup_jobs_team_id ON public.backup_jobs(team_id);
CREATE INDEX idx_backup_jobs_status ON public.backup_jobs(team_id, status);
CREATE INDEX idx_monitoring_alerts_team_id ON public.monitoring_alerts(team_id);
CREATE INDEX idx_monitoring_alerts_status ON public.monitoring_alerts(team_id, status);
CREATE INDEX idx_infrastructure_docs_team_id ON public.infrastructure_docs(team_id);
CREATE INDEX idx_infrastructure_docs_type ON public.infrastructure_docs(team_id, doc_type);

-- Enable realtime for business tables
ALTER TABLE public.itsm_incidents REPLICA IDENTITY FULL;
ALTER TABLE public.itsm_change_requests REPLICA IDENTITY FULL;
ALTER TABLE public.cloud_instances REPLICA IDENTITY FULL;
ALTER TABLE public.security_vulnerabilities REPLICA IDENTITY FULL;
ALTER TABLE public.backup_jobs REPLICA IDENTITY FULL;
ALTER TABLE public.monitoring_alerts REPLICA IDENTITY FULL;
ALTER TABLE public.infrastructure_docs REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.itsm_incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.itsm_change_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cloud_instances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_vulnerabilities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.backup_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.monitoring_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.infrastructure_docs;

-- Create a helper function to validate team_id in triggers
CREATE OR REPLACE FUNCTION public.validate_team_context()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_team_id UUID;
    user_is_msp BOOLEAN;
BEGIN
    -- Get current user's session context
    SELECT current_team_id, is_msp INTO user_team_id, user_is_msp
    FROM public.get_current_user_session()
    LIMIT 1;
    
    -- If user is MSP admin, allow any team_id
    IF user_is_msp THEN
        RETURN NEW;
    END IF;
    
    -- If inserting/updating, ensure team_id matches user's current context
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.team_id != user_team_id THEN
            RAISE EXCEPTION 'Cannot create/modify records for team % when current context is team %', NEW.team_id, user_team_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Template comment for future table creation
/*
TEMPLATE FOR FUTURE BUSINESS TABLES:

CREATE TABLE public.new_business_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    -- Add your business fields here
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.new_business_table ENABLE ROW LEVEL SECURITY;

-- Standard team-scoped RLS policy
CREATE POLICY "Users can access data from their current team context"
ON public.new_business_table FOR ALL
TO authenticated
USING (
    team_id = (SELECT current_team_id FROM public.get_current_user_session() LIMIT 1) OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_msp_admin = TRUE)
);

-- Trigger for updated_at
CREATE TRIGGER update_new_business_table_updated_at
    BEFORE UPDATE ON public.new_business_table
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Performance index
CREATE INDEX idx_new_business_table_team_id ON public.new_business_table(team_id);

-- Enable realtime (optional)
ALTER TABLE public.new_business_table REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.new_business_table;
*/