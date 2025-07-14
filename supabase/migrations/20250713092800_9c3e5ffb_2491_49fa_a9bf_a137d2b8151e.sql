-- Add client organization reference to SLA policies
ALTER TABLE public.itsm_sla_policies 
ADD COLUMN client_organization_id uuid REFERENCES public.organizations(id);

-- Add index for better performance
CREATE INDEX idx_itsm_sla_policies_client_org ON public.itsm_sla_policies(client_organization_id);

-- Add comment to clarify the column usage
COMMENT ON COLUMN public.itsm_sla_policies.client_organization_id IS 'Specific client organization this SLA policy applies to. If NULL, applies to all clients of the specified client_type.';