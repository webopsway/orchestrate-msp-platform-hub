create table if not exists documentation_pages (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references teams(id) not null,
  title text not null,
  content jsonb not null, -- Stocke la structure TipTap/ProseMirror
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_documentation_pages_team_id on documentation_pages(team_id);