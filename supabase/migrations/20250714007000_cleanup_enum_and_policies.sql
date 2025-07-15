-- Suppression de toutes les policies sur toutes les tables du schéma public
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT
            policyname,
            schemaname,
            tablename
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE FORMAT('DROP POLICY IF EXISTS %I ON %I.%I;', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Suppression de la colonne "role" après suppression des policies
ALTER TABLE IF EXISTS public.team_memberships DROP COLUMN IF EXISTS role;

-- Suppression de la colonne dépendant du type ENUM organization_type
ALTER TABLE IF EXISTS public.organizations DROP COLUMN IF EXISTS type;

-- Suppression de la colonne dépendant du type ENUM user_role
ALTER TABLE IF EXISTS public.organization_memberships DROP COLUMN IF EXISTS role;

-- Suppression des anciennes colonnes ENUM si elles existent
alter table if exists public.user_roles drop column if exists user_role;
alter table if exists public.organizations drop column if exists organization_type;

-- Suppression des types ENUM si existants
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'team_role') THEN
    EXECUTE 'DROP TYPE team_role';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    EXECUTE 'DROP TYPE user_role';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_type') THEN
    EXECUTE 'DROP TYPE organization_type';
  END IF;
END $$; 