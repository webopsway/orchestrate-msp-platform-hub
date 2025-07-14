-- Fonction générique pour updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 1. cloud_asset_configurations
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
create index on public.cloud_asset_configurations (asset_id);
create index on public.cloud_asset_configurations (team_id);
create index on public.cloud_asset_configurations (collected_at);
create trigger trg_update_cloud_asset_configurations_updated_at
before update on public.cloud_asset_configurations
for each row
execute function public.update_updated_at_column();

-- 2. cloud_installed_packages
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
create index on public.cloud_installed_packages (asset_id);
create index on public.cloud_installed_packages (team_id);
create index on public.cloud_installed_packages (package_name);
create index on public.cloud_installed_packages (collected_at);
create trigger trg_update_cloud_installed_packages_updated_at
before update on public.cloud_installed_packages
for each row
execute function public.update_updated_at_column();

-- 3. cloud_running_processes
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
create index on public.cloud_running_processes (asset_id);
create index on public.cloud_running_processes (team_id);
create index on public.cloud_running_processes (process_name);
create index on public.cloud_running_processes (collected_at);
create trigger trg_update_cloud_running_processes_updated_at
before update on public.cloud_running_processes
for each row
execute function public.update_updated_at_column();

-- 4. cloud_patch_status
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
create index on public.cloud_patch_status (asset_id);
create index on public.cloud_patch_status (team_id);
create index on public.cloud_patch_status (cve_id);
create index on public.cloud_patch_status (collected_at);
create trigger trg_update_cloud_patch_status_updated_at
before update on public.cloud_patch_status
for each row
execute function public.update_updated_at_column();

-- 5. security_vulnerabilities
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
create index on public.security_vulnerabilities (severity);
create index on public.security_vulnerabilities (cvss_score);
create index on public.security_vulnerabilities (published_at);
create trigger trg_update_security_vulnerabilities_updated_at
before update on public.security_vulnerabilities
for each row
execute function public.update_updated_at_column(); 