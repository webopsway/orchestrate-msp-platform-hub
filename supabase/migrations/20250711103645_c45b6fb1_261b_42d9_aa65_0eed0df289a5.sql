-- Nettoyer les données existantes pour tester le nouveau système
DELETE FROM public.user_sessions;
DELETE FROM public.team_memberships;
DELETE FROM public.organization_memberships;
DELETE FROM public.teams;
DELETE FROM public.organizations;
UPDATE public.profiles SET is_msp_admin = false, default_organization_id = null, default_team_id = null;