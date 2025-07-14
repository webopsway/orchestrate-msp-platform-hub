-- Create notification transports table
CREATE TABLE public.notification_transports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL,
    configured_by UUID NOT NULL,
    scope TEXT CHECK(scope IN ('manager','msp')) NOT NULL,
    channel TEXT CHECK(channel IN ('smtp','transactional_email','slack','teams','api')) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_notification_transports_team_id FOREIGN KEY (team_id) REFERENCES teams(id),
    CONSTRAINT fk_notification_transports_configured_by FOREIGN KEY (configured_by) REFERENCES profiles(id)
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL,
    transport_id UUID NOT NULL,
    itsm_change_request_id UUID NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    status TEXT CHECK(status IN ('pending','sent','failed')) NOT NULL DEFAULT 'pending',
    error_message TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_notifications_team_id FOREIGN KEY (team_id) REFERENCES teams(id),
    CONSTRAINT fk_notifications_transport_id FOREIGN KEY (transport_id) REFERENCES notification_transports(id),
    CONSTRAINT fk_notifications_itsm_change_request_id FOREIGN KEY (itsm_change_request_id) REFERENCES itsm_change_requests(id)
);

-- Enable RLS on both tables
ALTER TABLE public.notification_transports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_transports
CREATE POLICY "transports_team_isolation" 
ON public.notification_transports 
FOR ALL 
USING (
    COALESCE(current_setting('app.is_msp', true)::boolean, false) = true 
    OR team_id = COALESCE(current_setting('app.current_team', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid)
)
WITH CHECK (
    COALESCE(current_setting('app.is_msp', true)::boolean, false) = true 
    OR team_id = COALESCE(current_setting('app.current_team', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid)
);

CREATE POLICY "transports_manager_scope" 
ON public.notification_transports 
FOR SELECT 
USING (
    COALESCE(current_setting('app.is_msp', true)::boolean, false) = true 
    OR EXISTS (
        SELECT 1 FROM organization_memberships om
        JOIN teams t ON om.organization_id = t.organization_id
        WHERE om.user_id = auth.uid() 
        AND om.role IN ('admin', 'manager')
        AND t.id = notification_transports.team_id
    )
);

CREATE POLICY "transports_msp_access" 
ON public.notification_transports 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() 
        AND p.is_msp_admin = true
    )
);

-- RLS policies for notifications
CREATE POLICY "notifications_team_isolation" 
ON public.notifications 
FOR ALL 
USING (
    COALESCE(current_setting('app.is_msp', true)::boolean, false) = true 
    OR team_id = COALESCE(current_setting('app.current_team', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid)
)
WITH CHECK (
    COALESCE(current_setting('app.is_msp', true)::boolean, false) = true 
    OR team_id = COALESCE(current_setting('app.current_team', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid)
);

CREATE POLICY "notifications_manager_scope" 
ON public.notifications 
FOR SELECT 
USING (
    COALESCE(current_setting('app.is_msp', true)::boolean, false) = true 
    OR EXISTS (
        SELECT 1 FROM organization_memberships om
        JOIN teams t ON om.organization_id = t.organization_id
        WHERE om.user_id = auth.uid() 
        AND om.role IN ('admin', 'manager')
        AND t.id = notifications.team_id
    )
);

CREATE POLICY "notifications_msp_access" 
ON public.notifications 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() 
        AND p.is_msp_admin = true
    )
);

-- Indexes for performance
CREATE INDEX idx_notification_transports_team_id ON public.notification_transports(team_id);
CREATE INDEX idx_notification_transports_channel ON public.notification_transports(channel);
CREATE INDEX idx_notification_transports_scope ON public.notification_transports(scope);
CREATE INDEX idx_notifications_team_id ON public.notifications(team_id);
CREATE INDEX idx_notifications_status ON public.notifications(status);
CREATE INDEX idx_notifications_event_type ON public.notifications(event_type);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- Trigger for updated_at on notification_transports
CREATE TRIGGER update_notification_transports_updated_at
    BEFORE UPDATE ON public.notification_transports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create notification for ITSM events
CREATE OR REPLACE FUNCTION public.create_itsm_notification()
RETURNS TRIGGER AS $$
DECLARE
    transport_record RECORD;
BEGIN
    -- Create notifications for each active transport of the team
    FOR transport_record IN 
        SELECT id FROM public.notification_transports 
        WHERE team_id = NEW.team_id 
        AND is_active = true
        ORDER BY 
            CASE channel 
                WHEN 'smtp' THEN 1
                WHEN 'transactional_email' THEN 2
                WHEN 'slack' THEN 3
                WHEN 'teams' THEN 4
                WHEN 'api' THEN 5
            END
    LOOP
        INSERT INTO public.notifications (
            team_id,
            transport_id,
            itsm_change_request_id,
            event_type,
            payload
        ) VALUES (
            NEW.team_id,
            transport_record.id,
            NEW.id,
            CASE 
                WHEN TG_OP = 'INSERT' THEN 'pending_approval'
                WHEN TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN 
                    CASE NEW.status
                        WHEN 'approved' THEN 'approved'
                        WHEN 'implemented' THEN 'implemented'
                        WHEN 'rejected' THEN 'rejected'
                        ELSE 'status_changed'
                    END
                ELSE 'updated'
            END,
            jsonb_build_object(
                'change_request_id', NEW.id,
                'title', NEW.title,
                'description', NEW.description,
                'status', NEW.status,
                'change_type', NEW.change_type,
                'scheduled_date', NEW.scheduled_date,
                'requested_by', NEW.requested_by,
                'approved_by', NEW.approved_by
            )
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for ITSM change requests
CREATE TRIGGER create_itsm_change_notification
    AFTER INSERT OR UPDATE ON public.itsm_change_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.create_itsm_notification();