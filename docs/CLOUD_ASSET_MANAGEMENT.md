# Gestion des Actifs Cloud et Sécurité

## Vue d'ensemble

Ce module fournit une interface complète pour la gestion des actifs cloud et de la sécurité dans la plateforme MSP. Il s'intègre avec votre stack existante (Wazuh + OSQuery + Semaphore + Supabase) pour offrir un inventaire automatisé, une gestion des vulnérabilités, des patchs et une supervision multi-tenant.

## Architecture

### Stack Technique
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + RLS)
- **Collecte**: Wazuh + OSQuery
- **Orchestration**: Semaphore
- **Sécurité**: RLS (Row Level Security) + RBAC

### Tables Supabase

#### 1. Configurations d'actifs (`cloud_asset_configurations`)
```sql
- id: UUID (PK)
- asset_id: UUID (FK vers cloud_asset)
- team_id: UUID (FK vers teams)
- os: TEXT (système d'exploitation)
- cpu: TEXT (processeur)
- ram: TEXT (mémoire)
- ip: TEXT (adresse IP)
- metadata: JSONB (métadonnées extensibles)
- collected_at: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 2. Packages installés (`cloud_installed_packages`)
```sql
- id: UUID (PK)
- asset_id: UUID (FK vers cloud_asset)
- team_id: UUID (FK vers teams)
- package_name: TEXT (nom du package)
- version: TEXT (version)
- source: TEXT (source d'installation)
- metadata: JSONB
- collected_at: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 3. Processus en cours (`cloud_running_processes`)
```sql
- id: UUID (PK)
- asset_id: UUID (FK vers cloud_asset)
- team_id: UUID (FK vers teams)
- process_name: TEXT (nom du processus)
- pid: INTEGER (Process ID)
- path: TEXT (chemin d'exécution)
- metadata: JSONB
- collected_at: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 4. Statuts de patches (`cloud_patch_status`)
```sql
- id: UUID (PK)
- asset_id: UUID (FK vers cloud_asset)
- team_id: UUID (FK vers teams)
- patch_name: TEXT (nom du patch)
- cve_id: TEXT (CVE associé)
- status: ENUM ('applied', 'pending', 'not_available', 'unknown')
- metadata: JSONB
- collected_at: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 5. Vulnérabilités (`security_vulnerabilities`)
```sql
- cve_id: TEXT (PK)
- severity: TEXT (critique, élevée, moyenne, faible, info)
- cvss_score: NUMERIC (score CVSS 0-10)
- description: TEXT
- published_at: TIMESTAMP
- references: TEXT[] (références)
- source: TEXT (source de la vulnérabilité)
- metadata: JSONB
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## Fonctionnalités

### 1. Inventaire Automatisé
- **Collecte via Wazuh/OSQuery**: Données système collectées automatiquement
- **Synchronisation**: Mise à jour en temps réel des configurations
- **Métadonnées extensibles**: Stockage flexible des informations additionnelles

### 2. Gestion des Packages
- **Inventaire des packages**: Suivi des packages installés
- **Sources multiples**: APT, YUM, DNF, PIP, NPM, Docker, etc.
- **Versions**: Traçabilité des versions installées
- **Métadonnées**: Informations détaillées (architecture, priorité, section)

### 3. Surveillance des Processus
- **Processus actifs**: Suivi des processus en cours d'exécution
- **PID et chemins**: Informations détaillées d'exécution
- **Métadonnées**: Utilisation CPU/mémoire, utilisateur, etc.

### 4. Gestion des Patches
- **Statuts**: Appliqué, en attente, non disponible, inconnu
- **Association CVE**: Liaison avec les vulnérabilités
- **Traçabilité**: Historique des applications de patches

### 5. Base de Vulnérabilités
- **CVE Database**: Base de données des vulnérabilités
- **Scores CVSS**: Évaluation quantitative des risques
- **Sources multiples**: NVD, MITRE, vendeurs, chercheurs
- **Références**: Liens vers les détails techniques

## Interface Utilisateur

### Page Principale (`CloudAssetManagement.tsx`)
- **Onglets multiples**: Configurations, Packages, Processus, Patches, Vulnérabilités
- **Recherche et filtres**: Recherche textuelle et filtres avancés
- **CRUD complet**: Création, lecture, mise à jour, suppression
- **Statistiques**: Tableaux de bord avec métriques clés

### Formulaires Spécialisés
- **CloudAssetConfigurationForm**: Configuration système
- **CloudInstalledPackageForm**: Gestion des packages
- **CloudRunningProcessForm**: Surveillance des processus
- **CloudPatchStatusForm**: Statuts de patches
- **SecurityVulnerabilityForm**: Base de vulnérabilités

## Sécurité et Permissions

### Row Level Security (RLS)
```sql
-- Exemple pour cloud_asset_configurations
CREATE POLICY "Users can view their team's asset configurations"
  ON public.cloud_asset_configurations FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.team_memberships 
      WHERE user_id = auth.uid()
    )
  );
```

### RBAC Frontend
- **Admin MSP**: Accès complet à toutes les données
- **Team Admin**: Accès aux données de son équipe
- **Team Member**: Accès en lecture seule aux données de son équipe

## Intégration avec la Stack Existante

### Wazuh
```bash
# Configuration pour collecter les données système
<agent_config os="Linux">
  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/osquery/osqueryd.results.log</location>
  </localfile>
</agent_config>
```

### OSQuery
```sql
-- Requêtes pour collecter les données
SELECT name, version, source FROM deb_packages;
SELECT name, pid, path FROM processes;
SELECT os_name, cpu_type, physical_memory FROM system_info;
```

### Semaphore
```yaml
# Playbook pour la collecte automatisée
- name: Collect Cloud Asset Data
  hosts: all
  tasks:
    - name: Gather system facts
      setup:
    - name: Collect package information
      shell: dpkg -l
    - name: Collect process information
      shell: ps aux
```

## Utilisation

### 1. Accès à l'interface
```typescript
// Navigation vers la page de gestion
import { CloudAssetManagement } from '@/pages/CloudAssetManagement';

// Dans le routeur
<Route path="/cloud-assets" element={<CloudAssetManagement />} />
```

### 2. Utilisation du hook
```typescript
import { useCloudAssetManagement } from '@/hooks/useCloudAssetManagement';

const MyComponent = () => {
  const {
    configurations,
    packages,
    processes,
    patches,
    vulnerabilities,
    loading,
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,
    // ... autres fonctions
  } = useCloudAssetManagement();

  // Utilisation des données et fonctions
};
```

### 3. Utilisation des formulaires
```typescript
import { CloudAssetConfigurationForm } from '@/components/cloud';

const MyForm = () => {
  const handleSubmit = async (data) => {
    // Traitement des données
  };

  return (
    <CloudAssetConfigurationForm
      onSubmit={handleSubmit}
      onCancel={() => {/* annulation */}}
      loading={false}
    />
  );
};
```

## Configuration

### Variables d'environnement
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Wazuh
WAZUH_MANAGER_URL=your_wazuh_manager_url
WAZUH_API_USERNAME=your_wazuh_username
WAZUH_API_PASSWORD=your_wazuh_password

# OSQuery
OSQUERY_ENDPOINT=your_osquery_endpoint
```

### Migration de base de données
```bash
# Appliquer les migrations
supabase db push

# Vérifier les politiques RLS
supabase db diff --schema public
```

## Monitoring et Maintenance

### Métriques à surveiller
- **Performance**: Temps de réponse des requêtes
- **Stockage**: Croissance des tables de métadonnées
- **Sécurité**: Tentatives d'accès non autorisées
- **Collecte**: Fréquence et qualité des données OSQuery

### Maintenance
- **Nettoyage**: Suppression des anciennes données
- **Optimisation**: Index sur les colonnes fréquemment utilisées
- **Sauvegarde**: Sauvegarde régulière des données critiques

## Évolutions Futures

### Fonctionnalités prévues
- **Alertes automatiques**: Notifications sur les vulnérabilités critiques
- **Rapports automatisés**: Génération de rapports de sécurité
- **Intégration SIEM**: Connexion avec les outils SIEM
- **API REST**: Endpoints pour l'intégration externe
- **Dashboard temps réel**: Visualisation en temps réel des actifs

### Améliorations techniques
- **Cache Redis**: Mise en cache des données fréquemment consultées
- **Streaming**: Mise à jour en temps réel via WebSockets
- **Machine Learning**: Détection automatique d'anomalies
- **Compliance**: Conformité aux standards de sécurité

## Support et Documentation

### Ressources
- **Documentation API**: `/docs/api/cloud-assets`
- **Exemples d'utilisation**: `/examples/cloud-assets`
- **FAQ**: `/docs/faq/cloud-assets`

### Contact
- **Support technique**: support@msp-platform.com
- **Documentation**: docs@msp-platform.com
- **Sécurité**: security@msp-platform.com 