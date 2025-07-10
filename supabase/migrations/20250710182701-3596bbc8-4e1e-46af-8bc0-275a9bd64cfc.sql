-- Fix infinite recursion in profiles RLS policies by creating security definer functions

-- Create function to get current user profile safely
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(id uuid, is_msp_admin boolean)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT profiles.id, profiles.is_msp_admin 
  FROM public.profiles 
  WHERE profiles.id = auth.uid()
  LIMIT 1;
$$;

-- Drop existing problematic policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their own profile and MSP admins can view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new policies using the security definer function
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "MSP admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.get_current_user_profile() 
    WHERE is_msp_admin = true
  )
);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid());

-- Create backup management edge function endpoints
CREATE OR REPLACE FUNCTION public.create_backup_notification_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create monitoring alert for backup failure
  IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    INSERT INTO public.monitoring_alerts (
      alert_name,
      alert_type,
      severity,
      message,
      team_id,
      metadata
    ) VALUES (
      'Backup Job Failed',
      'backup',
      'high',
      format('Backup job "%s" failed. Source: %s, Destination: %s', 
        NEW.name, NEW.source_path, NEW.destination),
      NEW.team_id,
      jsonb_build_object(
        'backup_job_id', NEW.id,
        'backup_type', NEW.backup_type,
        'source_path', NEW.source_path,
        'destination', NEW.destination,
        'last_run', NEW.last_run
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for backup failure alerts
DROP TRIGGER IF EXISTS backup_failure_alert_trigger ON public.backup_jobs;
CREATE TRIGGER backup_failure_alert_trigger
  AFTER UPDATE ON public.backup_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.create_backup_notification_alert();