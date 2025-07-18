-- Table pour les configurations de dashboards
CREATE TABLE public.dashboard_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  layout_config JSONB NOT NULL DEFAULT '{}',
  widgets JSONB NOT NULL DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Table pour les widgets de dashboard
CREATE TABLE public.dashboard_widgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  widget_type TEXT NOT NULL, -- 'stats', 'chart', 'table', 'custom'
  default_config JSONB NOT NULL DEFAULT '{}',
  is_system_widget BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Activer RLS
ALTER TABLE public.dashboard_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour dashboard_configurations
CREATE POLICY "MSP admin accès total dashboard_configurations" 
ON public.dashboard_configurations 
FOR ALL 
USING (is_msp_admin())
WITH CHECK (is_msp_admin());

CREATE POLICY "Utilisateurs peuvent voir leur dashboard" 
ON public.dashboard_configurations 
FOR SELECT 
USING (
  is_msp_admin() OR 
  (team_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM team_memberships tm 
    WHERE tm.user_id = auth.uid() AND tm.team_id = dashboard_configurations.team_id
  )) OR
  (organization_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM organization_memberships om 
    WHERE om.user_id = auth.uid() AND om.organization_id = dashboard_configurations.organization_id
  ))
);

-- Politiques RLS pour dashboard_widgets
CREATE POLICY "MSP admin accès total dashboard_widgets" 
ON public.dashboard_widgets 
FOR ALL 
USING (is_msp_admin())
WITH CHECK (is_msp_admin());

CREATE POLICY "Utilisateurs peuvent voir les widgets actifs" 
ON public.dashboard_widgets 
FOR SELECT 
USING (is_active = true);

-- Trigger pour updated_at
CREATE TRIGGER update_dashboard_configurations_updated_at
  BEFORE UPDATE ON public.dashboard_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dashboard_widgets_updated_at
  BEFORE UPDATE ON public.dashboard_widgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer des widgets par défaut
INSERT INTO public.dashboard_widgets (name, display_name, description, widget_type, default_config, is_system_widget) VALUES
('organizations_stats', 'Statistiques Organisations', 'Affiche le nombre d''organisations actives', 'stats', '{"icon": "Building2", "color": "text-blue-500"}', true),
('users_stats', 'Statistiques Utilisateurs', 'Affiche le nombre d''utilisateurs', 'stats', '{"icon": "Users", "color": "text-green-500"}', true),
('incidents_stats', 'Incidents Ouverts', 'Affiche le nombre d''incidents ouverts', 'stats', '{"icon": "AlertTriangle", "color": "text-red-500"}', true),
('services_stats', 'Services Surveillés', 'Affiche le nombre de services surveillés', 'stats', '{"icon": "Cloud", "color": "text-purple-500"}', true),
('recent_incidents', 'Incidents Récents', 'Tableau des derniers incidents ITSM', 'table', '{"maxRows": 5}', true),
('quick_actions', 'Actions Rapides', 'Boutons d''actions rapides', 'custom', '{}', true);

-- Créer un dashboard par défaut pour les admins MSP
INSERT INTO public.dashboard_configurations (name, description, is_default, widgets, created_by) VALUES
('Dashboard MSP Par Défaut', 'Dashboard par défaut pour les administrateurs MSP', true, 
'[
  {"id": "organizations_stats", "position": {"x": 0, "y": 0, "w": 3, "h": 1}},
  {"id": "users_stats", "position": {"x": 3, "y": 0, "w": 3, "h": 1}},
  {"id": "incidents_stats", "position": {"x": 6, "y": 0, "w": 3, "h": 1}},
  {"id": "services_stats", "position": {"x": 9, "y": 0, "w": 3, "h": 1}},
  {"id": "recent_incidents", "position": {"x": 0, "y": 1, "w": 8, "h": 2}},
  {"id": "quick_actions", "position": {"x": 8, "y": 1, "w": 4, "h": 2}}
]'::jsonb, 
'00000000-0000-0000-0000-000000000000');