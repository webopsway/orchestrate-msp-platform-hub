# Documentation des Permissions - Système MSP

## Vue d'ensemble

Ce document décrit le système de permissions du platform MSP, organisé autour de rôles flexibles et de permissions granulaires.

## Architecture des Rôles et Permissions

### Tables Principales

- **`roles`** : Définit les rôles disponibles
- **`permissions`** : Définit les permissions granulaires
- **`role_permissions`** : Association entre rôles et permissions
- **`user_roles`** : Attribution des rôles aux utilisateurs avec contexte

### Isolation par Contexte

Chaque assignation de rôle peut être limitée à :
- **Organisation** : Limite les permissions à une organisation spécifique
- **Équipe** : Limite les permissions à une équipe spécifique
- **Global** : Permissions sans limitation de contexte

## Rôles Standards

### 1. **Membre** (`member`)
**Utilisateur standard avec accès en lecture**

**Permissions :**
- `users.view` : Voir les utilisateurs
- `teams.view` : Voir les équipes
- `incidents.view` : Voir les incidents
- `incidents.create` : Signaler des incidents
- `infrastructure.view` : Voir l'infrastructure
- `monitoring.view` : Voir la supervision

### 2. **Visualiseur** (`viewer`)
**Accès en lecture seule étendu**

**Permissions :**
- Toutes les permissions `*.view`
- `users.view`
- `organizations.view`
- `teams.view`
- `incidents.view`
- `infrastructure.view`
- `monitoring.view`
- `settings.view`

### 3. **Éditeur** (`editor`)
**Accès en lecture et écriture sur les ressources métier**

**Permissions :**
- Toutes les permissions de **Visualiseur**
- `incidents.create`, `incidents.update`
- `infrastructure.create`, `infrastructure.update`
- `teams.create`, `teams.update`
- `monitoring.create`, `monitoring.update`

**Exclusions :** Pas de gestion des utilisateurs, organisations ou paramètres système

### 4. **Manager** (`manager`)
**Gestionnaire avec droits de modification étendus**

**Permissions :**
- Toutes les permissions de **Éditeur**
- `users.view`, `users.update`
- `organizations.view`, `organizations.update`
- `teams.delete`
- `incidents.delete`
- `infrastructure.delete`

**Exclusions :** Pas de création/suppression d'utilisateurs, pas d'accès aux paramètres système

### 5. **Administrateur** (`admin`)
**Administrateur avec droits étendus**

**Permissions :**
- Toutes les permissions de **Manager**
- `users.create`, `users.delete`
- `organizations.create`, `organizations.delete`
- `settings.view`

**Exclusions :** Pas de modification des paramètres système (réservé MSP)

### 6. **MSP Admin** (`msp`)
**Administrateur MSP avec accès complet**

**Permissions :**
- **TOUTES** les permissions du système
- `settings.update` : Modification des paramètres système
- Accès global sans limitation de contexte

## Ressources et Actions

### Actions Standards
- **`view`** : Consultation/lecture
- **`create`** : Création
- **`update`** : Modification
- **`delete`** : Suppression

### Ressources Métier

#### **Users** (Utilisateurs)
- `users.view` : Consulter la liste des utilisateurs
- `users.create` : Ajouter de nouveaux utilisateurs
- `users.update` : Modifier les informations utilisateur
- `users.delete` : Supprimer des comptes utilisateur

#### **Organizations** (Organisations)
- `organizations.view` : Consulter les organisations
- `organizations.create` : Ajouter de nouvelles organisations
- `organizations.update` : Modifier les organisations
- `organizations.delete` : Supprimer des organisations

#### **Teams** (Équipes)
- `teams.view` : Consulter les équipes
- `teams.create` : Ajouter de nouvelles équipes
- `teams.update` : Modifier les équipes
- `teams.delete` : Supprimer des équipes

#### **ITSM** (Gestion des Incidents)
- `incidents.view` : Consulter les incidents
- `incidents.create` : Signaler de nouveaux incidents
- `incidents.update` : Mettre à jour les incidents
- `incidents.delete` : Supprimer des incidents

#### **Infrastructure**
- `infrastructure.view` : Consulter l'inventaire infrastructure
- `infrastructure.create` : Ajouter des ressources infrastructure
- `infrastructure.update` : Modifier les ressources
- `infrastructure.delete` : Supprimer des ressources

#### **Monitoring** (Supervision)
- `monitoring.view` : Consulter les données de supervision
- `monitoring.create` : Configurer des alertes
- `monitoring.update` : Modifier la configuration

#### **Settings** (Paramètres Système)
- `settings.view` : Consulter les paramètres
- `settings.update` : Modifier la configuration système

## Hiérarchie des Permissions

```
MSP Admin (accès complet)
    ↓
Admin (tout sauf settings.update)
    ↓
Manager (pas de user CRUD, pas de settings)
    ↓
Editor (ressources métier seulement)
    ↓
Viewer (lecture seule)
    ↓
Member (lecture limitée + création incidents)
```

## Contextes d'Application

### Global
- Rôle applicable sur toute la plateforme
- Utilisé pour les administrateurs MSP
- Pas de limitation par organisation/équipe

### Organisation
- Rôle limité à une organisation spécifique
- L'utilisateur ne voit que les données de cette organisation
- Utilisé pour les administrateurs d'organisation

### Équipe
- Rôle limité à une équipe spécifique
- L'utilisateur ne voit que les données de cette équipe
- Utilisé pour les managers d'équipe

## Sécurité et RLS (Row Level Security)

### Politiques d'Accès

1. **Utilisateurs MSP** : Accès complet via `is_msp_admin = true`
2. **Administrateurs d'Organisation** : Accès via `organization_memberships` avec rôle `admin`/`manager`
3. **Managers d'Équipe** : Accès via `team_memberships` avec rôle `admin`/`owner`
4. **Utilisateurs Standard** : Accès à leurs propres données uniquement

### Variables de Session PostgreSQL

Le système utilise les variables de session PostgreSQL pour l'isolation des données :
- `app.current_team` : UUID de l'équipe active
- `app.is_msp` : Statut administrateur MSP

## API de Gestion des Rôles

### Edge Function : `manage-roles`

#### Endpoints

**GET** `/functions/v1/manage-roles`
- `?action=roles` : Liste des rôles
- `?action=permissions` : Liste des permissions
- `?action=user-roles` : Rôles assignés aux utilisateurs
- `?action=role-permissions` : Mapping rôles → permissions

**POST** `/functions/v1/manage-roles`
```json
{
  "action": "assign-role",
  "targetUserId": "uuid",
  "roleId": "uuid", 
  "teamId": "uuid", // optionnel
  "organizationId": "uuid", // optionnel
  "expiresAt": "2024-12-31T23:59:59Z" // optionnel
}
```

**DELETE** `/functions/v1/manage-roles`
```json
{
  "userRoleId": "uuid"
}
```

## Exemples d'Utilisation

### Assignation d'un Rôle Manager à une Organisation
```javascript
await supabase.functions.invoke('manage-roles', {
  body: {
    action: 'assign-role',
    targetUserId: 'user-uuid',
    roleId: 'manager-role-uuid',
    organizationId: 'org-uuid'
  }
});
```

### Assignation d'un Rôle Éditeur à une Équipe
```javascript
await supabase.functions.invoke('manage-roles', {
  body: {
    action: 'assign-role',
    targetUserId: 'user-uuid',
    roleId: 'editor-role-uuid',
    teamId: 'team-uuid'
  }
});
```

### Assignation d'un Rôle MSP Global
```javascript
await supabase.functions.invoke('manage-roles', {
  body: {
    action: 'assign-role',
    targetUserId: 'user-uuid',
    roleId: 'msp-role-uuid'
    // Pas de teamId/organizationId = contexte global
  }
});
```

## Interface d'Administration

L'interface d'administration (`RoleAdmin`) permet :
- **Visualisation** des rôles assignés
- **Assignation** de nouveaux rôles avec contexte
- **Révocation** de rôles existants
- **Consultation** des permissions par rôle
- **Audit** des assignations avec dates et contexte

### Accès
- Réservé aux utilisateurs avec `is_msp_admin = true`
- Accessible via la page d'accueil pour les administrateurs MSP

## Bonnes Pratiques

### Assignation de Rôles
1. **Principe du moindre privilège** : Assignez le rôle minimal nécessaire
2. **Contexte approprié** : Utilisez les limitations par organisation/équipe
3. **Expiration** : Définissez des dates d'expiration pour les accès temporaires
4. **Audit** : Documentez les raisons d'assignation dans les métadonnées

### Gestion des Permissions
1. **Granularité** : Préférez les permissions spécifiques aux permissions globales
2. **Cohérence** : Maintenez la cohérence dans le nommage des permissions
3. **Documentation** : Documentez chaque nouvelle permission
4. **Tests** : Vérifiez l'impact de chaque modification de permission

### Sécurité
1. **Validation** : Vérifiez les permissions côté serveur (RLS + Edge Functions)
2. **Logs** : Enregistrez toutes les actions sensibles
3. **Revue régulière** : Auditez périodiquement les assignations de rôles
4. **Séparation des responsabilités** : Séparez les rôles d'administration

---

**Version** : 1.0  
**Dernière mise à jour** : {{DATE}}  
**Contact** : Équipe Architecture MSP