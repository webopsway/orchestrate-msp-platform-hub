# Guide des Cas d'Usage Multi-Tenant MSP

## 🎯 Vue d'ensemble des 3 types de relations

Votre plateforme gère déjà **3 types de relations business** via la table `msp_client_relations`. Le système multi-tenant s'adapte parfaitement à ces relations existantes.

---

## 📊 **Cas 1 : Client Direct MSP**

### Structure de la relation
```sql
-- Table msp_client_relations
msp_organization_id: UUID du MSP (OpsWay)
client_organization_id: UUID du Client (ACME Corp)
esn_organization_id: NULL
relation_type: 'direct'
```

### Configuration du domaine tenant
```sql
-- Table tenant_domains
domain_name: 'acme-corp'
full_url: 'acme-corp.platform.com'
organization_id: UUID d'ACME Corp
tenant_type: 'client'
branding: {
  "company_name": "ACME Corporation",
  "logo": "https://acme-corp.com/logo.png",
  "primary_color": "#1e40af"
}
```

### Accès automatique configuré
```sql
-- Table tenant_access_config
1. ACME Corp → Accès complet (propriétaire)
2. OpsWay MSP → Accès technique (ITSM, Cloud, Monitoring)
```

### Expérience utilisateur

#### **Pour les utilisateurs ACME Corp :**
- **URL** : `https://acme-corp.platform.com`
- **Branding** : Logo et couleurs ACME
- **Interface** : "Bienvenue chez ACME Corporation"
- **Modules** : ITSM, Monitoring (selon contrat)
- **Données** : Uniquement leurs données

#### **Pour les techniciens OpsWay :**
- **Accès** : Via la même URL pour support technique
- **Interface** : Mention "Support OpsWay pour ACME"
- **Modules** : Cloud, Infrastructure, Sécurité
- **Permissions** : Gestion technique complète

---

## 🔗 **Cas 2 : Client via ESN**

### Structure de la relation
```sql
-- Table msp_client_relations
msp_organization_id: UUID du MSP (OpsWay)
client_organization_id: UUID du Client (Beta Corp)
esn_organization_id: UUID de l'ESN (Alpha Solutions)
relation_type: 'via_esn'
```

### Configuration des domaines tenant

#### **Seul domaine pour l'ESN**  
```sql
domain_name: 'alpha-solutions'
full_url: 'alpha-solutions.platform.com'
organization_id: UUID d'Alpha Solutions
tenant_type: 'esn'
```

#### **Pas de domaine dédié pour le Client**
Le client Beta Corp accède uniquement via le portail ESN Alpha Solutions.

### Accès automatique configuré

#### **Pour alpha-solutions.platform.com :**
```sql
1. Alpha Solutions → Accès complet ESN (propriétaire)
2. Tous les clients d'Alpha → Accès via sélecteur de client
3. OpsWay MSP → Accès technique complet
```

### Expérience utilisateur

#### **Utilisateurs Beta Corp :**
- **URL** : `https://alpha-solutions.platform.com`
- **Connexion** : Via comptes gérés par Alpha Solutions
- **Interface** : Portail Alpha Solutions avec sélecteur de client
- **Vue** : Données filtrées pour Beta Corp uniquement
- **Branding** : Logo Alpha Solutions + mention "Client : Beta Corp"
- **Modules** : ITSM, Monitoring (selon contrat ESN)

#### **Managers Alpha Solutions :**
- **URL** : `https://alpha-solutions.platform.com`
- **Interface** : Dashboard ESN multi-clients
- **Vue globale** : Tous leurs clients + statistiques consolidées
- **Sélecteur** : Basculer entre vue globale et vue client spécifique
- **Modules** : Gestion utilisateurs, ITSM, Reporting, Administration

#### **Techniciens OpsWay :**
- **URL** : `https://alpha-solutions.platform.com`
- **Accès** : Via permissions MSP
- **Interface** : Vue technique selon client sélectionné
- **Modules** : Infrastructure, Sécurité, Cloud

---

## 🏢 **Cas 3 : ESN Standalone**

### Structure sans relation MSP spécifique
```sql
-- ESN qui gère ses propres clients directement
-- Pas forcément dans msp_client_relations
organization.type: 'esn'
organization.name: 'Gamma Solutions'
```

### Configuration du domaine tenant
```sql
domain_name: 'gamma-solutions'
full_url: 'gamma-solutions.platform.com'
organization_id: UUID de Gamma Solutions
tenant_type: 'esn'
branding: {
  "company_name": "Gamma Solutions",
  "logo": "https://gamma.com/logo.png",
  "primary_color": "#10b981"
}
```

### Expérience utilisateur

#### **Managers Gamma Solutions :**
- **URL** : `https://gamma-solutions.platform.com`
- **Branding** : Logo et couleurs Gamma
- **Interface** : "Portail Gamma Solutions"
- **Vue** : Dashboard consolidé multi-clients
- **Modules** : Gestion complète ESN

---

## ⚡ **Configuration automatique des accès**

Le système configure automatiquement les accès selon les relations :

### **Algorithme de configuration**

```typescript
// Pseudo-code de la logique
switch (tenant.tenant_type) {
  case 'client':
    // 1. Le client a accès complet
    addAccess(client_org, 'full')
    
    // 2. Chercher relation MSP-Client
    const relation = getMspClientRelation(client_org)
    if (relation) {
      addAccess(relation.msp_org, 'technical') // MSP technique
      
      if (relation.esn_org) {
        addAccess(relation.esn_org, 'management') // ESN gestion
      }
    }
    break;
    
  case 'esn':
    // 1. L'ESN a accès complet
    addAccess(esn_org, 'full')
    
    // 2. Ajouter tous ses clients
    const clients = getEsnClients(esn_org)
    clients.forEach(client => addAccess(client, 'view'))
    
    // 3. Ajouter le MSP technique
    const msp = getEsnMsp(esn_org)
    if (msp) addAccess(msp, 'technical')
    break;
}
```

### **Matrice des permissions par module**

| Module | Client Direct | Client via ESN | ESN | MSP |
|--------|---------------|----------------|-----|-----|
| **ITSM** | ✅ Complet | ✅ Complet | ✅ Multi-clients | ✅ Technique |
| **Users/Teams** | ✅ Ses équipes | ✅ Ses équipes | ✅ Tous clients | ✅ Admin |
| **Cloud** | 🔍 Vue seule | 🔍 Vue seule | 📊 Reporting | ✅ Gestion |
| **Monitoring** | ✅ Ses métriques | ✅ Ses métriques | 📊 Consolidé | ✅ Complet |
| **Sécurité** | 🔍 Incidents | 🔍 Incidents | 📊 Vue globale | ✅ Gestion |
| **Admin** | ❌ Aucun | ❌ Aucun | 🔧 ESN settings | ✅ Complet |

**Légendes :**
- ✅ Accès complet  
- 🔍 Lecture seule  
- 📊 Vue consolidée/reporting  
- 🔧 Configuration limitée  
- ❌ Pas d'accès  

---

## 🎨 **Personnalisation par cas d'usage**

### **Templates de branding par type**

#### **Client Direct**
```json
{
  "company_name": "{{CLIENT_NAME}}",
  "logo": "{{CLIENT_LOGO_URL}}",
  "primary_color": "{{CLIENT_COLOR}}",
  "ui_config": {
    "sidebar_style": "modern",
    "show_organization_switcher": false,
    "theme": "light"
  }
}
```

#### **Client via ESN**
```json
{
  "company_name": "{{CLIENT_NAME}}",
  "logo": "{{CLIENT_LOGO_URL}}",
  "primary_color": "{{CLIENT_COLOR}}",
  "ui_config": {
    "sidebar_style": "modern",
    "show_organization_switcher": false,
    "show_esn_support": true,
    "esn_name": "{{ESN_NAME}}"
  }
}
```

#### **ESN Dashboard**
```json
{
  "company_name": "{{ESN_NAME}} - Portail Clients",
  "logo": "{{ESN_LOGO_URL}}",
  "primary_color": "{{ESN_COLOR}}",
  "ui_config": {
    "sidebar_style": "minimal",
    "show_organization_switcher": true,
    "show_client_selector": true,
    "dashboard_layout": "multi_client"
  }
}
```

---

## 🚀 **Workflow de création**

### **1. Pour un Client Direct**
```bash
# Créer la relation MSP-Client
INSERT INTO msp_client_relations (
  msp_organization_id, client_organization_id, 
  relation_type
) VALUES (
  'msp-uuid', 'client-uuid', 'direct'
);

# Créer le domaine tenant
INSERT INTO tenant_domains (
  domain_name, organization_id, tenant_type
) VALUES (
  'client-name', 'client-uuid', 'client'
);
```

### **2. Pour un Client via ESN**
```bash
# Créer la relation MSP-ESN-Client
INSERT INTO msp_client_relations (
  msp_organization_id, client_organization_id, 
  esn_organization_id, relation_type
) VALUES (
  'msp-uuid', 'client-uuid', 'esn-uuid', 'via_esn'
);

# PAS de domaine pour le client - il accède via l'ESN !

# Créer UNIQUEMENT le domaine tenant pour l'ESN (si pas déjà fait)
INSERT INTO tenant_domains (
  domain_name, organization_id, tenant_type
) VALUES (
  'esn-name', 'esn-uuid', 'esn'
);

# Configurer l'accès du client via le portail ESN
INSERT INTO tenant_access_config (
  tenant_domain_id, organization_id, access_type, allowed_modules
) VALUES (
  'esn-tenant-id', 'client-uuid', 'limited', 
  '["itsm", "monitoring"]'
);
```

---

## 🔄 **Évolution et migration**

### **Changement de relation**
- **Direct → Via ESN** : Ajout de l'ESN dans `msp_client_relations` + mise à jour des accès
- **Via ESN → Direct** : Suppression de l'ESN + reconfiguration des accès
- **Changement d'ESN** : Mise à jour de `esn_organization_id`

### **Gestion des transitions**
- Les accès existants sont préservés pendant la transition
- Les utilisateurs gardent leur historique et données
- Seules les permissions changent selon la nouvelle relation

---

## 📈 **Tableau de bord admin MSP**

### **Vue par type de relation**

```
📊 Relations MSP-Client
├── 🔗 Direct (15 clients)
│   ├── acme-corp.platform.com
│   ├── beta-tech.platform.com
│   └── ...
├── 🏢 Via ESN (8 clients via 3 ESN)
│   ├── ESN Alpha (3 clients)
│   ├── ESN Beta (3 clients)
│   └── ESN Gamma (2 clients)
└── 📱 Statistiques
    ├── 95% uptime domains
    ├── 1.2s avg resolution time
    └── 23 domaines actifs
```

Le système multi-tenant s'intègre parfaitement dans votre architecture existante, en exploitant les relations MSP-Client-ESN déjà en place pour créer des expériences personnalisées et sécurisées pour chaque type d'acteur ! 🎉

---

## 📋 **Tableau récapitulatif des 3 cas d'usage**

| Aspect | **Client Direct MSP** | **Client via ESN** | **ESN Standalone** |
|--------|----------------------|---------------------|-------------------|
| **Relation** | MSP ↔ Client | MSP ↔ ESN ↔ Client | ESN → Clients propres |
| **URL Client** | `client.platform.com` | **Accès via portail ESN** | Accès via portail ESN |
| **URL ESN** | - | `esn.platform.com` | `esn.platform.com` |
| **Branding Client** | ✅ Logo + couleurs client | 🔗 Via interface ESN | Via interface ESN |
| **Branding ESN** | - | ✅ Dashboard multi-clients | ✅ Interface ESN complète |
| **Accès MSP** | 🔧 Technique direct | 🔧 Technique via portail ESN | 🔧 Support si partenariat |
| **Accès ESN** | - | 👥 Gestion complète + clients | 👥 Gestion complète |
| **Modules Client** | ITSM, Monitoring | ITSM, Monitoring (via ESN) | Selon ESN |
| **Modules ESN** | - | Gestion, Reporting, Admin | Complet ESN |

### 🔑 **Points clés à retenir :**

1. **Client Direct** : URL dédiée avec branding complet
2. **Client via ESN** : **PAS d'URL dédiée**, accès via portail ESN uniquement  
3. **ESN** : Interface consolidée pour gérer tous leurs clients
4. **MSP** : Accès technique sur tous les portails selon les besoins

Cette approche respecte la hiérarchie contractuelle : l'ESN contrôle l'accès client quand elle est l'intermédiaire contractuel. 