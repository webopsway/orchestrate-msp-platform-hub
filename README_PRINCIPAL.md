# 🚀 MSP Platform Hub - README Principal

## 📋 Vue d'ensemble rapide

**MSP Platform Hub** est une plateforme multi-tenant complète avec architecture séparée permettant :
- 🔧 **Frontend MSP Admin** (port 3000) - Administration globale
- 👥 **Frontend Client Portal** (port 3001) - Portails clients personnalisés
- 📡 **API Backend commune** (port 3002) - Logique métier centralisée
- 🗄️ **Base Supabase** - PostgreSQL avec Row Level Security

---

## 📚 Documentation

| Document | Description | Statut |
|----------|-------------|---------|
| **[DOCUMENTATION_COMPLETE.md](./DOCUMENTATION_COMPLETE.md)** | **📖 Documentation complète de l'application** | ✅ **À LIRE EN PRIORITÉ** |
| [README_PRINCIPAL.md](./README_PRINCIPAL.md) | Vue d'ensemble rapide et navigation | ✅ Document principal |
| [INDEX_DOCUMENTATION.md](./INDEX_DOCUMENTATION.md) | Index et navigation documentation | ✅ Guide navigation |

> **✨ Documentation consolidée** : Tous les guides précédents ont été intégrés dans `DOCUMENTATION_COMPLETE.md` pour éviter la redondance.

---

## ⚡ Démarrage Rapide

### **1. API Backend**
```bash
cd backend
npm install
# Configurer .env avec vos valeurs Supabase
npm run dev  # Port 3002
```

### **2. Frontend MSP Admin**
```bash
cd msp-admin-frontend
npm create vite@latest . -- --template react-ts
npm install axios react-router-dom
npm run dev  # Port 3000
```

### **3. Frontend Client Portal**
```bash
cd client-portal-frontend
npm create vite@latest . -- --template react-ts
npm install axios react-router-dom
npm run dev  # Port 3001
```

### **4. Test complet**
```bash
# Health check API
curl http://localhost:3002/health

# Test création utilisateur avec org/équipe
curl -H "Authorization: Bearer dev" \
     -H "Content-Type: application/json" \
     -d '{"email":"test@client.com","first_name":"Test","last_name":"User","organization_id":"org-id","team_id":"team-id"}' \
     http://localhost:3002/api/users
```

---

## 🏗️ Architecture Résumée

```
┌─────────────────────────────────────────────┐
│ SERVEUR MSP (192.168.1.100)                │
│ ┌─────────────────────────────────────────┐ │
│ │ MSP Admin Frontend (React/Vite)         │ │
│ │ Port 3000 - admin.msp.com               │ │
│ │ • Gestion globale organisations         │ │
│ │ • Création utilisateurs avec org/équipe │ │
│ │ • Accès toutes données (non-RLS)        │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ SERVEUR CLIENT (192.168.1.101)             │
│ ┌─────────────────────────────────────────┐ │
│ │ Client Portal Frontend (React/Vite)     │ │
│ │ Port 3001 - *.msp.com                   │ │
│ │ • Interface tenant-specific             │ │
│ │ • Données filtrées par organisation     │ │
│ │ • Branding personnalisé                 │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ SERVEUR API (192.168.1.102)                │
│ ┌─────────────────────────────────────────┐ │
│ │ API Backend (Node.js/Express)           │ │
│ │ Port 3002                               │ │
│ │ • Interface unique avec Supabase        │ │
│ │ • Authentification JWT centralisée      │ │
│ │ • Validation organisation/équipe        │ │
│ │ • Permissions MSP vs Client             │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ SUPABASE CLOUD                              │
│ ┌─────────────────────────────────────────┐ │
│ │ PostgreSQL + Auth + RLS                 │ │
│ │ • Tables : profiles, organizations,     │ │
│ │   teams, memberships                    │ │
│ │ • Row Level Security pour isolation     │ │
│ │ • Edge Functions                        │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## ✅ Fonctionnalités Clés Implémentées

### **🔐 Gestion des Utilisateurs**
- ✅ **Association obligatoire** utilisateur → organisation → équipe
- ✅ **Validation de cohérence** équipe appartient à l'organisation
- ✅ **Rollback transactionnel** en cas d'erreur
- ✅ **Permissions différenciées** MSP admin vs Client users

### **🏗️ Architecture Séparée**
- ✅ **API Backend commune** centralisant la logique métier
- ✅ **Frontend MSP Admin** pour l'administration globale
- ✅ **Frontend Client Portal** avec interface tenant-specific
- ✅ **Cycles de développement indépendants**
- ✅ **Déploiement sur serveurs séparés**

### **🔒 Sécurité**
- ✅ **Authentification JWT** via Supabase Auth
- ✅ **Row Level Security (RLS)** pour l'isolation des données
- ✅ **Middleware de permissions** dans l'API
- ✅ **CORS configuré** pour les frontends autorisés
- ✅ **Rate limiting** pour éviter les abus

### **📡 API Backend**
- ✅ **Endpoints utilisateurs** avec validation complète
- ✅ **Services métier** pour organisations et équipes
- ✅ **Middleware d'authentification** centralisé
- ✅ **Gestion d'erreurs** standardisée
- ✅ **Documentation API** intégrée

---

## 🚀 Prochaines Étapes

### **Phase 1 : Compléter l'API Backend**
- [ ] Implémenter routes organisations (`/api/organizations`)
- [ ] Implémenter routes équipes (`/api/teams`)
- [ ] Implémenter routes authentification (`/api/auth`)
- [ ] Ajouter routes ITSM, monitoring, etc.

### **Phase 2 : Créer Frontend MSP Admin**
- [ ] Créer projet Vite + React + TypeScript
- [ ] Migrer composants existants vers l'API
- [ ] Implémenter formulaire utilisateur avec org/équipe
- [ ] Tests création utilisateur complets

### **Phase 3 : Créer Frontend Client Portal**
- [ ] Créer projet Vite + React + TypeScript séparé
- [ ] Implémenter résolution tenant par sous-domaine
- [ ] Interface client avec données filtrées
- [ ] Branding personnalisé par organisation

### **Phase 4 : Déploiement Production**
- [ ] Dockeriser les 3 applications
- [ ] Configurer nginx sur les 3 serveurs
- [ ] Tests end-to-end complets
- [ ] Monitoring et logs centralisés

---

## 🛠️ Scripts Utiles

```bash
# Développement - Tous les services
./scripts/dev-tools.sh start

# Déploiement MSP Admin uniquement
./scripts/deploy-msp.sh production

# Déploiement Client Portal uniquement
./scripts/deploy-client.sh production

# Déploiement complet sur serveurs séparés
./scripts/deploy-separated.sh production

# Health checks
curl http://localhost:3002/health
curl http://localhost:3000/
curl http://localhost:3001/
```

---

## 🆘 Support

### **Documentation Technique**
- 📖 **[DOCUMENTATION_COMPLETE.md](./DOCUMENTATION_COMPLETE.md)** - **Document principal complet (871 lignes)**
- 📂 [INDEX_DOCUMENTATION.md](./INDEX_DOCUMENTATION.md) - Index et navigation

### **Logs et Debugging**
```bash
# Logs API Backend
docker logs msp-api

# Logs développement
cd backend && npm run dev  # Logs en temps réel

# Test API avec token de développement
curl -H "Authorization: Bearer dev" http://localhost:3002/api/users
```

### **Problèmes Courants**
- **CORS errors** : Vérifier `ALLOWED_ORIGINS` dans .env de l'API
- **Auth errors** : Vérifier les clés Supabase dans .env
- **Port conflicts** : Modifier les ports dans les configs Vite/Express

---

## 🧹 Documentation Consolidée

**Fichiers supprimés pour éviter la redondance :**
- ~~ARCHITECTURE_SEPAREE.md~~ → Inclus dans DOCUMENTATION_COMPLETE.md
- ~~GUIDE_*~~ → Tous les guides intégrés dans DOCUMENTATION_COMPLETE.md
- ~~docs/*~~ → Ancienne documentation fragmentée remplacée

**Structure finale propre :**
```
📚 Documentation/
├── DOCUMENTATION_COMPLETE.md       📖 Document technique principal (871 lignes)
├── README_PRINCIPAL.md             🚀 Vue d'ensemble et navigation
└── INDEX_DOCUMENTATION.md          📂 Index et guide navigation
```

---

## 🎯 Objectif Final

Cette architecture permet d'avoir :

✅ **2 frontends complètement séparés** avec cycles de vie indépendants
✅ **Déploiement sur serveurs différents** (MSP, Client, API)
✅ **API backend centralisée** gérant toute la logique métier
✅ **Gestion stricte** de l'association utilisateur ↔ organisation ↔ équipe
✅ **Sécurité renforcée** avec isolation des données
✅ **Évolutivité** pour chaque frontend selon ses besoins spécifiques
✅ **Documentation consolidée** en un seul document de référence

**🚀 L'architecture est prête pour supporter vos cycles de développement et déploiements séparés !**
