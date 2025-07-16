-- Supprimer la valeur par défaut de la colonne environment
ALTER TABLE public.cloud_accounts 
ALTER COLUMN environment DROP DEFAULT;

-- Modifier le type de colonne pour supporter les tableaux
ALTER TABLE public.cloud_accounts 
ALTER COLUMN environment TYPE text[] USING CASE 
  WHEN environment IS NOT NULL AND environment != '' THEN ARRAY[environment::text]
  ELSE ARRAY['production']
END;

-- Définir une nouvelle valeur par défaut pour les tableaux
ALTER TABLE public.cloud_accounts 
ALTER COLUMN environment SET DEFAULT ARRAY['production'];