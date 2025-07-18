-- Ajouter les nouvelles colonnes à la table business_services
ALTER TABLE public.business_services 
ADD COLUMN organization_id UUID,
ADD COLUMN business_owner_team_id UUID,
ADD COLUMN technical_owner_team_id UUID,
ADD COLUMN application_stack TEXT[],
ADD COLUMN technical_stack TEXT[];

-- Ajouter les contraintes de clés étrangères
ALTER TABLE public.business_services 
ADD CONSTRAINT fk_business_services_organization 
FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
ADD CONSTRAINT fk_business_services_business_owner_team 
FOREIGN KEY (business_owner_team_id) REFERENCES public.teams(id),
ADD CONSTRAINT fk_business_services_technical_owner_team 
FOREIGN KEY (technical_owner_team_id) REFERENCES public.teams(id);

-- Créer des index pour les performances
CREATE INDEX idx_business_services_organization_id ON public.business_services(organization_id);
CREATE INDEX idx_business_services_business_owner_team_id ON public.business_services(business_owner_team_id);
CREATE INDEX idx_business_services_technical_owner_team_id ON public.business_services(technical_owner_team_id);