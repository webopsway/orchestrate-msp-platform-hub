-- Modifier la table cloud_accounts pour supporter plusieurs environnements
ALTER TABLE public.cloud_accounts 
ALTER COLUMN environment TYPE text[] USING CASE 
  WHEN environment IS NOT NULL AND environment != '' THEN ARRAY[environment::text]
  ELSE ARRAY['production']
END;