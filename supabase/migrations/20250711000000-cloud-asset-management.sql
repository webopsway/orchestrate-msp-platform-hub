-- Migration: Cloud Asset Management and Security Tables
-- Date: 2025-07-11
-- Description: Ajout des tables pour la gestion des actifs cloud et la sécurité

-- Fonction pour mettre à jour automatiquement updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Table des configurations d'actifs cloud
create table public.cloud_asset_configurations (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.cloud_asset (id) on delete cascade,
  team_id uuid not null references public.teams (id),
  os text,
  cpu text,
  ram text,
  ip text,
  metadata jsonb default '{}'::jsonb,
  collected_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Index pour les configurations d'actifs
create index on public.cloud_asset_configurations (asset_id);
create index on public.cloud_asset_configurations (team_id);
create index on public.cloud_asset_configurations (collected_at);

-- Trigger pour updated_at
create trigger trg_update_cloud_asset_configurations_updated_at
before update on public.cloud_asset_configurations
for each row
execute function public.update_updated_at_column();

-- Table des packages installés
create table public.cloud_installed_packages (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.cloud_asset (id) on delete cascade,
  team_id uuid not null references public.teams (id),
  package_name text not null,
  version text,
  source text,
  metadata jsonb default '{}'::jsonb,
  collected_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Index pour les packages installés
create index on public.cloud_installed_packages (asset_id);
create index on public.cloud_installed_packages (team_id);
create index on public.cloud_installed_packages (package_name);
create index on public.cloud_installed_packages (collected_at);

-- Trigger pour updated_at
create trigger trg_update_cloud_installed_packages_updated_at
before update on public.cloud_installed_packages
for each row
execute function public.update_updated_at_column();

-- Table des processus en cours d'exécution
create table public.cloud_running_processes (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.cloud_asset (id) on delete cascade,
  team_id uuid not null references public.teams (id),
  process_name text not null,
  pid integer,
  path text,
  metadata jsonb default '{}'::jsonb,
  collected_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Index pour les processus en cours
create index on public.cloud_running_processes (asset_id);
create index on public.cloud_running_processes (team_id);
create index on public.cloud_running_processes (process_name);
create index on public.cloud_running_processes (collected_at);

-- Trigger pour updated_at
create trigger trg_update_cloud_running_processes_updated_at
before update on public.cloud_running_processes
for each row
execute function public.update_updated_at_column();

-- Table du statut des patches
create table public.cloud_patch_status (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.cloud_asset (id) on delete cascade,
  team_id uuid not null references public.teams (id),
  patch_name text,
  cve_id text,
  status text not null check (status in ('applied', 'pending', 'not_available', 'unknown')),
  metadata jsonb default '{}'::jsonb,
  collected_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Index pour le statut des patches
create index on public.cloud_patch_status (asset_id);
create index on public.cloud_patch_status (team_id);
create index on public.cloud_patch_status (cve_id);
create index on public.cloud_patch_status (collected_at);

-- Trigger pour updated_at
create trigger trg_update_cloud_patch_status_updated_at
before update on public.cloud_patch_status
for each row
execute function public.update_updated_at_column();

-- Table des vulnérabilités de sécurité
create table public.security_vulnerabilities (
  cve_id text primary key,
  severity text,
  cvss_score numeric,
  description text,
  published_at timestamp with time zone,
  references text[],
  source text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index pour les vulnérabilités
create index on public.security_vulnerabilities (severity);
create index on public.security_vulnerabilities (cvss_score);
create index on public.security_vulnerabilities (published_at);

-- Trigger pour updated_at
create trigger trg_update_security_vulnerabilities_updated_at
before update on public.security_vulnerabilities
for each row
execute function public.update_updated_at_column();

-- RLS (Row Level Security) pour les nouvelles tables
alter table public.cloud_asset_configurations enable row level security;
alter table public.cloud_installed_packages enable row level security;
alter table public.cloud_running_processes enable row level security;
alter table public.cloud_patch_status enable row level security;
alter table public.security_vulnerabilities enable row level security;

-- Politiques RLS pour cloud_asset_configurations
create policy "Users can view their team's asset configurations"
  on public.cloud_asset_configurations for select
  using (
    team_id in (
      select team_id from public.team_memberships 
      where user_id = auth.uid()
    )
  );

create policy "Users can insert their team's asset configurations"
  on public.cloud_asset_configurations for insert
  with check (
    team_id in (
      select team_id from public.team_memberships 
      where user_id = auth.uid()
    )
  );

create policy "Users can update their team's asset configurations"
  on public.cloud_asset_configurations for update
  using (
    team_id in (
      select team_id from public.team_memberships 
      where user_id = auth.uid()
    )
  );

create policy "Users can delete their team's asset configurations"
  on public.cloud_asset_configurations for delete
  using (
    team_id in (
      select team_id from public.team_memberships 
      where user_id = auth.uid()
    )
  );

-- Politiques RLS pour cloud_installed_packages
create policy "Users can view their team's installed packages"
  on public.cloud_installed_packages for select
  using (
    team_id in (
      select team_id from public.team_memberships 
      where user_id = auth.uid()
    )
  );

create policy "Users can insert their team's installed packages"
  on public.cloud_installed_packages for insert
  with check (
    team_id in (
      select team_id from public.team_memberships 
      where user_id = auth.uid()
    )
  );

create policy "Users can update their team's installed packages"
  on public.cloud_installed_packages for update
  using (
    team_id in (
      select team_id from public.team_memberships 
      where user_id = auth.uid()
    )
  );

create policy "Users can delete their team's installed packages"
  on public.cloud_installed_packages for delete
  using (
    team_id in (
      select team_id from public.team_memberships 
      where user_id = auth.uid()
    )
  );

-- Politiques RLS pour cloud_running_processes
create policy "Users can view their team's running processes"
  on public.cloud_running_processes for select
  using (
    team_id in (
      select team_id from public.team_memberships 
      where user_id = auth.uid()
    )
  );

create policy "Users can insert their team's running processes"
  on public.cloud_running_processes for insert
  with check (
    team_id in (
      select team_id from public.team_memberships 
      where user_id = auth.uid()
    )
  );

create policy "Users can update their team's running processes"
  on public.cloud_running_processes for update
  using (
    team_id in (
      select team_id from public.team_memberships 
      where user_id = auth.uid()
    )
  );

create policy "Users can delete their team's running processes"
  on public.cloud_running_processes for delete
  using (
    team_id in (
      select team_id from public.team_memberships 
      where user_id = auth.uid()
    )
  );

-- Politiques RLS pour cloud_patch_status
create policy "Users can view their team's patch status"
  on public.cloud_patch_status for select
  using (
    team_id in (
      select team_id from public.team_memberships 
      where user_id = auth.uid()
    )
  );

create policy "Users can insert their team's patch status"
  on public.cloud_patch_status for insert
  with check (
    team_id in (
      select team_id from public.team_memberships 
      where user_id = auth.uid()
    )
  );

create policy "Users can update their team's patch status"
  on public.cloud_patch_status for update
  using (
    team_id in (
      select team_id from public.team_memberships 
      where user_id = auth.uid()
    )
  );

create policy "Users can delete their team's patch status"
  on public.cloud_patch_status for delete
  using (
    team_id in (
      select team_id from public.team_memberships 
      where user_id = auth.uid()
    )
  );

-- Politiques RLS pour security_vulnerabilities (lecture publique, écriture restreinte)
create policy "Anyone can view security vulnerabilities"
  on public.security_vulnerabilities for select
  using (true);

create policy "Only authenticated users can insert security vulnerabilities"
  on public.security_vulnerabilities for insert
  with check (auth.uid() is not null);

create policy "Only authenticated users can update security vulnerabilities"
  on public.security_vulnerabilities for update
  using (auth.uid() is not null);

create policy "Only authenticated users can delete security vulnerabilities"
  on public.security_vulnerabilities for delete
  using (auth.uid() is not null);

-- Commentaires pour la documentation
comment on table public.cloud_asset_configurations is 'Configurations système des actifs cloud';
comment on table public.cloud_installed_packages is 'Packages installés sur les actifs cloud';
comment on table public.cloud_running_processes is 'Processus en cours d''exécution sur les actifs cloud';
comment on table public.cloud_patch_status is 'Statut des patches de sécurité sur les actifs cloud';
comment on table public.security_vulnerabilities is 'Base de données des vulnérabilités de sécurité (CVE)'; 