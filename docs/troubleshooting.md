# Guide de dépannage

## 🚨 Problèmes courants et solutions

### 🔐 Problèmes d'authentification

#### L'utilisateur ne peut pas se connecter
```
Erreur: "Invalid login credentials"
```

**Diagnostic:**
1. Vérifier que l'email existe dans la base
2. Vérifier le mot de passe
3. Vérifier la configuration Supabase Auth

**Solutions:**
```sql
-- Vérifier l'utilisateur dans auth.users
SELECT id, email, confirmed_at, last_sign_in_at 
FROM auth.users 
WHERE email = 'user@example.com';

-- Vérifier le profil associé
SELECT * FROM public.profiles 
WHERE id = 'user-uuid';
```

```typescript
// Réinitialiser le mot de passe
const { error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com',
  { redirectTo: `${window.location.origin}/reset-password` }
);
```

#### Session expirée ou invalide
```
Erreur: "JWT expired" ou "Invalid JWT"
```

**Solutions:**
```typescript
// Nettoyer l'état d'authentification
const cleanupAuthState = () => {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Forcer une reconnexion
  window.location.href = '/auth';
};

// Refresh manuel du token
const { data, error } = await supabase.auth.refreshSession();
```

#### Boucle de redirection infinie
**Diagnostic:**
- Vérifier la configuration des URLs dans Supabase
- Vérifier les guards de route

**Solution:**
```typescript
// AuthContext.tsx - Éviter les boucles
const { data: { session }, error } = await supabase.auth.getSession();
if (error) {
  console.error('Session error:', error);
  // Ne pas rediriger automatiquement en cas d'erreur
  return;
}
```

### 📊 Problèmes de données

#### RLS (Row Level Security) bloque l'accès
```
Erreur: "new row violates row-level security policy"
```

**Diagnostic:**
```sql
-- Vérifier les politiques RLS actives
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'your_table';

-- Vérifier les variables de session
SELECT current_setting('app.current_team', true) as current_team,
       current_setting('app.is_msp', true) as is_msp;
```

**Solutions:**
```sql
-- Diagnostic des permissions utilisateur
SELECT * FROM diagnose_user_permissions();

-- Réinitialiser les variables de session
SELECT set_app_session_variables('team-uuid', true);

-- Vérifier l'accès équipe
SELECT user_has_team_access('team-uuid');
```

#### Données manquantes ou filtrées incorrectement
**Diagnostic:**
```typescript
// Vérifier le contexte de session
const { sessionContext } = useAuth();
console.log('Session context:', sessionContext);

// Tester les requêtes directement
const { data, error } = await supabase
  .from('your_table')
  .select('*')
  .eq('team_id', sessionContext?.current_team_id);

console.log('Query result:', { data, error });
```

### 🔧 Problèmes de session

#### Session non initialisée
```
Erreur: "Aucune équipe sélectionnée"
```

**Solutions:**
```typescript
// Forcer l'initialisation de session
const { sessionContext, initializeSession } = useAuth();

if (!sessionContext?.current_team_id) {
  await initializeSession();
}

// Vérifier le profil utilisateur
const { data: profile } = await supabase
  .from('profiles')
  .select('default_organization_id, default_team_id, is_msp_admin')
  .eq('id', user.id)
  .single();

if (profile?.default_team_id) {
  await initializeSession(profile.default_organization_id, profile.default_team_id);
}
```

#### Context de session perdu
**Diagnostic:**
```typescript
// Hook de debug pour surveiller les changements de session
useEffect(() => {
  console.log('Session context changed:', sessionContext);
  
  if (!sessionContext?.current_team_id) {
    console.warn('Lost team context, attempting recovery...');
    // Logique de récupération
  }
}, [sessionContext]);
```

### ☁️ Problèmes cloud et orchestration

#### Échec de l'inventaire cloud
```
Erreur: "No credentials configured for team"
```

**Diagnostic:**
```sql
-- Vérifier les credentials configurés
SELECT cc.id, cc.team_id, cp.name as provider_name, cc.created_at
FROM cloud_credentials cc
JOIN cloud_providers cp ON cp.id = cc.provider_id
WHERE cc.team_id = 'team-uuid';
```

**Solutions:**
```typescript
// Vérifier et reconfigurer les credentials
const { data: credentials } = await supabase
  .from('cloud_credentials')
  .select('*, cloud_providers(*)')
  .eq('team_id', teamId);

if (!credentials?.length) {
  // Rediriger vers la configuration des comptes cloud
  navigate('/cloud/accounts');
}
```

#### Edge Functions timeout
```
Erreur: "Function timed out"
```

**Solutions:**
```typescript
// Augmenter le timeout et utiliser des tâches en arrière-plan
const { data, error } = await supabase.functions.invoke('cloud-orchestration', {
  body: { task_type: 'inventory', team_id: teamId },
  options: { timeout: 60000 } // 60 secondes
});

// Utiliser des tâches asynchrones
const triggerBackgroundTask = async () => {
  const { data } = await supabase.rpc('trigger_team_inventory', {
    p_team_id: teamId,
    p_provider_id: providerId
  });
  
  // Surveiller le status via backup_executions
  const executionId = data;
  return executionId;
};
```

### 🎨 Problèmes d'interface

#### Composants ne se re-render pas
**Diagnostic:**
```typescript
// Vérifier les dépendances des hooks
useEffect(() => {
  console.log('Dependencies changed:', { sessionContext, teamId });
  fetchData();
}, [sessionContext, teamId]); // S'assurer que toutes les dépendances sont listées
```

**Solutions:**
```typescript
// Forcer le re-render avec un état local
const [refreshKey, setRefreshKey] = useState(0);

const forceRefresh = () => setRefreshKey(prev => prev + 1);

useEffect(() => {
  fetchData();
}, [refreshKey, sessionContext?.current_team_id]);
```

#### Hooks appelés de manière conditionnelle
```
Erreur: "Rendered more hooks than during the previous render"
```

**Solution:**
```typescript
// ❌ Incorrect
const MyComponent = ({ condition }) => {
  if (!condition) return null;
  
  const [data, setData] = useState([]); // Hook conditionnel !
  
  return <div>{data}</div>;
};

// ✅ Correct
const MyComponent = ({ condition }) => {
  const [data, setData] = useState([]);
  
  if (!condition) return null;
  
  return <div>{data}</div>;
};
```

### 🔔 Problèmes de notifications

#### Notifications non reçues
**Diagnostic:**
```sql
-- Vérifier les transports configurés
SELECT * FROM notification_transports 
WHERE team_id = 'team-uuid' AND is_active = true;

-- Vérifier les notifications en attente
SELECT * FROM notifications 
WHERE team_id = 'team-uuid' AND status = 'pending'
ORDER BY created_at DESC;
```

**Solutions:**
```typescript
// Tester l'envoi de notification manuellement
const { data, error } = await supabase.functions.invoke('notification-dispatcher', {
  body: {
    transport_id: 'transport-uuid',
    event_type: 'test',
    payload: { message: 'Test notification' },
    team_id: teamId
  }
});
```

### 📊 Problèmes de performance

#### Requêtes lentes
**Diagnostic:**
```sql
-- Analyser les requêtes lentes
EXPLAIN ANALYZE SELECT * FROM itsm_incidents 
WHERE team_id = 'team-uuid' 
ORDER BY created_at DESC;

-- Vérifier les index
SELECT indexname, indexdef FROM pg_indexes 
WHERE tablename = 'itsm_incidents';
```

**Solutions:**
```sql
-- Créer des index optimisés
CREATE INDEX CONCURRENTLY idx_itsm_incidents_team_created 
ON itsm_incidents(team_id, created_at DESC);

-- Pagination pour les grandes listes
SELECT * FROM itsm_incidents 
WHERE team_id = 'team-uuid' 
ORDER BY created_at DESC 
LIMIT 20 OFFSET 0;
```

#### Mémoire/Re-renders excessifs
**Solutions:**
```typescript
// Memoization des composants lourds
const ExpensiveComponent = React.memo(({ data }) => {
  return <ComplexVisualization data={data} />;
});

// Memoization des valeurs calculées
const sortedData = useMemo(() => {
  return data.sort((a, b) => b.created_at.localeCompare(a.created_at));
}, [data]);

// Callbacks memoizés
const handleItemClick = useCallback((id: string) => {
  onItemSelect(id);
}, [onItemSelect]);
```

## 🛠️ Outils de diagnostic

### 1. Console de debugging
```typescript
// utils/debug.ts
export const debugLog = (message: string, data?: any) => {
  if (import.meta.env.DEV) {
    console.log(`[DEBUG] ${message}`, data);
  }
};

// Utilisation
debugLog('Session context:', sessionContext);
debugLog('API response:', { data, error });
```

### 2. React DevTools
- Profiler pour identifier les re-renders
- Components tree pour l'état des composants
- Hooks inspection

### 3. Supabase Dashboard
- **Logs**: Vérifier les erreurs Edge Functions
- **Auth**: Surveiller les connexions
- **Database**: Performance des requêtes
- **API**: Utilisation et erreurs

### 4. Browser DevTools
```typescript
// Network tab pour les requêtes
// Console pour les erreurs JavaScript
// Application tab pour le localStorage/sessionStorage

// Vérifier l'état d'auth Supabase
console.log('Supabase session:', await supabase.auth.getSession());
console.log('User:', await supabase.auth.getUser());
```

## 📋 Checklist de dépannage

### Problèmes d'authentification
- [ ] Vérifier les URLs de redirection Supabase
- [ ] Confirmer la configuration email/password
- [ ] Nettoyer le localStorage
- [ ] Vérifier les politiques RLS
- [ ] Tester sur un navigateur privé

### Problèmes de données
- [ ] Vérifier le contexte de session
- [ ] Contrôler les politiques RLS
- [ ] Tester les requêtes directement
- [ ] Vérifier les permissions utilisateur
- [ ] Valider les variables de session PostgreSQL

### Problèmes de performance
- [ ] Identifier les re-renders excessifs
- [ ] Vérifier les index de base de données
- [ ] Optimiser les requêtes
- [ ] Implémenter la pagination
- [ ] Utiliser la memoization

### Problèmes de déploiement
- [ ] Vérifier les variables d'environnement
- [ ] Confirmer les migrations DB
- [ ] Tester les Edge Functions
- [ ] Valider la configuration CORS
- [ ] Vérifier les domaines autorisés

## 🆘 Escalade et support

### Informations à collecter
1. **Logs du navigateur** (Console, Network, Errors)
2. **Context utilisateur** (ID, rôle, équipe)
3. **Étapes pour reproduire** le problème
4. **Messages d'erreur** exacts
5. **Version de l'application**

### Contacts
- **Support technique**: [email-technique]
- **Urgences**: [email-urgence]
- **Documentation**: `/docs`
- **Issues GitHub**: [lien-repository]

Ce guide couvre les problèmes les plus fréquents rencontrés avec la plateforme MSP.