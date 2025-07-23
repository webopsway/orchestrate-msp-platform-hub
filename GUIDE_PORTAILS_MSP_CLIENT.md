# 🏢 Guide des Portails MSP et Client

## 📋 Vue d'ensemble

Le système de **portails séparés** permet à votre plateforme MSP de gérer **deux interfaces distinctes** :

1. **🔧 Portail MSP Admin** : Interface complète pour les équipes MSP (vous)
2. **👥 Portail Client** : Interface personnalisée pour vos clients et ESN

---

## 🎯 **Pourquoi deux portails ?**

### **Problèmes résolus :**
- ❌ **Confusion interface** : Clients perdus dans une interface trop complexe
- ❌ **Sécurité** : Clients voient des données qui ne les concernent pas
- ❌ **Branding** : Impossibilité de personnaliser par client
- ❌ **Complexité** : Interface unique difficile à maintenir

### **Avantages obtenus :**
- ✅ **Séparation claire** : Interface MSP vs Interface Client
- ✅ **Sécurité renforcée** : Isolation complète des données
- ✅ **Branding personnalisé** : Logo et couleurs par client
- ✅ **Expérience optimisée** : Interface adaptée au besoin de chaque type d'utilisateur

---

## 🏗️ **Architecture des portails**

### **1. Portail MSP Admin**
```
URL: admin.votredomaine.com (ou localhost en dev)
Utilisateurs: Équipes MSP uniquement
Accès: Toutes organisations et données (cross-tenant)
Interface: Navigation complète avec tous les modules
Contexte: Peut changer d'organisation et d'équipe
```

**Modules disponibles :**
- 📊 Dashboard global
- 🏢 Gestion organisations (toutes)
- 👥 Gestion utilisateurs (tous)
- 🛡️ Administration (rôles, RBAC, etc.)
- 🚀 Applications et déploiements
- 🎯 ITSM complet
- ☁️ Infrastructure cloud
- 📊 Monitoring global
- 🌐 **Gestion des portails clients**
- ⚙️ Paramètres système

### **2. Portail Client**
```
URL: client1.votredomaine.com ou acme.votredomaine.com
Utilisateurs: Utilisateurs de l'organisation cliente
Accès: Données de leur organisation uniquement  
Interface: Navigation simplifiée selon configuration MSP
Contexte: Limité à leur organisation
```

**Modules configurables :**
- 📊 Dashboard client
- 👥 Gestion utilisateurs (équipe)
- 🎯 Services métiers
- 🚀 Applications (leurs apps)
- 📋 ITSM (leurs tickets)
- 📊 Monitoring (leurs services)
- 👤 Profil utilisateur

---

## 🔧 **Configuration des portails clients**

### **Accès à la configuration**
```
Portail MSP Admin → Paramètres → Portails Client
URL: /client-portal-management
```

### **1. Gestion des modules**

#### **Modules disponibles :**
| Module | Description | Recommandé pour |
|--------|-------------|-----------------|
| `dashboard` | Tableau de bord | ✅ Tous |
| `users` | Gestion utilisateurs | ✅ Clients, ESN |
| `teams` | Gestion équipes | ✅ Tous |
| `business-services` | Services métiers | ✅ Clients |
| `applications` | Applications | ✅ Clients, ESN |
| `deployments` | Déploiements | 🟡 Clients avancés |
| `itsm` | Tickets/incidents | ✅ Tous |
| `security` | Sécurité | 🟡 Lecture seule |
| `cloud` | Infrastructure | 🔴 MSP uniquement |
| `monitoring` | Supervision | ✅ Lecture seule |
| `profile` | Profil utilisateur | ✅ Tous |
| `settings` | Paramètres compte | ✅ Tous |

#### **Configuration par type de client :**

**Client Direct :**
```json
{
  "allowed_modules": [
    "dashboard", "users", "teams", "business-services", 
    "applications", "itsm", "monitoring", "profile", "settings"
  ]
}
```

**ESN :**
```json
{
  "allowed_modules": [
    "dashboard", "users", "teams", "itsm", 
    "monitoring", "applications"
  ]
}
```

**Client Simple :**
```json
{
  "allowed_modules": [
    "dashboard", "itsm", "monitoring", "profile"
  ]
}
```

### **2. Personnalisation du branding**

#### **Éléments configurables :**
- **Nom d'entreprise** : Affiché dans l'en-tête
- **Logo** : Logo client dans l'interface
- **Couleur principale** : Couleur des éléments principaux
- **Couleur d'accent** : Couleur des éléments secondaires
- **Favicon** : Icône dans l'onglet du navigateur

#### **Exemple de configuration :**
```json
{
  "branding": {
    "company_name": "ACME Corporation",
    "logo": "https://acme-corp.com/logo.png",
    "primary_color": "#1e40af",
    "accent_color": "#3b82f6",
    "favicon": "https://acme-corp.com/favicon.ico"
  }
}
```

### **3. Paramètres d'interface**

| Paramètre | Description | Défaut |
|-----------|-------------|--------|
| `show_msp_branding` | Afficher infos MSP | `false` |
| `show_organization_selector` | Sélecteur d'org | `false` |
| `show_team_selector` | Sélecteur d'équipe | `true` |
| `theme` | Thème interface | `light` |

---

## 🚀 **Workflow de configuration**

### **Étape 1 : Créer le domaine tenant**
1. Aller dans **Gestion des domaines** (`/tenant-management`)
2. Créer un nouveau domaine pour le client
3. Configurer l'URL : `client-name.votredomaine.com`
4. Assigner à l'organisation cliente

### **Étape 2 : Configurer le portail**
1. Aller dans **Portails Client** (`/client-portal-management`)
2. Sélectionner le domaine créé
3. Cliquer sur **Configurer**

### **Étape 3 : Configurer les modules**
1. Onglet **Modules**
2. Activer/désactiver selon les besoins du client
3. Considérer le type de relation (direct, ESN, etc.)

### **Étape 4 : Personnaliser le branding**
1. Onglet **Branding**
2. Saisir le nom d'entreprise
3. Ajouter le logo (URL)
4. Choisir les couleurs

### **Étape 5 : Ajuster l'interface**
1. Onglet **Interface**
2. Configurer les sélecteurs
3. Décider si afficher le branding MSP

### **Étape 6 : Sauvegarder et tester**
1. Cliquer **Sauvegarder**
2. Ouvrir l'URL du client dans un nouvel onglet
3. Se connecter avec un compte client
4. Vérifier l'interface et les modules

---

## 💡 **Cas d'usage pratiques**

### **Cas 1 : Client Enterprise (ACME Corp)**
```
Domaine: acme.msp.com
Modules: Tous sauf cloud et admin
Branding: Logo ACME, couleurs corporate
Interface: Sélecteur d'équipe activé
```

**Résultat :**
- Interface complète avec logo ACME
- Accès à toutes leurs données
- Gestion de leurs équipes
- Support client via ITSM

### **Cas 2 : ESN partenaire (Alpha Solutions)**
```
Domaine: alpha.msp.com  
Modules: ITSM, monitoring, users, teams
Branding: Logo Alpha, couleurs partenaire
Interface: Vue simplifiée
```

**Résultat :**
- Interface ESN spécialisée
- Focus sur le support technique
- Branding partenaire
- Accès limité et contrôlé

### **Cas 3 : Client simple (Beta Corp)**
```
Domaine: beta.msp.com
Modules: Dashboard, ITSM, monitoring uniquement
Branding: Minimal, couleurs neutres
Interface: Ultra-simple
```

**Résultat :**
- Interface épurée
- Focus sur les tickets uniquement
- Monitoring en lecture seule
- Expérience simplifiée

---

## 🔐 **Sécurité et isolation**

### **Isolation des données**
- ✅ **RLS PostgreSQL** : Isolation au niveau base de données
- ✅ **Contexte organisation** : Limité à l'org du tenant
- ✅ **Variables de session** : `app.current_team`, `app.is_msp`
- ✅ **Détection automatique** : Type de portail selon URL

### **Contrôles d'accès**
- ✅ **Module-level** : Accès par module configuré
- ✅ **Route-level** : URLs protégées selon permissions
- ✅ **Component-level** : Composants masqués si pas d'accès
- ✅ **API-level** : Requêtes filtrées côté serveur

### **Audit et traçabilité**
- ✅ **Logs d'accès** : Qui accède à quoi
- ✅ **Changements config** : Historique des modifications
- ✅ **Actions utilisateur** : Traçabilité complète
- ✅ **Métriques usage** : Analytics par portail

---

## 📊 **Monitoring et métriques**

### **Métriques par portail**
- 👥 **Utilisateurs actifs** par portail
- 📈 **Pages vues** et temps de session
- 🎯 **Modules utilisés** par client
- 🚨 **Incidents créés** via portail client
- ⚡ **Performance** de chaque portail

### **Alertes recommandées**
- 🔴 **Erreur accès** : Tentative d'accès non autorisé
- 🟡 **Portail down** : Portail client inaccessible
- 🟢 **Usage élevé** : Pic d'utilisation inhabituel
- 🔵 **Nouveau tenant** : Configuration requise

---

## 🎨 **Guide de branding**

### **Recommandations design**

#### **Couleurs**
- **Couleur principale** : Couleur corporate du client
- **Couleur d'accent** : Version plus claire/foncée
- **Éviter** : Couleurs trop vives ou contrastées

#### **Logo**
- **Format** : PNG avec fond transparent
- **Taille** : 200x60px maximum
- **Qualité** : Haute résolution pour écrans Retina
- **URL** : HTTPS obligatoire, domaine de confiance

#### **Exemples de palettes**
```css
/* Palette Corporate */
primary: #1e40af    /* Bleu corporate */
accent: #3b82f6     /* Bleu clair */

/* Palette Tech */
primary: #059669    /* Vert tech */
accent: #10b981     /* Vert clair */

/* Palette Neutre */
primary: #374151    /* Gris foncé */
accent: #6b7280     /* Gris moyen */
```

---

## 🔄 **Workflow de déploiement**

### **1. Environnement de développement**
```bash
# Configuration locale
URL MSP: http://localhost:3000
URL Client: http://client1.localhost:3000 (avec config hosts)

# Test de la détection
- Accès admin : is_msp_admin = true
- Accès client : tenant détecté via URL
```

### **2. Environnement de production**
```bash
# Configuration DNS
admin.votredomaine.com → Portail MSP
*.votredomaine.com → Portails clients (wildcard)

# Variables d'environnement
VITE_MSP_ADMIN_DOMAIN=admin.votredomaine.com
VITE_CLIENT_DOMAIN_SUFFIX=.votredomaine.com
```

### **3. Déploiement continu**
```yaml
# CI/CD Pipeline
1. Build application unique
2. Déploiement sur infrastructure
3. Configuration des domaines
4. Tests automatisés par type de portail
5. Monitoring post-déploiement
```

---

## 🛠️ **Maintenance et évolution**

### **Ajout d'un nouveau module**
1. Créer le module dans le code
2. Ajouter à `AVAILABLE_MODULES`
3. Mettre à jour les permissions
4. Tester sur portail test
5. Configurer pour les clients existants

### **Mise à jour du branding**
1. Client fournit nouveaux assets
2. Mise à jour via interface MSP
3. Prévisualisation avant validation
4. Activation en live

### **Migration de clients**
1. Export configuration portail existant
2. Création nouveau domaine
3. Import configuration
4. Tests et validation
5. Bascule DNS

---

## 📋 **Checklist de lancement**

### **Avant la mise en production**
- [ ] Domaines DNS configurés
- [ ] Certificats SSL en place
- [ ] Tests d'accès MSP et client
- [ ] Branding configuré et testé
- [ ] Modules testés par type d'utilisateur
- [ ] Permissions et sécurité validées
- [ ] Documentation utilisateur prête
- [ ] Formation équipes effectuée

### **Après le lancement**
- [ ] Monitoring actif
- [ ] Feedback utilisateurs collecté
- [ ] Performance mesurée
- [ ] Ajustements basés sur l'usage
- [ ] Documentation mise à jour

---

## 🎉 **Conclusion**

Le système de **portails séparés** transforme votre plateforme MSP en solution **véritablement multi-tenant** :

### **Pour votre MSP :**
- ✅ **Interface puissante** avec accès complet
- ✅ **Contrôle granulaire** des portails clients
- ✅ **Branding flexible** par client
- ✅ **Sécurité renforcée** et isolation

### **Pour vos clients :**
- ✅ **Interface personnalisée** à leur image
- ✅ **Expérience simplifiée** et focused
- ✅ **Autonomie** dans leur périmètre
- ✅ **Performance optimisée**

### **Résultat business :**
- 📈 **Satisfaction client** améliorée
- 💰 **Différenciation** concurrentielle  
- 🚀 **Montée en gamme** des services
- 🎯 **Fidélisation** renforcée

**Votre plateforme MSP est maintenant prête pour une croissance scalable et différenciée !** 🚀

---

## 📞 **Support technique**

- **Architecture** : `src/contexts/PortalContext.tsx`
- **Types** : `src/types/portal.ts`  
- **Configuration** : `src/components/admin/ClientPortalManager.tsx`
- **Layout adaptatif** : `src/components/layout/AppLayout.tsx`
- **Navigation dynamique** : `src/components/layout/AppSidebar.tsx` 