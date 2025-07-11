-- Créer la table pour les commentaires ITSM
CREATE TABLE public.itsm_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  team_id UUID NOT NULL,
  
  -- Relations vers les différents types de tickets
  incident_id UUID NULL,
  change_request_id UUID NULL,
  vulnerability_id UUID NULL,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}',
  
  -- Contraintes
  CONSTRAINT itsm_comments_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id),
  CONSTRAINT itsm_comments_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id),
  CONSTRAINT itsm_comments_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES itsm_incidents(id) ON DELETE CASCADE,
  CONSTRAINT itsm_comments_change_request_id_fkey FOREIGN KEY (change_request_id) REFERENCES itsm_change_requests(id) ON DELETE CASCADE,
  CONSTRAINT itsm_comments_vulnerability_id_fkey FOREIGN KEY (vulnerability_id) REFERENCES security_vulnerabilities(id) ON DELETE CASCADE,
  
  -- Au moins une relation doit être définie
  CONSTRAINT itsm_comments_relation_check CHECK (
    (incident_id IS NOT NULL)::int + 
    (change_request_id IS NOT NULL)::int + 
    (vulnerability_id IS NOT NULL)::int = 1
  )
);

-- Activer RLS
ALTER TABLE public.itsm_comments ENABLE ROW LEVEL SECURITY;

-- Politique d'accès basée sur l'équipe
CREATE POLICY "itsm_comments_access_policy" 
ON public.itsm_comments 
FOR ALL 
USING (
  is_msp_admin() OR 
  COALESCE(current_setting('app.is_msp', true)::boolean, false) = true OR
  team_id = COALESCE(current_setting('app.current_team', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid) OR
  EXISTS (
    SELECT 1 FROM organization_memberships om
    JOIN teams t ON om.organization_id = t.organization_id
    WHERE om.user_id = auth.uid() 
    AND om.role IN ('admin', 'manager')
    AND t.id = itsm_comments.team_id
  )
)
WITH CHECK (
  is_msp_admin() OR 
  COALESCE(current_setting('app.is_msp', true)::boolean, false) = true OR
  team_id = COALESCE(current_setting('app.current_team', true)::uuid, '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_itsm_comments_updated_at
  BEFORE UPDATE ON public.itsm_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour optimiser les requêtes
CREATE INDEX idx_itsm_comments_incident_id ON public.itsm_comments(incident_id);
CREATE INDEX idx_itsm_comments_change_request_id ON public.itsm_comments(change_request_id);
CREATE INDEX idx_itsm_comments_vulnerability_id ON public.itsm_comments(vulnerability_id);
CREATE INDEX idx_itsm_comments_team_id ON public.itsm_comments(team_id);
CREATE INDEX idx_itsm_comments_created_at ON public.itsm_comments(created_at);