-- Enable RLS on itsm_change_requests table
ALTER TABLE public.itsm_change_requests ENABLE ROW LEVEL SECURITY;

-- Policy 1: Team isolation using session variables
CREATE POLICY "change_requests_team_isolation" 
ON public.itsm_change_requests
FOR ALL
TO authenticated
USING (
  -- MSP admins can see all
  COALESCE(current_setting('app.is_msp', true)::boolean, false) = true
  OR 
  -- Users can only see change requests from their current team
  team_id = COALESCE(current_setting('app.current_team', true)::UUID, '00000000-0000-0000-0000-000000000000'::UUID)
)
WITH CHECK (
  -- MSP admins can create/update all
  COALESCE(current_setting('app.is_msp', true)::boolean, false) = true
  OR 
  -- Users can only create/update change requests in their current team
  team_id = COALESCE(current_setting('app.current_team', true)::UUID, '00000000-0000-0000-0000-000000000000'::UUID)
);

-- Policy 2: Manager scope for cross-team visibility within organizations
CREATE POLICY "change_requests_manager_scope" 
ON public.itsm_change_requests
FOR SELECT
TO authenticated
USING (
  -- MSP admins can see all
  COALESCE(current_setting('app.is_msp', true)::boolean, false) = true
  OR 
  -- Organization managers can see change requests from teams in their organizations
  EXISTS (
    SELECT 1
    FROM public.organization_memberships om
    JOIN public.teams t ON om.organization_id = t.organization_id
    WHERE om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager')
      AND t.id = public.itsm_change_requests.team_id
  )
);

-- Create workflow functions for change request management

-- Function to submit a change request for approval
CREATE OR REPLACE FUNCTION public.submit_change_request(
  p_change_request_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_change_request RECORD;
  v_result JSON;
BEGIN
  -- Get the change request
  SELECT * INTO v_change_request
  FROM public.itsm_change_requests
  WHERE id = p_change_request_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Change request not found'
    );
  END IF;
  
  -- Check if status allows submission
  IF v_change_request.status != 'draft' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Change request can only be submitted from draft status'
    );
  END IF;
  
  -- Update status to pending approval
  UPDATE public.itsm_change_requests
  SET 
    status = 'pending_approval',
    updated_at = now()
  WHERE id = p_change_request_id;
  
  -- Log the action
  RAISE LOG 'Change request % submitted for approval by user %', p_change_request_id, auth.uid();
  
  RETURN json_build_object(
    'success', true,
    'message', 'Change request submitted for approval',
    'change_request_id', p_change_request_id,
    'new_status', 'pending_approval'
  );
END;
$$;

-- Function to approve or reject a change request
CREATE OR REPLACE FUNCTION public.approve_change_request(
  p_change_request_id UUID,
  p_action TEXT, -- 'approve' or 'reject'
  p_approval_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_change_request RECORD;
  v_new_status TEXT;
  v_result JSON;
BEGIN
  -- Validate action
  IF p_action NOT IN ('approve', 'reject') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Action must be either "approve" or "reject"'
    );
  END IF;
  
  -- Get the change request
  SELECT * INTO v_change_request
  FROM public.itsm_change_requests
  WHERE id = p_change_request_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Change request not found'
    );
  END IF;
  
  -- Check if status allows approval/rejection
  IF v_change_request.status != 'pending_approval' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Change request must be in pending_approval status'
    );
  END IF;
  
  -- Set new status
  v_new_status := CASE 
    WHEN p_action = 'approve' THEN 'approved'
    WHEN p_action = 'reject' THEN 'rejected'
  END;
  
  -- Update the change request
  UPDATE public.itsm_change_requests
  SET 
    status = v_new_status,
    approved_by = auth.uid(),
    approval_notes = p_approval_notes,
    updated_at = now()
  WHERE id = p_change_request_id;
  
  -- Log the action
  RAISE LOG 'Change request % % by user %', p_change_request_id, p_action, auth.uid();
  
  RETURN json_build_object(
    'success', true,
    'message', 'Change request ' || p_action || 'd successfully',
    'change_request_id', p_change_request_id,
    'new_status', v_new_status,
    'approved_by', auth.uid()
  );
END;
$$;

-- Function to implement a change request
CREATE OR REPLACE FUNCTION public.implement_change_request(
  p_change_request_id UUID,
  p_implementation_success BOOLEAN DEFAULT true,
  p_implementation_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_change_request RECORD;
  v_new_status TEXT;
BEGIN
  -- Get the change request
  SELECT * INTO v_change_request
  FROM public.itsm_change_requests
  WHERE id = p_change_request_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Change request not found'
    );
  END IF;
  
  -- Check if status allows implementation
  IF v_change_request.status != 'approved' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Change request must be approved before implementation'
    );
  END IF;
  
  -- Set new status based on success
  v_new_status := CASE 
    WHEN p_implementation_success THEN 'implemented'
    ELSE 'failed'
  END;
  
  -- Update the change request
  UPDATE public.itsm_change_requests
  SET 
    status = v_new_status,
    implementation_notes = p_implementation_notes,
    updated_at = now()
  WHERE id = p_change_request_id;
  
  -- Log the action
  RAISE LOG 'Change request % implementation % by user %', 
    p_change_request_id, 
    CASE WHEN p_implementation_success THEN 'succeeded' ELSE 'failed' END,
    auth.uid();
  
  RETURN json_build_object(
    'success', true,
    'message', 'Change request implementation status updated',
    'change_request_id', p_change_request_id,
    'new_status', v_new_status,
    'implementation_success', p_implementation_success
  );
END;
$$;

-- Function to schedule a change request
CREATE OR REPLACE FUNCTION public.schedule_change_request(
  p_change_request_id UUID,
  p_scheduled_date TIMESTAMP WITH TIME ZONE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_change_request RECORD;
BEGIN
  -- Get the change request
  SELECT * INTO v_change_request
  FROM public.itsm_change_requests
  WHERE id = p_change_request_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Change request not found'
    );
  END IF;
  
  -- Check if status allows scheduling
  IF v_change_request.status != 'approved' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Change request must be approved before scheduling'
    );
  END IF;
  
  -- Validate scheduled date is in the future
  IF p_scheduled_date <= now() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Scheduled date must be in the future'
    );
  END IF;
  
  -- Update the scheduled date
  UPDATE public.itsm_change_requests
  SET 
    scheduled_date = p_scheduled_date,
    updated_at = now()
  WHERE id = p_change_request_id;
  
  -- Log the action
  RAISE LOG 'Change request % scheduled for % by user %', 
    p_change_request_id, p_scheduled_date, auth.uid();
  
  RETURN json_build_object(
    'success', true,
    'message', 'Change request scheduled successfully',
    'change_request_id', p_change_request_id,
    'scheduled_date', p_scheduled_date
  );
END;
$$;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_itsm_change_requests_scheduled_date 
ON public.itsm_change_requests(scheduled_date) 
WHERE scheduled_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_itsm_change_requests_approved_by 
ON public.itsm_change_requests(approved_by) 
WHERE approved_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_itsm_change_requests_status_priority 
ON public.itsm_change_requests(status, priority);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.submit_change_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_change_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.implement_change_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.schedule_change_request TO authenticated;