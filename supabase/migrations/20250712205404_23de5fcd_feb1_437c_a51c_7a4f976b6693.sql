-- Migration pour peupler les configurations ITSM par défaut
-- Supprimer toutes les configurations existantes pour recommencer proprement
DELETE FROM public.itsm_configurations;

-- Insérer les priorités par défaut
INSERT INTO public.itsm_configurations (config_type, config_key, config_value, is_active, display_order, team_id, created_by) VALUES
('priorities', 'low', '{"label": "Faible", "color": "#10b981"}', true, 1, NULL, '00000000-0000-0000-0000-000000000000'),
('priorities', 'medium', '{"label": "Moyenne", "color": "#f59e0b"}', true, 2, NULL, '00000000-0000-0000-0000-000000000000'),
('priorities', 'high', '{"label": "Élevée", "color": "#f97316"}', true, 3, NULL, '00000000-0000-0000-0000-000000000000'),
('priorities', 'critical', '{"label": "Critique", "color": "#ef4444"}', true, 4, NULL, '00000000-0000-0000-0000-000000000000');

-- Insérer les statuts par défaut pour les incidents
INSERT INTO public.itsm_configurations (config_type, config_key, config_value, is_active, display_order, team_id, created_by) VALUES
('statuses', 'open', '{"label": "Ouvert", "color": "#ef4444", "category": "incident"}', true, 1, NULL, '00000000-0000-0000-0000-000000000000'),
('statuses', 'in_progress', '{"label": "En cours", "color": "#f59e0b", "category": "incident"}', true, 2, NULL, '00000000-0000-0000-0000-000000000000'),
('statuses', 'resolved', '{"label": "Résolu", "color": "#10b981", "category": "incident"}', true, 3, NULL, '00000000-0000-0000-0000-000000000000'),
('statuses', 'closed', '{"label": "Fermé", "color": "#6b7280", "category": "incident"}', true, 4, NULL, '00000000-0000-0000-0000-000000000000');

-- Insérer les statuts par défaut pour les changements
INSERT INTO public.itsm_configurations (config_type, config_key, config_value, is_active, display_order, team_id, created_by) VALUES
('statuses', 'draft', '{"label": "Brouillon", "color": "#6b7280", "category": "change"}', true, 1, NULL, '00000000-0000-0000-0000-000000000000'),
('statuses', 'pending_approval', '{"label": "En attente approbation", "color": "#f59e0b", "category": "change"}', true, 2, NULL, '00000000-0000-0000-0000-000000000000'),
('statuses', 'approved', '{"label": "Approuvé", "color": "#10b981", "category": "change"}', true, 3, NULL, '00000000-0000-0000-0000-000000000000'),
('statuses', 'rejected', '{"label": "Rejeté", "color": "#ef4444", "category": "change"}', true, 4, NULL, '00000000-0000-0000-0000-000000000000'),
('statuses', 'implemented', '{"label": "Implémenté", "color": "#10b981", "category": "change"}', true, 5, NULL, '00000000-0000-0000-0000-000000000000'),
('statuses', 'failed', '{"label": "Échec", "color": "#ef4444", "category": "change"}', true, 6, NULL, '00000000-0000-0000-0000-000000000000');

-- Insérer les statuts par défaut pour les demandes de service
INSERT INTO public.itsm_configurations (config_type, config_key, config_value, is_active, display_order, team_id, created_by) VALUES
('statuses', 'open', '{"label": "Ouvert", "color": "#ef4444", "category": "request"}', true, 1, NULL, '00000000-0000-0000-0000-000000000000'),
('statuses', 'in_progress', '{"label": "En cours", "color": "#f59e0b", "category": "request"}', true, 2, NULL, '00000000-0000-0000-0000-000000000000'),
('statuses', 'resolved', '{"label": "Résolu", "color": "#10b981", "category": "request"}', true, 3, NULL, '00000000-0000-0000-0000-000000000000'),
('statuses', 'closed', '{"label": "Fermé", "color": "#6b7280", "category": "request"}', true, 4, NULL, '00000000-0000-0000-0000-000000000000'),
('statuses', 'cancelled', '{"label": "Annulé", "color": "#6b7280", "category": "request"}', true, 5, NULL, '00000000-0000-0000-0000-000000000000');

-- Insérer les catégories par défaut
INSERT INTO public.itsm_configurations (config_type, config_key, config_value, is_active, display_order, team_id, created_by) VALUES
('categories', 'incident', '{"label": "Incidents", "color": "#ef4444"}', true, 1, NULL, '00000000-0000-0000-0000-000000000000'),
('categories', 'change', '{"label": "Changements", "color": "#f59e0b"}', true, 2, NULL, '00000000-0000-0000-0000-000000000000'),
('categories', 'request', '{"label": "Demandes", "color": "#3b82f6"}', true, 3, NULL, '00000000-0000-0000-0000-000000000000');