-- Table pour la documentation des équipes
create table public.team_documents (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id),
  title text not null,
  content text not null,
  author_id uuid references public.profiles(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
create index on public.team_documents (team_id);
create index on public.team_documents (title); 