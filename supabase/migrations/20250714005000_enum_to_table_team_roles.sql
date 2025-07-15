-- Suppression de toutes les policies sur les tables concernées
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'team_memberships'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.team_memberships;', r.policyname);
  END LOOP;
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'user_roles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles;', r.policyname);
  END LOOP;
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'organizations'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.organizations;', r.policyname);
  END LOOP;
END $$; 