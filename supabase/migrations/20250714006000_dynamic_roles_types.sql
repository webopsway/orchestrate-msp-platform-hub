-- Table des rôles utilisateurs dynamiques
create table if not exists public.user_roles_catalog (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  display_name text not null,
  description text,
  is_default boolean default false,
  created_at timestamp with time zone default now()
);

-- Table des types d'organisation dynamiques
create table if not exists public.organization_types (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  display_name text not null,
  description text,
  is_default boolean default false,
  created_at timestamp with time zone default now()
);

-- Peuplement initial (adapter selon tes besoins)
insert into public.user_roles_catalog (name, display_name, description, is_default)
values ('admin', 'Administrateur', 'Administrateur utilisateur', true)
on conflict (name) do nothing;
insert into public.user_roles_catalog (name, display_name, description, is_default)
values ('manager', 'Manager', 'Manager utilisateur', false)
on conflict (name) do nothing;
insert into public.user_roles_catalog (name, display_name, description, is_default)
values ('technician', 'Technicien', 'Technicien utilisateur', false)
on conflict (name) do nothing;
insert into public.user_roles_catalog (name, display_name, description, is_default)
values ('user', 'Utilisateur', 'Utilisateur standard', false)
on conflict (name) do nothing;

insert into public.organization_types (name, display_name, description, is_default)
values ('client', 'Client', 'Organisation client', true)
on conflict (name) do nothing;
insert into public.organization_types (name, display_name, description, is_default)
values ('esn', 'ESN', 'Entreprise de Services du Numérique', false)
on conflict (name) do nothing;
insert into public.organization_types (name, display_name, description, is_default)
values ('msp', 'MSP', 'Managed Service Provider', false)
on conflict (name) do nothing;

-- Ajout des colonnes de référence dans les tables métiers (exemples)
alter table public.user_roles add column if not exists user_role_catalog_id uuid references public.user_roles_catalog(id);
alter table public.organizations add column if not exists organization_type_id uuid references public.organization_types(id);
-- Ajoute ici d'autres adaptations selon ton modèle

-- Index
create index if not exists idx_user_roles_user_role_catalog_id on public.user_roles(user_role_catalog_id);
create index if not exists idx_organizations_organization_type_id on public.organizations(organization_type_id); 