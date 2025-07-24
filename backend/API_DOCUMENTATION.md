# 📚 Documentation API MSP Platform

La plateforme MSP dispose d'une **documentation OpenAPI 3.0 complète** avec interface interactive Swagger UI.

## 🚀 Accès à la Documentation

### Interface Interactive Swagger UI
- **URL**: [http://localhost:3002/api-docs](http://localhost:3002/api-docs)
- **Description**: Interface web interactive pour explorer et tester l'API
- **Fonctionnalités**:
  - Explorer tous les endpoints disponibles
  - Tester les requêtes directement depuis l'interface
  - Voir les schémas de données détaillés
  - Authentification intégrée

### Spécification OpenAPI
- **JSON**: [http://localhost:3002/api-docs.json](http://localhost:3002/api-docs.json)
- **YAML**: [http://localhost:3002/openapi.yaml](http://localhost:3002/openapi.yaml)
- **Raccourci**: [http://localhost:3002/docs](http://localhost:3002/docs) → redirige vers Swagger UI

## 🔐 Authentification pour les Tests

### Mode Développement
Pour tester l'API en développement, utilisez le **token de développement** :
```
Token: dev
```

### Comment s'authentifier dans Swagger UI
1. Cliquez sur le bouton **"Authorize"** (🔒) en haut à droite
2. Entrez `dev` dans le champ "Value"
3. Cliquez sur "Authorize"
4. Vous pouvez maintenant tester tous les endpoints protégés

### Authentification en Production
En production, utilisez un vrai token JWT obtenu via `POST /api/auth/login`.

## 📋 Endpoints Disponibles

### 🏥 Health & Documentation
- `GET /health` - Vérification de santé (publique)
- `GET /api` - Liste des endpoints (publique)
- `GET /api-docs` - Interface Swagger UI (publique)

### 🔐 Authentification
- `POST /api/auth/login` - Connexion utilisateur
- `POST /api/auth/logout` - Déconnexion utilisateur
- `GET /api/auth/me` - Profil utilisateur actuel

### 👥 Gestion des Utilisateurs
- `GET /api/users` - Liste des utilisateurs
- `POST /api/users` - Créer un utilisateur (MSP Admin)
- `GET /api/users/{id}` - Détails d'un utilisateur
- `PUT /api/users/{id}` - Mettre à jour un utilisateur
- `DELETE /api/users/{id}` - Supprimer un utilisateur (MSP Admin)

### 🏢 Gestion des Organisations
- `GET /api/organizations` - Liste des organisations
- `POST /api/organizations` - Créer une organisation (MSP Admin)
- `GET /api/organizations/{id}` - Détails d'une organisation
- `PUT /api/organizations/{id}` - Mettre à jour une organisation
- `DELETE /api/organizations/{id}` - Supprimer une organisation

### 👨‍👩‍👧‍👦 Gestion des Équipes
- `GET /api/teams` - Liste des équipes
- `POST /api/teams` - Créer une équipe
- `GET /api/teams/{id}` - Détails d'une équipe
- `PUT /api/teams/{id}` - Mettre à jour une équipe
- `DELETE /api/teams/{id}` - Supprimer une équipe

## 🎯 Exemples d'Utilisation

### 1. Tester la Santé de l'API
```bash
curl http://localhost:3002/health
```

### 2. Récupérer la Liste des Utilisateurs
```bash
curl -H "Authorization: Bearer dev" http://localhost:3002/api/users
```

### 3. Créer un Nouvel Utilisateur (MSP Admin)
```bash
curl -X POST http://localhost:3002/api/users \
  -H "Authorization: Bearer dev" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nouvel.utilisateur@exemple.com",
    "first_name": "Nouvel",
    "last_name": "Utilisateur",
    "organization_id": "test-org-1",
    "team_id": "test-team-1",
    "role": "Développeur",
    "department": "IT"
  }'
```

### 4. Mettre à Jour un Utilisateur
```bash
curl -X PUT http://localhost:3002/api/users/test-user-1 \
  -H "Authorization: Bearer dev" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Prénom Modifié",
    "department": "DevOps"
  }'
```

## 🔒 Permissions et Sécurité

### Rôles Utilisateur

#### MSP Admin (`is_msp_admin: true`)
- ✅ Accès complet à tous les endpoints
- ✅ Peut voir tous les utilisateurs de toutes les organisations
- ✅ Peut créer/modifier/supprimer des utilisateurs
- ✅ Peut gérer les organisations et équipes

#### Utilisateur Normal (`is_msp_admin: false`)
- ✅ Peut voir son propre profil
- ✅ Peut voir les membres de son équipe
- ✅ Peut modifier son propre profil (avec restrictions)
- ❌ Ne peut pas créer/supprimer d'autres utilisateurs
- ❌ Ne peut pas modifier les champs administratifs

### Champs Protégés
Ces champs ne peuvent être modifiés que par les MSP Admins :
- `is_msp_admin`
- `default_organization_id`
- `default_team_id`

## 📊 Réponses Standardisées

Toutes les réponses de l'API suivent ce format standard :

### Succès
```json
{
  "success": true,
  "data": { ... },        // Données de réponse
  "count": 10             // Nombre d'éléments (pour les listes)
}
```

### Erreur
```json
{
  "success": false,
  "error": "Message d'erreur descriptif",
  "code": "ERROR_CODE"    // Code pour identification programmatique
}
```

### Codes d'Erreur Courants
- `NO_TOKEN` - Token d'authentification manquant
- `INVALID_TOKEN` - Token invalide ou expiré
- `ACCESS_DENIED` - Permissions insuffisantes
- `VALIDATION_ERROR` - Données invalides
- `RATE_LIMIT_EXCEEDED` - Trop de requêtes
- `CORS_ERROR` - Origine non autorisée

## ⚡ Rate Limiting

L'API applique une limitation de débit :
- **Limite**: 100 requêtes par IP
- **Fenêtre**: 15 minutes
- **Scope**: Tous les endpoints `/api/*`

Les headers de rate limiting sont inclus dans chaque réponse :
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## 🌐 CORS

L'API accepte les requêtes depuis :
- `http://localhost:3000` (MSP Admin Frontend)
- `http://localhost:3001` (Client Portal Frontend)
- `https://admin.msp.com` (Production MSP Admin)
- `https://*.msp.com` (Production Client Portals)

## 🛠️ Intégration avec les Frontends

### MSP Admin Frontend (Port 3000)
- Interface complète avec tous les privilèges
- Utilise tous les endpoints disponibles
- Gestion complète des utilisateurs, organisations, équipes

### Client Portal Frontend (Port 3001)
- Interface limitée par tenant
- Filtrage automatique par organisation/équipe
- Données restreintes aux permissions utilisateur

## 🔄 Headers Spéciaux

L'API ajoute automatiquement ces headers à toutes les réponses :
```
X-API-Docs: /api-docs
X-OpenAPI-Spec: /api-docs.json
X-API-Version: 1.0.0
```

## 📈 Monitoring et Logs

### Health Check
Le endpoint `/health` retourne des informations utiles pour le monitoring :
```json
{
  "success": true,
  "message": "API MSP Platform is running",
  "timestamp": "2025-01-24T01:15:30.000Z",
  "version": "1.0.0",
  "environment": "development"
}
```

### Logs
L'API utilise Morgan pour les logs HTTP et inclut des logs détaillés pour le debugging.

---

## 🎉 Conclusion

Cette documentation OpenAPI fournit une interface complète et interactive pour explorer et intégrer l'API MSP Platform.

**Commencez par**: [http://localhost:3002/api-docs](http://localhost:3002/api-docs)

Pour toute question ou assistance, consultez la documentation technique ou contactez l'équipe de développement.
