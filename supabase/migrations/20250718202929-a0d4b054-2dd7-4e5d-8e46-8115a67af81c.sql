-- Supprimer les contraintes de clé étrangère problématiques et les recréer avec une approche différente
ALTER TABLE public.dashboard_configurations 
ALTER COLUMN created_by DROP NOT NULL;

-- Créer un dashboard par défaut sans utilisateur spécifique
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
NULL);