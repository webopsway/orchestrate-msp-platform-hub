-- Ajouter les clés étrangères manquantes pour ITSM tables

-- Pour itsm_change_requests
ALTER TABLE public.itsm_change_requests 
ADD CONSTRAINT itsm_change_requests_requested_by_fkey 
FOREIGN KEY (requested_by) REFERENCES public.profiles(id);

ALTER TABLE public.itsm_change_requests 
ADD CONSTRAINT itsm_change_requests_approved_by_fkey 
FOREIGN KEY (approved_by) REFERENCES public.profiles(id);

-- Pour itsm_incidents (créer les contraintes manquantes)
ALTER TABLE public.itsm_incidents 
ADD CONSTRAINT itsm_incidents_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id);

-- Vérifier si la contrainte assigned_to existe déjà, sinon la créer
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'itsm_incidents_assigned_to_fkey'
        AND table_name = 'itsm_incidents'
    ) THEN
        ALTER TABLE public.itsm_incidents 
        ADD CONSTRAINT itsm_incidents_assigned_to_fkey 
        FOREIGN KEY (assigned_to) REFERENCES public.profiles(id);
    END IF;
END $$;