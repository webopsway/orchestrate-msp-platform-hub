-- Créer les permissions RBAC manquantes
INSERT INTO public.permissions (name, display_name, description, resource, action) VALUES
-- Permissions pour les rôles
('roles.read', 'Voir les rôles', 'Consulter la liste des rôles', 'roles', 'read'),
('roles.create', 'Créer des rôles', 'Ajouter de nouveaux rôles', 'roles', 'create'),
('roles.update', 'Modifier les rôles', 'Mettre à jour les rôles existants', 'roles', 'update'),
('roles.delete', 'Supprimer des rôles', 'Supprimer des rôles', 'roles', 'delete'),

-- Permissions pour les permissions
('permissions.read', 'Voir les permissions', 'Consulter la liste des permissions', 'permissions', 'read'),
('permissions.create', 'Créer des permissions', 'Ajouter de nouvelles permissions', 'permissions', 'create'),
('permissions.update', 'Modifier les permissions', 'Mettre à jour les permissions', 'permissions', 'update'),
('permissions.delete', 'Supprimer des permissions', 'Supprimer des permissions', 'permissions', 'delete'),

-- Permissions pour la gestion des rôles utilisateur
('user_roles.read', 'Voir les rôles utilisateur', 'Consulter les attributions de rôles', 'user_roles', 'read'),
('user_roles.create', 'Attribuer des rôles', 'Assigner des rôles aux utilisateurs', 'user_roles', 'create'),
('user_roles.update', 'Modifier les rôles utilisateur', 'Mettre à jour les attributions', 'user_roles', 'update'),
('user_roles.delete', 'Révoquer des rôles', 'Retirer des rôles aux utilisateurs', 'user_roles', 'delete');

-- Assigner toutes les permissions RBAC au rôle MSP Admin
INSERT INTO public.role_permissions (role_id, permission_id, granted_at)
SELECT 
    r.id as role_id,
    p.id as permission_id,
    now() as granted_at
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'msp' 
AND p.resource IN ('roles', 'permissions', 'user_roles')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assigner aussi les permissions aux rôles admin et manager pour la gestion RBAC
INSERT INTO public.role_permissions (role_id, permission_id, granted_at)
SELECT 
    r.id as role_id,
    p.id as permission_id,
    now() as granted_at
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name IN ('admin', 'manager') 
AND p.resource IN ('roles', 'permissions', 'user_roles')
AND p.action IN ('read', 'create', 'update')
ON CONFLICT (role_id, permission_id) DO NOTHING;