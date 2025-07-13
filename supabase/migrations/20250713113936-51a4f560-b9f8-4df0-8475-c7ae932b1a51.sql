-- Fix the is_msp_admin function to work correctly
CREATE OR REPLACE FUNCTION public.is_msp_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT is_msp_admin FROM public.profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

-- Update cloud providers policies to allow MSP admins to manage providers
DROP POLICY IF EXISTS cloud_providers_insert_policy ON public.cloud_providers;
DROP POLICY IF EXISTS cloud_providers_update_policy ON public.cloud_providers;
DROP POLICY IF EXISTS cloud_providers_delete_policy ON public.cloud_providers;

CREATE POLICY "cloud_providers_insert_policy" 
ON public.cloud_providers 
FOR INSERT 
TO authenticated
WITH CHECK (is_msp_admin());

CREATE POLICY "cloud_providers_update_policy" 
ON public.cloud_providers 
FOR UPDATE 
TO authenticated
USING (is_msp_admin());

CREATE POLICY "cloud_providers_delete_policy" 
ON public.cloud_providers 
FOR DELETE 
TO authenticated
USING (is_msp_admin());