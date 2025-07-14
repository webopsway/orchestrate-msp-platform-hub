-- Créer la table pour les configurations ITSM dynamiques
CREATE TABLE public.itsm_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  config_type TEXT NOT NULL, -- 'ticket_categories', 'statuses', 'priorities', 'sla_policies'
  config_key TEXT NOT NULL,
  config_value JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  UNIQUE(team_id, config_type, config_key)
);

-- Créer la table pour les SLA
CREATE TABLE public.itsm_sla_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL,
  ticket_category TEXT,
  response_time_hours INTEGER NOT NULL, -- Temps de première réponse en heures
  resolution_time_hours INTEGER NOT NULL, -- Temps de résolution en heures
  escalation_time_hours INTEGER, -- Temps avant escalade
  escalation_to UUID REFERENCES profiles(id), -- Utilisateur d'escalade
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES profiles(id)
);

-- Créer la table pour tracker les SLA sur les tickets
CREATE TABLE public.itsm_sla_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES itsm_incidents(id) ON DELETE CASCADE,
  change_request_id UUID REFERENCES itsm_change_requests(id) ON DELETE CASCADE,
  service_request_id UUID REFERENCES itsm_service_requests(id) ON DELETE CASCADE,
  sla_policy_id UUID NOT NULL REFERENCES itsm_sla_policies(id),
  
  -- Timestamps SLA
  response_due_at TIMESTAMP WITH TIME ZONE NOT NULL,
  resolution_due_at TIMESTAMP WITH TIME ZONE NOT NULL,
  escalation_due_at TIMESTAMP WITH TIME ZONE,
  
  -- Status SLA
  first_response_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  escalated_at TIMESTAMP WITH TIME ZONE,
  
  -- Flags de violation SLA
  response_sla_breached BOOLEAN NOT NULL DEFAULT false,
  resolution_sla_breached BOOLEAN NOT NULL DEFAULT false,
  is_escalated BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- S'assurer qu'un seul type de ticket est lié
  CONSTRAINT check_single_ticket_type CHECK (
    (incident_id IS NOT NULL)::int + 
    (change_request_id IS NOT NULL)::int + 
    (service_request_id IS NOT NULL)::int = 1
  )
);

-- Ajouter des index pour les performances
CREATE INDEX idx_itsm_configurations_team_type ON itsm_configurations(team_id, config_type);
CREATE INDEX idx_itsm_sla_policies_team_priority ON itsm_sla_policies(team_id, priority, is_active);
CREATE INDEX idx_itsm_sla_tracking_due_dates ON itsm_sla_tracking(response_due_at, resolution_due_at);
CREATE INDEX idx_itsm_sla_tracking_breached ON itsm_sla_tracking(response_sla_breached, resolution_sla_breached);

-- Activer RLS
ALTER TABLE itsm_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE itsm_sla_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE itsm_sla_tracking ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour itsm_configurations
CREATE POLICY "itsm_configurations_read_policy" ON itsm_configurations
  FOR SELECT USING (
    is_msp_admin() OR 
    EXISTS (SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_configurations.team_id)
  );

CREATE POLICY "itsm_configurations_insert_policy" ON itsm_configurations
  FOR INSERT WITH CHECK (
    is_msp_admin() OR 
    EXISTS (SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_configurations.team_id AND tm.role IN ('admin', 'owner'))
  );

CREATE POLICY "itsm_configurations_update_policy" ON itsm_configurations
  FOR UPDATE USING (
    is_msp_admin() OR 
    EXISTS (SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_configurations.team_id AND tm.role IN ('admin', 'owner'))
  );

CREATE POLICY "itsm_configurations_delete_policy" ON itsm_configurations
  FOR DELETE USING (
    is_msp_admin() OR 
    EXISTS (SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_configurations.team_id AND tm.role IN ('admin', 'owner'))
  );

-- Politiques RLS pour itsm_sla_policies
CREATE POLICY "itsm_sla_policies_read_policy" ON itsm_sla_policies
  FOR SELECT USING (
    is_msp_admin() OR 
    EXISTS (SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_sla_policies.team_id)
  );

CREATE POLICY "itsm_sla_policies_insert_policy" ON itsm_sla_policies
  FOR INSERT WITH CHECK (
    is_msp_admin() OR 
    EXISTS (SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_sla_policies.team_id AND tm.role IN ('admin', 'owner'))
  );

CREATE POLICY "itsm_sla_policies_update_policy" ON itsm_sla_policies
  FOR UPDATE USING (
    is_msp_admin() OR 
    EXISTS (SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_sla_policies.team_id AND tm.role IN ('admin', 'owner'))
  );

CREATE POLICY "itsm_sla_policies_delete_policy" ON itsm_sla_policies
  FOR DELETE USING (
    is_msp_admin() OR 
    EXISTS (SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_sla_policies.team_id AND tm.role IN ('admin', 'owner'))
  );

-- Politiques RLS pour itsm_sla_tracking
CREATE POLICY "itsm_sla_tracking_read_policy" ON itsm_sla_tracking
  FOR SELECT USING (
    is_msp_admin() OR 
    EXISTS (SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_sla_tracking.team_id)
  );

CREATE POLICY "itsm_sla_tracking_insert_policy" ON itsm_sla_tracking
  FOR INSERT WITH CHECK (
    is_msp_admin() OR 
    EXISTS (SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_sla_tracking.team_id)
  );

CREATE POLICY "itsm_sla_tracking_update_policy" ON itsm_sla_tracking
  FOR UPDATE USING (
    is_msp_admin() OR 
    EXISTS (SELECT 1 FROM team_memberships tm WHERE tm.user_id = auth.uid() AND tm.team_id = itsm_sla_tracking.team_id)
  );

CREATE POLICY "itsm_sla_tracking_delete_policy" ON itsm_sla_tracking
  FOR DELETE USING (is_msp_admin());

-- Trigger pour mise à jour automatique des timestamps
CREATE TRIGGER update_itsm_configurations_updated_at
  BEFORE UPDATE ON itsm_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itsm_sla_policies_updated_at
  BEFORE UPDATE ON itsm_sla_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itsm_sla_tracking_updated_at
  BEFORE UPDATE ON itsm_sla_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer et mettre à jour les violations SLA
CREATE OR REPLACE FUNCTION check_sla_violations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Marquer les violations de SLA de réponse
  UPDATE itsm_sla_tracking 
  SET response_sla_breached = true
  WHERE response_due_at < now() 
    AND first_response_at IS NULL 
    AND response_sla_breached = false;
  
  -- Marquer les violations de SLA de résolution
  UPDATE itsm_sla_tracking 
  SET resolution_sla_breached = true
  WHERE resolution_due_at < now() 
    AND resolved_at IS NULL 
    AND resolution_sla_breached = false;
  
  -- Marquer les escalades nécessaires
  UPDATE itsm_sla_tracking 
  SET is_escalated = true, escalated_at = now()
  WHERE escalation_due_at IS NOT NULL 
    AND escalation_due_at < now() 
    AND is_escalated = false 
    AND resolved_at IS NULL;
END;
$$;

-- Insérer des configurations par défaut
INSERT INTO itsm_configurations (team_id, config_type, config_key, config_value, created_by, display_order) 
SELECT 
  t.id,
  'priorities',
  'critical',
  '{"label": "Critique", "color": "#dc2626", "escalation_hours": 1}',
  p.id,
  1
FROM teams t
CROSS JOIN profiles p
WHERE p.is_msp_admin = true
LIMIT 1;

INSERT INTO itsm_configurations (team_id, config_type, config_key, config_value, created_by, display_order) 
SELECT 
  t.id,
  'priorities',
  'high',
  '{"label": "Élevée", "color": "#ea580c", "escalation_hours": 4}',
  p.id,
  2
FROM teams t
CROSS JOIN profiles p
WHERE p.is_msp_admin = true
LIMIT 1;

INSERT INTO itsm_configurations (team_id, config_type, config_key, config_value, created_by, display_order) 
SELECT 
  t.id,
  'priorities',
  'medium',
  '{"label": "Moyenne", "color": "#eab308", "escalation_hours": 24}',
  p.id,
  3
FROM teams t
CROSS JOIN profiles p
WHERE p.is_msp_admin = true
LIMIT 1;

INSERT INTO itsm_configurations (team_id, config_type, config_key, config_value, created_by, display_order) 
SELECT 
  t.id,
  'priorities',
  'low',
  '{"label": "Faible", "color": "#16a34a", "escalation_hours": 72}',
  p.id,
  4
FROM teams t
CROSS JOIN profiles p
WHERE p.is_msp_admin = true
LIMIT 1;