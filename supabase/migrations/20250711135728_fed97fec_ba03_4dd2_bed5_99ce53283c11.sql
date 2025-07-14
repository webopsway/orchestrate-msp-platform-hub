-- Créer la table pour gérer les relations MSP-ESN-Client
CREATE TABLE public.msp_client_relations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- MSP qui fournit les services techniques
  msp_organization_id UUID NOT NULL,
  
  -- Organisation cliente finale
  client_organization_id UUID NOT NULL,
  
  -- ESN gestionnaire contractuel (optionnel)
  -- Si NULL, le MSP est directement gestionnaire contractuel
  -- Si renseigné, l'ESN est le gestionnaire contractuel
  esn_organization_id UUID NULL,
  
  -- Type de relation
  relation_type TEXT NOT NULL CHECK (relation_type IN ('direct', 'via_esn')),
  
  -- Statut de la relation
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Dates de validité
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NULL,
  
  -- Métadonnées pour informations contractuelles
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  
  -- Contraintes de clés étrangères
  CONSTRAINT msp_client_relations_msp_fkey 
    FOREIGN KEY (msp_organization_id) REFERENCES organizations(id),
  CONSTRAINT msp_client_relations_client_fkey 
    FOREIGN KEY (client_organization_id) REFERENCES organizations(id),
  CONSTRAINT msp_client_relations_esn_fkey 
    FOREIGN KEY (esn_organization_id) REFERENCES organizations(id),
  CONSTRAINT msp_client_relations_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES profiles(id),
    
  -- Contraintes métier
  CONSTRAINT msp_client_relations_different_orgs CHECK (
    msp_organization_id != client_organization_id AND
    (esn_organization_id IS NULL OR (
      esn_organization_id != msp_organization_id AND 
      esn_organization_id != client_organization_id
    ))
  ),
  
  -- Contrainte sur le type de relation
  CONSTRAINT msp_client_relations_type_consistency CHECK (
    (relation_type = 'direct' AND esn_organization_id IS NULL) OR
    (relation_type = 'via_esn' AND esn_organization_id IS NOT NULL)
  ),
  
  -- Une seule relation active par client à un moment donné
  CONSTRAINT msp_client_relations_unique_active 
    UNIQUE (client_organization_id, is_active) 
    DEFERRABLE INITIALLY DEFERRED
);

-- Contrainte partielle pour s'assurer qu'il n'y a qu'une relation active par client
CREATE UNIQUE INDEX idx_msp_client_relations_unique_active_client 
ON public.msp_client_relations (client_organization_id) 
WHERE is_active = true;

-- Vérifier que les organisations ont les bons types
ALTER TABLE public.msp_client_relations 
ADD CONSTRAINT msp_client_relations_org_types_check CHECK (
  -- On s'assure via des fonctions que les types sont corrects
  true  -- Sera vérifié par des triggers
);

-- Trigger pour vérifier les types d'organisations
CREATE OR REPLACE FUNCTION public.validate_msp_client_relation_types()
RETURNS TRIGGER AS $$
DECLARE
  msp_type organization_type;
  client_type organization_type;
  esn_type organization_type;
BEGIN
  -- Vérifier le type MSP
  SELECT type INTO msp_type FROM organizations WHERE id = NEW.msp_organization_id;
  IF msp_type != 'msp' THEN
    RAISE EXCEPTION 'MSP organization must have type "msp"';
  END IF;
  
  -- Vérifier le type client
  SELECT type INTO client_type FROM organizations WHERE id = NEW.client_organization_id;
  IF client_type != 'client' THEN
    RAISE EXCEPTION 'Client organization must have type "client"';
  END IF;
  
  -- Vérifier le type ESN si présent
  IF NEW.esn_organization_id IS NOT NULL THEN
    SELECT type INTO esn_type FROM organizations WHERE id = NEW.esn_organization_id;
    IF esn_type != 'esn' THEN
      RAISE EXCEPTION 'ESN organization must have type "esn"';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_msp_client_relation_types_trigger
  BEFORE INSERT OR UPDATE ON public.msp_client_relations
  FOR EACH ROW EXECUTE FUNCTION public.validate_msp_client_relation_types();

-- Activer RLS
ALTER TABLE public.msp_client_relations ENABLE ROW LEVEL SECURITY;

-- Politique d'accès : MSP admins peuvent tout voir, autres utilisateurs selon leur organisation
CREATE POLICY "msp_client_relations_access_policy" 
ON public.msp_client_relations 
FOR ALL 
USING (
  is_msp_admin() OR
  -- Accès si l'utilisateur fait partie du MSP
  EXISTS (
    SELECT 1 FROM organization_memberships om
    WHERE om.user_id = auth.uid() 
    AND om.organization_id = msp_organization_id
  ) OR
  -- Accès si l'utilisateur fait partie de l'ESN
  (esn_organization_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM organization_memberships om
    WHERE om.user_id = auth.uid() 
    AND om.organization_id = esn_organization_id
  )) OR
  -- Accès si l'utilisateur fait partie du client
  EXISTS (
    SELECT 1 FROM organization_memberships om
    WHERE om.user_id = auth.uid() 
    AND om.organization_id = client_organization_id
  )
)
WITH CHECK (
  is_msp_admin() OR
  -- Seuls les MSP admins et les admins du MSP peuvent créer/modifier
  EXISTS (
    SELECT 1 FROM organization_memberships om
    WHERE om.user_id = auth.uid() 
    AND om.organization_id = msp_organization_id
    AND om.role IN ('admin', 'manager')
  )
);

-- Trigger pour updated_at
CREATE TRIGGER update_msp_client_relations_updated_at
  BEFORE UPDATE ON public.msp_client_relations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour optimiser les requêtes
CREATE INDEX idx_msp_client_relations_msp ON public.msp_client_relations(msp_organization_id);
CREATE INDEX idx_msp_client_relations_client ON public.msp_client_relations(client_organization_id);
CREATE INDEX idx_msp_client_relations_esn ON public.msp_client_relations(esn_organization_id);
CREATE INDEX idx_msp_client_relations_active ON public.msp_client_relations(is_active);
CREATE INDEX idx_msp_client_relations_dates ON public.msp_client_relations(start_date, end_date);

-- Fonctions utilitaires pour récupérer les relations
CREATE OR REPLACE FUNCTION public.get_client_msp(p_client_org_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT msp_organization_id 
  FROM public.msp_client_relations 
  WHERE client_organization_id = p_client_org_id 
  AND is_active = true
  AND (end_date IS NULL OR end_date > now())
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_client_esn(p_client_org_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT esn_organization_id 
  FROM public.msp_client_relations 
  WHERE client_organization_id = p_client_org_id 
  AND is_active = true
  AND (end_date IS NULL OR end_date > now())
  AND esn_organization_id IS NOT NULL
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_msp_clients(p_msp_org_id UUID)
RETURNS TABLE(
  client_org_id UUID,
  esn_org_id UUID,
  relation_type TEXT,
  start_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    client_organization_id,
    esn_organization_id,
    relation_type,
    start_date
  FROM public.msp_client_relations 
  WHERE msp_organization_id = p_msp_org_id 
  AND is_active = true
  AND (end_date IS NULL OR end_date > now());
$$;