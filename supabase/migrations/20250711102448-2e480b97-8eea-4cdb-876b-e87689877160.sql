-- Créer une équipe par défaut pour l'organisation MSP
INSERT INTO public.teams (name, description, organization_id)
SELECT 'Équipe MSP Default', 'Équipe par défaut pour l''organisation MSP', id
FROM public.organizations 
WHERE is_msp = true 
AND NOT EXISTS (
    SELECT 1 FROM public.teams WHERE organization_id = organizations.id
)
LIMIT 1;

-- Ajouter une contrainte unique sur user_id dans user_sessions pour éviter les erreurs ON CONFLICT
ALTER TABLE public.user_sessions ADD CONSTRAINT user_sessions_user_id_unique UNIQUE (user_id);