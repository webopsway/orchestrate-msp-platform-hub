# 📖 Documentation Complète - MSP Platform Hub

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Technologies](#technologies)
4. [Structure du projet](#structure-du-projet)
5. [API Backend](#api-backend)
6. [Frontend MSP Admin](#frontend-msp-admin)
7. [Frontend Client Portal](#frontend-client-portal)
8. [Base de données](#base-de-données)
9. [Authentification & Sécurité](#authentification--sécurité)
10. [Déploiement](#déploiement)
11. [Développement](#développement)
12. [Maintenance](#maintenance)
13. [API Référence](#api-référence)

---

## 🎯 Vue d'ensemble

Le **MSP Platform Hub** est une plateforme multi-tenant complète pour les fournisseurs de services managés (MSP) et leurs clients. L'application permet la gestion centralisée des organisations, équipes, utilisateurs, et services IT avec une séparation claire entre l'interface d'administration MSP et les portails clients.

### **Objectifs principaux**
- **Gestion multi-tenant** avec isolation stricte des données
- **Interface MSP Admin** pour la gestion globale
- **Portails Client** personnalisés par organisation
- **Association obligatoire** utilisateur ↔ organisation ↔ équipe
- **Cycles de développement indépendants** entre frontends
- **Déploiement sur serveurs séparés**

### **Utilisateurs cibles**
- **Administrateurs MSP** : Gestion globale, configuration, monitoring
- **Clients ESN** : Gestion de leurs équipes et services
- **Utilisateurs finaux** : Accès aux services selon leurs permissions

---

## 🏗️ Architecture

### **Architecture générale**
```
┌─────────────────────────────────────────────┐
│                 FRONTENDS                   │
├─────────────────────┬───────────────────────┤
│   MSP Admin App     │   Client Portal App   │
│   Port 3000         │   Port 3001           │
│   Serveur MSP       │   Serveur Client      │
└─────────────────────┴───────────────────────┘
                        │
                ┌───────▼───────┐
                │  API Backend  │
                │  Port 3002    │
                │ Node.js/Express│
                └───────┬───────┘
                        │
                ┌───────▼───────┐
                │   Supabase    │
                │  PostgreSQL   │
                │   Auth + RLS  │
                └───────────────┘
```

### **Principe de séparation**
- **API Backend commune** : Interface unique avec Supabase, logique métier centralisée
- **Frontend MSP Admin** : Interface d'administration, accès complet aux données
- **Frontend Client Portal** : Interfaces tenant-specific, données filtrées par organisation

### **Communication**
- **Frontends → API** : Appels REST avec authentification JWT
- **API → Supabase** : Requêtes SQL avec Row Level Security (RLS)
- **Aucun appel direct** frontend → Supabase pour la sécurité

---

## 💻 Technologies

### **API Backend**
```json
{
  "runtime": "Node.js 18+",
  "framework": "Express.js",
  "language": "JavaScript ES6+",
  "database": "Supabase (PostgreSQL)",
  "auth": "JWT + Supabase Auth",
  "security": "Helmet, CORS, Rate Limiting",
  "logging": "Morgan",
  "validation": "Joi"
}
```

### **Frontend MSP Admin**
```json
{
  "framework": "React 18",
  "language": "TypeScript",
  "build": "Vite",
  "routing": "React Router",
  "ui": "Tailwind CSS + Radix UI",
  "state": "React Query + Zustand",
  "http": "Axios",
  "forms": "React Hook Form + Zod"
}
```

### **Frontend Client Portal**
```json
{
  "framework": "React 18",
  "language": "TypeScript",
  "build": "Vite",
  "routing": "React Router",
  "ui": "Tailwind CSS + Radix UI",
  "state": "React Query + Zustand",
  "http": "Axios",
  "tenant": "Subdomain-based routing"
}
```

### **Infrastructure**
```json
{
  "database": "Supabase PostgreSQL",
  "storage": "Supabase Storage",
  "auth": "Supabase Auth",
  "functions": "Supabase Edge Functions",
  "deployment": "Docker + Nginx",
  "monitoring": "Logs + Health checks"
}
```

---

## 📁 Structure du projet

```
orchestrate-msp-platform-hub/
├── backend/                              # API Backend
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js              # Configuration Supabase
│   │   ├── middleware/
│   │   │   └── auth.js                  # Middleware authentification
│   │   ├── routes/
│   │   │   ├── users.js                 # Routes utilisateurs
│   │   │   ├── organizations.js         # Routes organisations
│   │   │   └── teams.js                 # Routes équipes
│   │   ├── services/
│   │   │   ├── userService.js           # Service utilisateurs
│   │   │   ├── organizationService.js   # Service organisations
│   │   │   └── teamService.js           # Service équipes
│   │   └── index.js                     # Point d'entrée Express
│   ├── package.json                     # Dépendances backend
│   ├── env.example                      # Variables d'environnement
│   └── Dockerfile                       # Conteneur backend
│
├── msp-admin-frontend/                   # Frontend MSP Admin
│   ├── src/
│   │   ├── components/
│   │   │   ├── users/                   # Composants utilisateurs
│   │   │   ├── organizations/           # Composants organisations
│   │   │   ├── teams/                   # Composants équipes
│   │   │   └── layout/                  # Layout MSP
│   │   ├── pages/                       # Pages MSP
│   │   ├── services/                    # Services API
│   │   ├── hooks/                       # Hooks React
│   │   └── types/                       # Types TypeScript
│   ├── package.json                     # Dépendances MSP
│   └── Dockerfile                       # Conteneur MSP
│
├── client-portal-frontend/               # Frontend Client Portal
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/               # Dashboard client
│   │   │   ├── team/                    # Gestion équipe
│   │   │   └── layout/                  # Layout client
│   │   ├── pages/                       # Pages client
│   │   ├── services/                    # Services API
│   │   └── hooks/                       # Hooks React
│   ├── package.json                     # Dépendances client
│   └── Dockerfile                       # Conteneur client
│
├── supabase/                            # Configuration Supabase
│   ├── migrations/                      # Migrations SQL
│   ├── functions/                       # Edge Functions
│   └── config.toml                      # Config Supabase
│
├── docs/                                # Documentation
│   ├── api-reference.md                 # Référence API
│   ├── architecture.md                  # Architecture
│   └── deployment.md                    # Déploiement
│
├── scripts/                             # Scripts utilitaires
│   ├── deploy-msp.sh                    # Déploiement MSP
│   ├── deploy-client.sh                 # Déploiement Client
│   └── dev-tools.sh                     # Outils développement
│
└── configs/                             # Configurations
    ├── nginx-msp-server.conf            # Nginx MSP
    └── nginx-client-server.conf         # Nginx Client
```

---

## 🔧 API Backend

### **Architecture du backend**
L'API Backend centralise toute la logique métier et sert d'interface unique avec Supabase.

### **Endpoints principaux**

#### **Authentification**
```
POST   /api/auth/login          # Connexion utilisateur
POST   /api/auth/logout         # Déconnexion
GET    /api/auth/me             # Profil utilisateur actuel
POST   /api/auth/refresh        # Renouvellement token
```

#### **Utilisateurs**
```
GET    /api/users               # Liste utilisateurs (filtrée selon permissions)
POST   /api/users               # Créer utilisateur (MSP admin uniquement)
GET    /api/users/:id           # Détails utilisateur
PUT    /api/users/:id           # Modifier utilisateur
DELETE /api/users/:id           # Supprimer utilisateur (MSP admin uniquement)
```

#### **Organisations**
```
GET    /api/organizations       # Liste organisations
POST   /api/organizations       # Créer organisation (MSP admin)
GET    /api/organizations/:id   # Détails organisation
PUT    /api/organizations/:id   # Modifier organisation
DELETE /api/organizations/:id   # Supprimer organisation (MSP admin)
```

#### **Équipes**
```
GET    /api/teams               # Liste équipes (filtrées par organisation)
POST   /api/teams               # Créer équipe
GET    /api/teams/:id           # Détails équipe
PUT    /api/teams/:id           # Modifier équipe
DELETE /api/teams/:id           # Supprimer équipe
```

### **Middleware de sécurité**
- **authMiddleware** : Vérification JWT et récupération profil utilisateur
- **requireMspAdmin** : Restriction aux administrateurs MSP
- **requireTeamMember** : Vérification appartenance équipe
- **requireOrganizationMember** : Vérification appartenance organisation

### **Services métier**

#### **UserService**
```javascript
// Création utilisateur avec validation organisation/équipe
static async createUser(userData) {
  // 1. Validation des données obligatoires
  // 2. Vérification cohérence équipe ↔ organisation
  // 3. Création profil utilisateur
  // 4. Création adhésion organisation
  // 5. Création adhésion équipe
  // 6. Rollback automatique en cas d'erreur
}
```

#### **Validation de la cohérence des données**
- **Équipe appartient à l'organisation** lors de la création utilisateur
- **Rollback transactionnel** en cas d'erreur
- **Vérification des permissions** avant chaque opération

---

## 🔧 Frontend MSP Admin

### **Responsabilités**
- Gestion globale des organisations et équipes
- Création et administration des utilisateurs
- Configuration des permissions et rôles
- Monitoring et analytics globaux
- Accès à toutes les données (non soumis aux restrictions tenant)

### **Pages principales**
- **Dashboard** : Vue d'ensemble des KPIs
- **Organisations** : CRUD organisations
- **Équipes** : CRUD équipes par organisation
- **Utilisateurs** : CRUD utilisateurs avec association org/équipe
- **Rôles & Permissions** : Gestion RBAC
- **Settings** : Configuration globale

### **Composants spécialisés**
```typescript
// Formulaire création utilisateur avec validation
<UserForm
  onSubmit={handleCreateUser}
  organizations={organizations}
  teams={filteredTeams}
  validateOrgTeamConsistency={true}
/>

// Table utilisateurs avec filtres avancés
<UserTable
  users={users}
  showAllOrganizations={true}
  allowCreate={true}
  allowDelete={true}
/>
```

### **Services API**
```typescript
// Service utilisateurs MSP Admin
export const userService = {
  async getUsers(): Promise<User[]> {
    // Récupère TOUS les utilisateurs (MSP admin privilege)
  },

  async createUser(userData: CreateUserData): Promise<User> {
    // Créer avec validation organisation/équipe obligatoire
  }
};
```

---

## 👥 Frontend Client Portal

### **Responsabilités**
- Interface personnalisée par organisation (tenant)
- Gestion des membres de l'équipe cliente
- Accès limité aux services autorisés
- Dashboard adapté aux besoins client
- Branding personnalisé par organisation

### **Multi-tenancy**
```typescript
// Résolution du tenant par sous-domaine
const tenant = extractTenantFromSubdomain(window.location.hostname);
// client1.msp.com → tenant: "client1"

// Filtrage automatique des données par tenant
const users = await userService.getUsersByTeam(currentUser.team_id);
```

### **Pages client**
- **Dashboard Client** : KPIs spécifiques à l'organisation
- **Team Members** : Gestion des membres de l'équipe
- **Services** : Services IT disponibles pour ce client
- **Tickets** : Support et incidents
- **Reports** : Rapports limités à l'organisation

### **Composants adaptés**
```typescript
// Interface simplifiée pour clients
<ClientUserForm
  onSubmit={handleUpdateUser}
  restrictedFields={['organization_id', 'team_id']}
  allowedRoles={clientRoles}
/>

// Dashboard avec métriques client
<ClientDashboard
  organizationId={currentUser.organization_id}
  teamId={currentUser.team_id}
/>
```

---

## 🗄️ Base de données

### **Tables principales**

#### **profiles** (Utilisateurs)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  is_msp_admin BOOLEAN DEFAULT FALSE,
  default_organization_id UUID REFERENCES organizations(id),
  default_team_id UUID REFERENCES teams(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **organizations** (Organisations)
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT,
  is_msp BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **teams** (Équipes)
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  description TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **organization_memberships** (Adhésions organisations)
```sql
CREATE TABLE organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);
```

#### **team_memberships** (Adhésions équipes)
```sql
CREATE TABLE team_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, team_id)
);
```

### **Row Level Security (RLS)**
```sql
-- Politique pour les profils utilisateurs
CREATE POLICY "Users can view team members" ON profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM team_memberships
      WHERE team_id = profiles.default_team_id
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_msp_admin = true
    )
  );

-- Politique pour les organisations
CREATE POLICY "Users can view their organization" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_msp_admin = true
    )
  );
```

---

## 🔐 Authentification & Sécurité

### **Flow d'authentification**
1. **Login** : Utilisateur se connecte via Supabase Auth
2. **Token JWT** : Supabase génère un token JWT
3. **API Backend** : Vérifie le token et récupère le profil complet
4. **Permissions** : Applique les restrictions selon le rôle (MSP admin vs Client)

### **Middleware de sécurité**
```javascript
// Vérification du token et récupération du profil
export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.substring(7);

  // Vérifier le token avec Supabase
  const { data: user } = await supabaseClient.auth.getUser(token);

  // Récupérer le profil complet avec organisation/équipe
  const profile = await getUserProfile(user.user.id);

  req.user = profile;
  next();
};
```

### **Permissions par rôle**

#### **MSP Admin**
- ✅ Accès à toutes les organisations
- ✅ Création/modification/suppression utilisateurs
- ✅ Gestion des organisations et équipes
- ✅ Accès aux analytics globaux
- ✅ Configuration système

#### **Client User**
- ❌ Accès limité à son organisation uniquement
- ❌ Pas de création d'utilisateurs
- ✅ Modification de son profil
- ✅ Vue des membres de son équipe
- ✅ Accès aux services autorisés

### **Validation des données**
```javascript
// Validation obligatoire organisation + équipe
const userSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  organization_id: z.string().uuid(), // OBLIGATOIRE
  team_id: z.string().uuid(),         // OBLIGATOIRE
});

// Vérification cohérence équipe ↔ organisation
if (team.organization_id !== userData.organization_id) {
  throw new Error('L\'équipe doit appartenir à l\'organisation sélectionnée');
}
```

---

## 🚀 Déploiement

### **Architecture de déploiement**

#### **Serveur MSP Admin (192.168.1.100)**
```nginx
# nginx configuration
server {
  listen 443 ssl;
  server_name admin.msp.com;
  root /var/www/msp-admin;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api {
    proxy_pass http://192.168.1.102:3002;
  }
}
```

#### **Serveur Client Portal (192.168.1.101)**
```nginx
# nginx configuration pour wildcard
server {
  listen 443 ssl;
  server_name *.msp.com;
  root /var/www/client-portal;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api {
    proxy_pass http://192.168.1.102:3002;
  }
}
```

#### **Serveur API Backend (192.168.1.102)**
```bash
# Docker deployment
docker run -d \
  --name msp-api \
  -p 3002:3002 \
  -e SUPABASE_URL=https://xxx.supabase.co \
  -e SUPABASE_SERVICE_KEY=xxx \
  msp-platform-api:latest
```

### **Scripts de déploiement**

#### **Déploiement MSP Admin**
```bash
#!/bin/bash
# deploy-msp.sh

echo "🔧 Building MSP Admin..."
cd msp-admin-frontend
npm run build

echo "📦 Deploying to MSP server..."
rsync -avz dist/ admin@192.168.1.100:/var/www/msp-admin/

echo "🔄 Restarting nginx..."
ssh admin@192.168.1.100 "sudo systemctl reload nginx"

echo "✅ MSP Admin deployed successfully!"
```

#### **Déploiement Client Portal**
```bash
#!/bin/bash
# deploy-client.sh

echo "👥 Building Client Portal..."
cd client-portal-frontend
npm run build

echo "📦 Deploying to Client server..."
rsync -avz dist/ admin@192.168.1.101:/var/www/client-portal/

echo "🔄 Restarting nginx..."
ssh admin@192.168.1.101 "sudo systemctl reload nginx"

echo "✅ Client Portal deployed successfully!"
```

### **Docker Compose pour développement**
```yaml
version: '3.8'
services:
  api:
    build: ./backend
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=development
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}

  msp-admin:
    build: ./msp-admin-frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:3002

  client-portal:
    build: ./client-portal-frontend
    ports:
      - "3001:3001"
    environment:
      - VITE_API_URL=http://localhost:3002
```

---

## 🛠️ Développement

### **Setup du projet**
```bash
# Cloner le repository
git clone <repository-url>
cd orchestrate-msp-platform-hub

# Setup API Backend
cd backend
npm install
cp env.example .env
# Configurer les variables Supabase dans .env

# Setup MSP Admin Frontend
cd ../msp-admin-frontend
npm install

# Setup Client Portal Frontend
cd ../client-portal-frontend
npm install
```

### **Démarrage développement**
```bash
# Démarrer tous les services
./scripts/dev-tools.sh start

# Ou individuellement
cd backend && npm run dev              # Port 3002
cd msp-admin-frontend && npm run dev  # Port 3000
cd client-portal-frontend && npm run dev # Port 3001
```

### **Tests**
```bash
# Tests API Backend
cd backend && npm test

# Tests MSP Admin
cd msp-admin-frontend && npm test

# Tests Client Portal
cd client-portal-frontend && npm test

# Tests end-to-end
npm run test:e2e
```

### **Workflow Git**
```bash
# Branches principales
main                    # Production
develop                 # Développement
feature/xxx             # Nouvelles fonctionnalités
hotfix/xxx             # Corrections urgentes

# Workflow
git checkout develop
git checkout -b feature/user-management
# ... développement ...
git push origin feature/user-management
# ... pull request vers develop ...
```

---

## 🔧 Maintenance

### **Monitoring**
```bash
# Health checks
curl http://localhost:3002/health
curl http://localhost:3000/
curl http://localhost:3001/

# Logs API
docker logs msp-api

# Métriques
curl http://localhost:3002/api/metrics
```

### **Sauvegarde**
```bash
# Sauvegarde base de données Supabase
# Via interface Supabase ou pg_dump

# Sauvegarde fichiers statiques
rsync -avz admin@192.168.1.100:/var/www/msp-admin/ backup/msp-admin/
rsync -avz admin@192.168.1.101:/var/www/client-portal/ backup/client-portal/
```

### **Mise à jour**
```bash
# Mise à jour dépendances
cd backend && npm update
cd msp-admin-frontend && npm update
cd client-portal-frontend && npm update

# Migration base de données
cd supabase && supabase migration new update_xxx
```

### **Troubleshooting**

#### **Problèmes courants**
```bash
# API ne démarre pas
- Vérifier les variables d'environnement Supabase
- Vérifier les ports disponibles
- Consulter les logs : docker logs msp-api

# Erreurs CORS
- Vérifier ALLOWED_ORIGINS dans .env
- Vérifier la configuration nginx

# Problèmes d'authentification
- Vérifier les clés Supabase
- Vérifier la validité des tokens JWT
- Consulter les logs d'authentification
```

---

## 📚 API Référence

### **Authentification**
Toutes les requêtes API (sauf `/health` et `/api`) nécessitent un token Bearer :
```
Authorization: Bearer <jwt_token>
```

### **Réponses standard**
```json
// Succès
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}

// Erreur
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE"
}
```

### **Codes d'erreur**
- `AUTH_REQUIRED` : Authentification requise
- `ACCESS_DENIED` : Accès non autorisé
- `VALIDATION_ERROR` : Données invalides
- `NOT_FOUND` : Ressource non trouvée
- `INTERNAL_ERROR` : Erreur serveur

### **Endpoints détaillés**

#### **POST /api/users** (Création utilisateur)
```json
// Request
{
  "email": "user@client.com",
  "first_name": "John",
  "last_name": "Doe",
  "organization_id": "uuid",
  "team_id": "uuid",
  "phone": "+33123456789",
  "role": "user",
  "department": "IT",
  "position": "Developer"
}

// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@client.com",
    "first_name": "John",
    "last_name": "Doe",
    "organization": {
      "id": "uuid",
      "name": "Client Organization"
    },
    "team": {
      "id": "uuid",
      "name": "Development Team"
    },
    "created_at": "2024-01-15T10:30:00Z"
  },
  "message": "Utilisateur créé avec succès"
}
```

### **Rate Limiting**
- **15 minutes** : 100 requêtes par IP
- **Headers** : `X-RateLimit-Limit`, `X-RateLimit-Remaining`

---

## 🎯 Conclusion

Le **MSP Platform Hub** offre une architecture robuste et évolutive pour la gestion multi-tenant avec :

✅ **Séparation complète** des cycles de développement
✅ **Déploiement sur serveurs distincts**
✅ **API backend centralisée et sécurisée**
✅ **Gestion stricte** de l'association organisation/équipe
✅ **Interface MSP** pour l'administration globale
✅ **Portails client** personnalisés et isolés
✅ **Sécurité renforcée** avec RLS et JWT
✅ **Architecture scalable** pour la croissance

Cette documentation servira de référence pour le développement, le déploiement et la maintenance de la plateforme. 🚀
