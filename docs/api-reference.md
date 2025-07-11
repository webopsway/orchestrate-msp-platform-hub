# API Reference

## 🚀 Vue d'ensemble

La plateforme MSP utilise Supabase comme backend, fournissant une API REST automatique basée sur le schéma PostgreSQL, plus des Edge Functions personnalisées pour la logique métier complexe.

## 🔧 Configuration API

### Client Supabase
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabase = createClient<Database>(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true
    }
  }
);
```

### Headers requis
```typescript
// Authentication automatique via Supabase
// Row Level Security appliquée automatiquement
```

## 📊 Tables principales

### Organizations

#### GET Organizations
```typescript
const { data, error } = await supabase
  .from('organizations')
  .select('*')
  .order('created_at', { ascending: false });
```

#### CREATE Organization
```typescript
const { data, error } = await supabase
  .from('organizations')
  .insert({
    name: 'Nouvelle Organisation',
    type: 'client',
    is_msp: false,
    metadata: {}
  })
  .select()
  .single();
```

#### UPDATE Organization
```typescript
const { data, error } = await supabase
  .from('organizations')
  .update({
    name: 'Nom Modifié',
    metadata: { industry: 'tech' }
  })
  .eq('id', organizationId)
  .select()
  .single();
```

#### DELETE Organization
```typescript
const { error } = await supabase
  .from('organizations')
  .delete()
  .eq('id', organizationId);
```

### Teams

#### GET Teams pour une organisation
```typescript
const { data, error } = await supabase
  .from('teams')
  .select('*')
  .eq('organization_id', organizationId)
  .order('name');
```

#### CREATE Team
```typescript
const { data, error } = await supabase
  .from('teams')
  .insert({
    name: 'Nouvelle Équipe',
    description: 'Description de l\'équipe',
    organization_id: organizationId
  })
  .select()
  .single();
```

### Profiles (Utilisateurs)

#### GET Profile utilisateur courant
```typescript
const { data: { user } } = await supabase.auth.getUser();
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();
```

#### UPDATE Profile
```typescript
const { data, error } = await supabase
  .from('profiles')
  .update({
    first_name: 'Prénom',
    last_name: 'Nom',
    metadata: { timezone: 'Europe/Paris' }
  })
  .eq('id', userId)
  .select()
  .single();
```

### ITSM Incidents

#### GET Incidents pour une équipe
```typescript
const { data, error } = await supabase
  .from('itsm_incidents')
  .select(`
    *,
    created_by:profiles!itsm_incidents_created_by_fkey(first_name, last_name),
    assigned_to:profiles!itsm_incidents_assigned_to_fkey(first_name, last_name)
  `)
  .eq('team_id', teamId)
  .order('created_at', { ascending: false });
```

#### CREATE Incident
```typescript
const { data, error } = await supabase
  .from('itsm_incidents')
  .insert({
    title: 'Nouveau Incident',
    description: 'Description du problème',
    priority: 'high',
    status: 'open',
    team_id: teamId,
    created_by: userId
  })
  .select()
  .single();
```

#### UPDATE Incident Status
```typescript
const { data, error } = await supabase
  .from('itsm_incidents')
  .update({
    status: 'resolved',
    resolved_at: new Date().toISOString()
  })
  .eq('id', incidentId)
  .select()
  .single();
```

### Cloud Assets

#### GET Assets cloud pour une équipe
```typescript
const { data, error } = await supabase
  .from('cloud_asset')
  .select(`
    *,
    cloud_providers(name, display_name)
  `)
  .eq('team_id', teamId)
  .order('discovered_at', { ascending: false });
```

#### GET Providers cloud actifs
```typescript
const { data, error } = await supabase
  .from('cloud_providers')
  .select('*')
  .eq('is_active', true)
  .order('display_name');
```

### Notifications

#### GET Transports de notification
```typescript
const { data, error } = await supabase
  .from('notification_transports')
  .select('*')
  .eq('team_id', teamId)
  .eq('is_active', true);
```

#### CREATE Transport de notification
```typescript
const { data, error } = await supabase
  .from('notification_transports')
  .insert({
    channel: 'email',
    scope: 'incidents',
    config: {
      smtp_server: 'smtp.example.com',
      port: 587,
      username: 'user@example.com'
    },
    team_id: teamId,
    configured_by: userId
  })
  .select()
  .single();
```

## ⚡ Edge Functions

### init-user-session

Initialise le contexte de session utilisateur avec les variables PostgreSQL.

#### Endpoint
```
POST /functions/v1/init-user-session
```

#### Request Body
```typescript
{
  organization_id?: string;
  team_id?: string;
}
```

#### Response
```typescript
{
  success: boolean;
  session_context: {
    current_organization_id: string;
    current_team_id: string;
    is_msp: boolean;
  };
  postgresql_session?: {
    current_team: string;
    is_msp: string;
  };
}
```

#### Exemple d'utilisation
```typescript
const { data, error } = await supabase.functions.invoke('init-user-session', {
  body: {
    organization_id: 'org-uuid',
    team_id: 'team-uuid'
  }
});
```

### cloud-orchestration

Déclenche des tâches d'orchestration cloud (inventaire, sauvegardes).

#### Endpoint
```
POST /functions/v1/cloud-orchestration
```

#### Request Body
```typescript
{
  task_type: 'inventory' | 'backup';
  team_id: string;
  provider_id: string;
  config?: Record<string, any>;
}
```

#### Response
```typescript
{
  success: boolean;
  execution_id: string;
  message: string;
}
```

### notification-dispatcher

Envoie des notifications via différents canaux.

#### Endpoint
```
POST /functions/v1/notification-dispatcher
```

#### Request Body
```typescript
{
  transport_id: string;
  event_type: string;
  payload: Record<string, any>;
  team_id: string;
}
```

## 🔧 Fonctions PostgreSQL

### trigger_team_inventory

Déclenche un inventaire cloud pour une équipe et un provider.

```sql
SELECT trigger_team_inventory('team-uuid', 'provider-uuid');
```

### trigger_team_backup

Déclenche une sauvegarde cloud pour une équipe et un provider.

```sql
SELECT trigger_team_backup('team-uuid', 'provider-uuid');
```

### get_current_user_session

Récupère le contexte de session de l'utilisateur courant.

```sql
SELECT * FROM get_current_user_session();
```

### is_msp_admin

Vérifie si l'utilisateur courant est un admin MSP.

```sql
SELECT is_msp_admin();
```

## 🔄 Temps réel (Realtime)

### Configuration des channels

#### Écouter les changements sur une table
```typescript
const channel = supabase
  .channel('table_changes')
  .on(
    'postgres_changes',
    {
      event: '*', // 'INSERT' | 'UPDATE' | 'DELETE' | '*'
      schema: 'public',
      table: 'itsm_incidents'
    },
    (payload) => {
      console.log('Change received:', payload);
      // Actualiser les données locales
    }
  )
  .subscribe();

// Nettoyer l'abonnement
return () => supabase.removeChannel(channel);
```

#### Présence utilisateur
```typescript
const roomChannel = supabase.channel('room_01');

// Suivre la présence
roomChannel
  .on('presence', { event: 'sync' }, () => {
    const newState = roomChannel.presenceState();
    console.log('Sync', newState);
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('Join', key, newPresences);
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('Leave', key, leftPresences);
  })
  .subscribe();

// Envoyer son statut
const userStatus = {
  user: 'user-1',
  online_at: new Date().toISOString()
};

roomChannel.track(userStatus);
```

## 🔐 Authentification

### Login
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

### Signup
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    emailRedirectTo: `${window.location.origin}/`,
    data: {
      first_name: 'Prénom',
      last_name: 'Nom'
    }
  }
});
```

### Logout
```typescript
const { error } = await supabase.auth.signOut({ scope: 'global' });
```

### Écouter les changements d'auth
```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session.user);
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  }
});
```

## 📊 Filtering & Pagination

### Filtres avancés
```typescript
const { data, error } = await supabase
  .from('itsm_incidents')
  .select('*')
  .eq('team_id', teamId)
  .in('status', ['open', 'in_progress'])
  .gte('created_at', '2024-01-01')
  .order('priority', { ascending: false })
  .order('created_at', { ascending: false })
  .range(0, 19); // Pagination (20 éléments)
```

### Recherche textuelle
```typescript
const { data, error } = await supabase
  .from('itsm_incidents')
  .select('*')
  .textSearch('title', searchTerm)
  .eq('team_id', teamId);
```

### Agrégations
```typescript
const { data, error } = await supabase
  .from('itsm_incidents')
  .select('status, count(*)')
  .eq('team_id', teamId)
  .group('status');
```

## ❌ Gestion d'erreurs

### Types d'erreurs Supabase
```typescript
if (error) {
  switch (error.code) {
    case 'PGRST116': // No rows found
      console.log('Aucun résultat trouvé');
      break;
    case '23505': // Unique violation
      console.log('Violation de contrainte unique');
      break;
    case 'row_level_security_violation':
      console.log('Accès non autorisé');
      break;
    default:
      console.error('Erreur:', error.message);
  }
}
```

### Error handling pattern
```typescript
export const handleSupabaseError = (error: any): string => {
  if (!error) return '';
  
  const errorMap: Record<string, string> = {
    'PGRST116': 'Aucun résultat trouvé',
    '23505': 'Cette valeur existe déjà',
    '23503': 'Référence invalide',
    'row_level_security_violation': 'Accès non autorisé'
  };
  
  return errorMap[error.code] || error.message || 'Erreur inconnue';
};
```

## 🔍 Exemples d'intégration

### Hook personnalisé avec API
```typescript
export const useIncidents = (teamId: string) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('itsm_incidents')
        .select('*, profiles!created_by(first_name, last_name)')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (error) {
      console.error('Fetch incidents error:', error);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    if (teamId) {
      fetchIncidents();
    }
  }, [teamId, fetchIncidents]);

  return { incidents, loading, fetchIncidents };
};
```

Cette documentation API couvre les principales opérations disponibles dans la plateforme MSP.