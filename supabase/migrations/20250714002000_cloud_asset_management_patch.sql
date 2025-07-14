-- Correction : version compatible Supabase/Postgres

-- Fonction générique pour updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers pour updated_at (drop si existe, puis create)
DROP TRIGGER IF EXISTS trg_update_cloud_asset_configurations_updated_at ON public.cloud_asset_configurations;
CREATE TRIGGER trg_update_cloud_asset_configurations_updated_at
BEFORE UPDATE ON public.cloud_asset_configurations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_cloud_installed_packages_updated_at ON public.cloud_installed_packages;
CREATE TRIGGER trg_update_cloud_installed_packages_updated_at
BEFORE UPDATE ON public.cloud_installed_packages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_cloud_running_processes_updated_at ON public.cloud_running_processes;
CREATE TRIGGER trg_update_cloud_running_processes_updated_at
BEFORE UPDATE ON public.cloud_running_processes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_cloud_patch_status_updated_at ON public.cloud_patch_status;
CREATE TRIGGER trg_update_cloud_patch_status_updated_at
BEFORE UPDATE ON public.cloud_patch_status
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_security_vulnerabilities_updated_at ON public.security_vulnerabilities;
CREATE TRIGGER trg_update_security_vulnerabilities_updated_at
BEFORE UPDATE ON public.security_vulnerabilities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes (création si absent)
CREATE INDEX IF NOT EXISTS idx_cloud_asset_configurations_asset_id ON public.cloud_asset_configurations(asset_id);
CREATE INDEX IF NOT EXISTS idx_cloud_asset_configurations_team_id ON public.cloud_asset_configurations(team_id);
CREATE INDEX IF NOT EXISTS idx_cloud_asset_configurations_collected_at ON public.cloud_asset_configurations(collected_at);

CREATE INDEX IF NOT EXISTS idx_cloud_installed_packages_asset_id ON public.cloud_installed_packages(asset_id);
CREATE INDEX IF NOT EXISTS idx_cloud_installed_packages_team_id ON public.cloud_installed_packages(team_id);
CREATE INDEX IF NOT EXISTS idx_cloud_installed_packages_package_name ON public.cloud_installed_packages(package_name);
CREATE INDEX IF NOT EXISTS idx_cloud_installed_packages_collected_at ON public.cloud_installed_packages(collected_at);

CREATE INDEX IF NOT EXISTS idx_cloud_running_processes_asset_id ON public.cloud_running_processes(asset_id);
CREATE INDEX IF NOT EXISTS idx_cloud_running_processes_team_id ON public.cloud_running_processes(team_id);
CREATE INDEX IF NOT EXISTS idx_cloud_running_processes_process_name ON public.cloud_running_processes(process_name);
CREATE INDEX IF NOT EXISTS idx_cloud_running_processes_collected_at ON public.cloud_running_processes(collected_at);

CREATE INDEX IF NOT EXISTS idx_cloud_patch_status_asset_id ON public.cloud_patch_status(asset_id);
CREATE INDEX IF NOT EXISTS idx_cloud_patch_status_team_id ON public.cloud_patch_status(team_id);
CREATE INDEX IF NOT EXISTS idx_cloud_patch_status_cve_id ON public.cloud_patch_status(cve_id);
CREATE INDEX IF NOT EXISTS idx_cloud_patch_status_collected_at ON public.cloud_patch_status(collected_at);

CREATE INDEX IF NOT EXISTS idx_security_vulnerabilities_severity ON public.security_vulnerabilities(severity);
CREATE INDEX IF NOT EXISTS idx_security_vulnerabilities_cvss_score ON public.security_vulnerabilities(cvss_score);
CREATE INDEX IF NOT EXISTS idx_security_vulnerabilities_published_at ON public.security_vulnerabilities(published_at);

-- Ajout de colonnes manquantes (exemple, à adapter si besoin)
-- ALTER TABLE public.cloud_asset_configurations ADD COLUMN IF NOT EXISTS nouvelle_colonne type;
-- (Ajoute ici les ALTER TABLE nécessaires si tu as détecté des colonnes manquantes) 