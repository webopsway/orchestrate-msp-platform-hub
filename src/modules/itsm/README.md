# Module ITSM

Ce module gère les fonctionnalités ITSM (IT Service Management) de la plateforme MSP.

## Structure

```
src/modules/itsm/
├── index.ts              # Export principal du module
├── README.md             # Documentation
└── components/           # Composants spécifiques
    ├── IncidentForm.tsx
    ├── ChangeForm.tsx
    ├── IncidentStatusUpdate.tsx
    ├── ChangeStatusUpdate.tsx
    ├── IncidentAssignment.tsx
    ├── ChangeAssignment.tsx
    ├── IncidentDetailView.tsx
    ├── ChangeDetailView.tsx
    ├── IncidentDialogs.tsx
    └── ChangeDialogs.tsx
```

## Fonctionnalités

### Incidents
- Création, modification, suppression d'incidents
- Gestion des statuts (ouvert, en cours, résolu, fermé)
- Assignation d'utilisateurs
- Priorités (basse, moyenne, haute, critique)
- Vue détaillée avec historique

### Changements
- Création, modification, suppression de changements
- Gestion des statuts (brouillon, en attente, approuvé, rejeté, implémenté, échoué)
- Types de changement (urgence, standard, normal)
- Assignation d'utilisateurs
- Planification de dates
- Vue détaillée avec historique

## Utilisation

```typescript
import { 
  useIncidents, 
  useChanges,
  IncidentForm,
  ChangeForm,
  CreateIncidentDialog,
  CreateChangeDialog
} from "@/modules/itsm";

// Utilisation des hooks
const { incidents, createIncident, updateIncident, deleteIncident } = useIncidents();
const { changes, createChange, updateChange, deleteChange } = useChanges();

// Utilisation des composants
<CreateIncidentDialog 
  isOpen={isOpen} 
  onClose={onClose} 
  onSubmit={createIncident} 
/>
```

## Permissions

Le module respecte les permissions RLS (Row Level Security) de Supabase :
- Les utilisateurs voient uniquement les éléments de leur équipe/organisation
- Les admins MSP ont accès à toutes les données
- Les permissions sont vérifiées côté client et serveur

## Base de données

### Tables principales
- `itsm_incidents` : Incidents ITSM
- `itsm_change_requests` : Demandes de changement
- `itsm_service_requests` : Demandes de service (existant)

### Relations
- Liens avec `profiles` pour les utilisateurs
- Liens avec `teams` et `organizations` pour les permissions
- Historique des modifications via `updated_at`

## API

### Endpoints Supabase
- `GET /rest/v1/itsm_incidents` : Liste des incidents
- `POST /rest/v1/itsm_incidents` : Créer un incident
- `PUT /rest/v1/itsm_incidents` : Modifier un incident
- `DELETE /rest/v1/itsm_incidents` : Supprimer un incident

- `GET /rest/v1/itsm_change_requests` : Liste des changements
- `POST /rest/v1/itsm_change_requests` : Créer un changement
- `PUT /rest/v1/itsm_change_requests` : Modifier un changement
- `DELETE /rest/v1/itsm_change_requests` : Supprimer un changement

## État de développement

✅ **Terminé**
- Structure de base du module
- Types TypeScript
- Services de données
- Hooks React
- Composants UI
- Pages principales
- Gestion des permissions
- Validation des données

🔄 **En cours**
- Tests unitaires
- Tests d'intégration
- Documentation API
- Optimisations de performance

📋 **Prévu**
- Notifications en temps réel
- Workflows automatisés
- Rapports et analytics
- Intégration avec d'autres modules 