-- Modifier la table cloud_accounts pour supporter plusieurs environnements
ALTER TABLE public.cloud_accounts 
ALTER COLUMN environment TYPE text[];

-- Mettre à jour les données existantes pour convertir les environnements uniques en tableaux
UPDATE public.cloud_accounts 
SET environment = ARRAY[environment::text]
WHERE environment IS NOT NULL AND environment != '';

-- Mettre à jour les enregistrements avec environnement null ou vide
UPDATE public.cloud_accounts 
SET environment = ARRAY['production']
WHERE environment IS NULL OR environment = '';