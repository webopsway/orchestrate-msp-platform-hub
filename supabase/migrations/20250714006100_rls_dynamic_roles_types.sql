-- Exemple de policy RLS pour user_roles utilisant user_roles_catalog
create policy "Admins peuvent gérer les user_roles"
on public.user_roles
for all
using (
  exists (
    select 1 from public.user_roles_catalog urc
    where urc.id = user_roles.user_role_catalog_id
      and urc.name = 'admin'
  )
);

-- Exemple de policy RLS pour organizations utilisant organization_types
create policy "MSP peuvent voir toutes les organizations"
on public.organizations
for select
using (
  exists (
    select 1 from public.organization_types ot
    where ot.id = organizations.organization_type_id
      and ot.name = 'msp'
  )
); 