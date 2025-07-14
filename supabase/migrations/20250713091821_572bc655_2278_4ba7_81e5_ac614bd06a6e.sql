-- Ajouter la colonne client_type à la table itsm_sla_policies
ALTER TABLE public.itsm_sla_policies 
ADD COLUMN client_type TEXT NOT NULL DEFAULT 'all' 
CHECK (client_type IN ('direct', 'via_esn', 'all'));

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN public.itsm_sla_policies.client_type IS 'Type de client: direct (gestion directe), via_esn (via prestataire ESN), all (tous les types)';