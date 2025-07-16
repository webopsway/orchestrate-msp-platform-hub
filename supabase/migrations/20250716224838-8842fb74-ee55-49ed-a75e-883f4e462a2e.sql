-- Créer la table pour les environnements cloud
CREATE TABLE public.cloud_environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.cloud_environments ENABLE ROW LEVEL SECURITY;

-- Politique pour MSP admins
CREATE POLICY "MSP admin accès total cloud_environments" 
ON public.cloud_environments 
FOR ALL 
USING (is_msp_admin()) 
WITH CHECK (is_msp_admin());

-- Politique de lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can read cloud_environments" 
ON public.cloud_environments 
FOR SELECT 
TO authenticated 
USING (is_active = true);

-- Insérer les environnements par défaut
INSERT INTO public.cloud_environments (name, display_name, description, color) VALUES
  ('production', 'Production', 'Environnement de production', '#ef4444'),
  ('staging', 'Staging', 'Environnement de pré-production', '#f59e0b'),
  ('development', 'Développement', 'Environnement de développement', '#10b981'),
  ('testing', 'Test', 'Environnement de test', '#8b5cf6');

-- Créer une table de liaison many-to-many entre cloud_accounts et cloud_environments
CREATE TABLE public.cloud_account_environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cloud_account_id UUID NOT NULL REFERENCES public.cloud_accounts(id) ON DELETE CASCADE,
  cloud_environment_id UUID NOT NULL REFERENCES public.cloud_environments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(cloud_account_id, cloud_environment_id)
);

-- Activer RLS
ALTER TABLE public.cloud_account_environments ENABLE ROW LEVEL SECURITY;

-- Politique pour MSP admins
CREATE POLICY "MSP admin accès total cloud_account_environments" 
ON public.cloud_account_environments 
FOR ALL 
USING (is_msp_admin()) 
WITH CHECK (is_msp_admin());

-- Politique pour les utilisateurs selon l'accès au compte
CREATE POLICY "Users can access their cloud account environments" 
ON public.cloud_account_environments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.cloud_accounts ca
    WHERE ca.id = cloud_account_environments.cloud_account_id
    AND (
      is_msp_admin() 
      OR (is_user_in_msp_organization() AND user_has_permission('assets', 'read') AND user_can_access_client_org(ca.client_organization_id))
      OR EXISTS (SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = ca.team_id)
    )
  )
);

-- Migrer les données existantes de la colonne environment vers la nouvelle table
INSERT INTO public.cloud_account_environments (cloud_account_id, cloud_environment_id)
SELECT 
  ca.id,
  ce.id
FROM public.cloud_accounts ca
CROSS JOIN UNNEST(ca.environment) AS env_name
JOIN public.cloud_environments ce ON ce.name = env_name
WHERE ca.environment IS NOT NULL AND array_length(ca.environment, 1) > 0;

-- Pour les comptes sans environnement, assigner production par défaut
INSERT INTO public.cloud_account_environments (cloud_account_id, cloud_environment_id)
SELECT 
  ca.id,
  ce.id
FROM public.cloud_accounts ca
JOIN public.cloud_environments ce ON ce.name = 'production'
WHERE ca.environment IS NULL OR array_length(ca.environment, 1) = 0
AND NOT EXISTS (
  SELECT 1 FROM public.cloud_account_environments cae 
  WHERE cae.cloud_account_id = ca.id
);

-- Supprimer l'ancienne colonne environment
ALTER TABLE public.cloud_accounts DROP COLUMN environment;

-- Trigger pour updated_at
CREATE TRIGGER update_cloud_environments_updated_at
  BEFORE UPDATE ON public.cloud_environments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();