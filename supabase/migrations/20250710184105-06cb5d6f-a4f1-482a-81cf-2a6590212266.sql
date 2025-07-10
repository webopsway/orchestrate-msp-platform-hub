-- Create uptime_checks table
CREATE TABLE public.uptime_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  status TEXT NOT NULL DEFAULT 'unknown',
  response_time INTEGER,
  status_code INTEGER,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  next_check TIMESTAMP WITH TIME ZONE DEFAULT now() + INTERVAL '5 minutes',
  check_interval INTEGER NOT NULL DEFAULT 300,
  timeout_seconds INTEGER NOT NULL DEFAULT 30,
  expected_status_codes INTEGER[] DEFAULT ARRAY[200],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.uptime_checks ENABLE ROW LEVEL SECURITY;

-- Team isolation policy
CREATE POLICY "uptime_checks_team_isolation" 
ON public.uptime_checks 
FOR ALL 
USING (
  COALESCE(current_setting('app.is_msp', true)::boolean, false) = true 
  OR team_id = COALESCE(current_setting('app.current_team', true)::uuid, '00000000-0000-0000-0000-000000000000')
) 
WITH CHECK (
  COALESCE(current_setting('app.is_msp', true)::boolean, false) = true 
  OR team_id = COALESCE(current_setting('app.current_team', true)::uuid, '00000000-0000-0000-0000-000000000000')
);

-- Manager scope policy
CREATE POLICY "uptime_checks_manager_scope" 
ON public.uptime_checks 
FOR SELECT 
USING (
  COALESCE(current_setting('app.is_msp', true)::boolean, false) = true 
  OR EXISTS (
    SELECT 1 FROM organization_memberships om
    JOIN teams t ON om.organization_id = t.organization_id
    WHERE om.user_id = auth.uid() 
    AND om.role IN ('admin', 'manager')
    AND t.id = uptime_checks.team_id
  )
);

-- MSP access policy
CREATE POLICY "uptime_checks_msp_access" 
ON public.uptime_checks 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.is_msp_admin = true
  )
);

-- Updated timestamp trigger
CREATE TRIGGER update_uptime_checks_updated_at
  BEFORE UPDATE ON public.uptime_checks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_uptime_checks_team_id ON public.uptime_checks(team_id);
CREATE INDEX idx_uptime_checks_next_check ON public.uptime_checks(next_check);
CREATE INDEX idx_uptime_checks_status ON public.uptime_checks(status);

-- Function to create alert from uptime check failure
CREATE OR REPLACE FUNCTION public.create_alert_from_uptime_failure()
RETURNS TRIGGER AS $$
BEGIN
  -- Create monitoring alert when uptime check fails
  IF NEW.status = 'down' AND OLD.status != 'down' THEN
    INSERT INTO public.monitoring_alerts (
      alert_name,
      alert_type,
      severity,
      message,
      team_id,
      metadata
    ) VALUES (
      format('Uptime Check Failed: %s', NEW.name),
      'uptime',
      CASE 
        WHEN NEW.response_time > 10000 THEN 'high'
        WHEN NEW.response_time > 5000 THEN 'medium'
        ELSE 'low'
      END,
      format('Uptime check "%s" is down. URL: %s, Status Code: %s, Response Time: %s ms', 
        NEW.name, NEW.url, COALESCE(NEW.status_code::text, 'N/A'), COALESCE(NEW.response_time::text, 'N/A')),
      NEW.team_id,
      jsonb_build_object(
        'uptime_check_id', NEW.id,
        'url', NEW.url,
        'status_code', NEW.status_code,
        'response_time', NEW.response_time,
        'checked_at', NEW.checked_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for uptime check alerts
CREATE TRIGGER trigger_uptime_check_alert
  AFTER UPDATE ON public.uptime_checks
  FOR EACH ROW
  EXECUTE FUNCTION public.create_alert_from_uptime_failure();