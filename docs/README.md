# Documentation - Plateforme MSP

## Vue d'ensemble

Cette application est une **plateforme MSP (Managed Service Provider)** complète développée avec React, TypeScript et Supabase. Elle permet aux MSP de gérer leurs clients, leurs équipes, leur infrastructure cloud et leurs opérations ITSM.

## 🚀 Fonctionnalités principales

### 1. **Gestion des organisations et équipes**
- Création et gestion d'organisations MSP, clients et ESN
- Gestion des équipes au sein des organisations
- Relations hiérarchiques MSP-Client-ESN

### 2. **Gestion des utilisateurs et permissions**
- Système RBAC (Role-Based Access Control) avancé
- Gestion des rôles et permissions granulaires
- Profils utilisateurs avec authentification Supabase

### 3. **ITSM (IT Service Management)**
- Gestion des incidents
- Gestion des demandes de changement
- Demandes de service
- Gestion de la sécurité et vulnérabilités

### 4. **Infrastructure Cloud**
- Inventaire des ressources cloud multi-fournisseurs
- Gestion des comptes cloud
- Orchestration et automatisation des patchs
- Surveillance des coûts

### 5. **Supervision et monitoring**
- Métriques de performance
- Système de notifications configurable
- Alertes temps réel

### 6. **Documentation et configuration**
- Documentation technique intégrée
- Paramètres globaux configurables
- Interface d'administration

## 🏗️ Architecture technique

### Stack technologique
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Routing**: React Router v6
- **State Management**: React Context + Custom hooks
- **Formulaires**: React Hook Form + Zod

### Structure du projet
```
src/
├── components/           # Composants réutilisables
│   ├── common/          # Composants métier (DataGrid, PageHeader, etc.)
│   ├── forms/           # Formulaires spécialisés
│   ├── layout/          # Composants de mise en page
│   ├── ui/              # Composants UI de base (shadcn)
│   ├── itsm/            # Composants ITSM
│   └── rbac/            # Composants RBAC
├── contexts/            # Contextes React (Auth, etc.)
├── hooks/               # Custom hooks
├── pages/               # Pages/Routes de l'application
├── services/            # Services métier (session, cloud, etc.)
├── integrations/        # Intégrations (Supabase)
└── types/               # Types TypeScript
```

## 📊 Modèle de données

### Entités principales

#### **Organizations**
- `id`, `name`, `type` (msp/client/esn)
- `is_msp`, `metadata`
- Relations hiérarchiques

#### **Teams**
- `id`, `name`, `organization_id`
- `description`, `metadata`

#### **Profiles** (Utilisateurs)
- `id`, `email`, `first_name`, `last_name`
- `is_msp_admin`, `default_organization_id`, `default_team_id`

#### **Roles & Permissions**
- Système RBAC complet
- `roles`, `permissions`, `role_permissions`, `user_roles`

#### **ITSM**
- `itsm_incidents`, `itsm_change_requests`, `itsm_service_requests`
- `itsm_comments`, `security_vulnerabilities`

#### **Cloud**
- `cloud_providers`, `cloud_credentials`, `cloud_asset`
- `backup_executions`, `backup_jobs`

## 🔧 Installation et configuration

### Prérequis
- Node.js 18+
- Compte Supabase
- Git

### Installation locale
```bash
# Cloner le repository
git clone <repository-url>
cd plateforme-msp

# Installer les dépendances
npm install

# Configuration Supabase
# Copier .env.example vers .env.local
# Configurer les variables Supabase

# Démarrer le serveur de développement
npm run dev
```

### Configuration Supabase
1. Créer un projet Supabase
2. Exécuter les migrations SQL (dans `/supabase/migrations/`)
3. Configurer l'authentification
4. Configurer les Edge Functions

## 👥 Gestion des utilisateurs

### Système de rôles
- **MSP Admin**: Accès complet à toute la plateforme
- **Manager**: Gestion de l'organisation/équipe
- **Technician**: Accès aux outils techniques
- **User**: Accès limité aux fonctionnalités de base

### Sessions et contextes
- Session utilisateur avec organisation et équipe courantes
- Changement de contexte dynamique
- Permissions basées sur le contexte

## 🔒 Sécurité

### Authentification
- Supabase Auth avec email/password
- Row Level Security (RLS) sur toutes les tables
- Tokens JWT sécurisés

### Permissions
- Système RBAC granulaire
- Validation côté client et serveur
- Isolation des données par équipe/organisation

## 🛠️ Services et hooks

### Services principaux
- **sessionService**: Gestion centralisée des sessions
- **cloudService**: Opérations cloud
- **Hooks métier**: useSession, useCloudOrchestration, etc.

### Architecture des hooks
- Hooks spécialisés par domaine métier
- Gestion d'état cohérente
- Intégration Supabase transparente

## 📱 Interface utilisateur

### Design System
- Système de tokens CSS cohérent
- Composants réutilisables (shadcn/ui)
- Dark/Light mode
- Responsive design

### Navigation
- Sidebar dynamique configurable
- Breadcrumbs automatiques
- Recherche intégrée

## 🚀 Déploiement

### Environnements
- **Développement**: localhost avec Supabase local
- **Staging**: Déploiement Supabase + Vercel/Netlify
- **Production**: Infrastructure sécurisée

### Edge Functions
- Fonctions serverless pour la logique métier
- Orchestration cloud
- Notifications
- Initialisation des sessions

## 📈 Monitoring et observabilité

### Métriques
- Performance application
- Utilisation ressources
- Erreurs et exceptions

### Notifications
- Système configurable multi-canal
- Alertes temps réel
- Escalade automatique

## 🔄 Intégrations

### Cloud Providers
- AWS, Azure, GCP
- Authentification API
- Inventaire automatisé
- Gestion des coûts

### Outils externes
- Systèmes de ticketing
- Outils de supervision
- APIs tierces

## 📚 Documentation technique

- [Architecture détaillée](./architecture.md)
- [Guide de développement](./development.md)
- [API Reference](./api-reference.md)
- [Guide de déploiement](./deployment.md)
- [Troubleshooting](./troubleshooting.md)

## 🤝 Contribution

### Standards de code
- TypeScript strict
- ESLint + Prettier
- Tests unitaires
- Documentation du code

### Workflow Git
- Feature branches
- Pull requests obligatoires
- Tests automatisés
- Review code

## 📞 Support

- **Documentation**: `/docs`
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Contact**: [email-support]

---

Cette documentation est maintenue à jour avec les évolutions de la plateforme.