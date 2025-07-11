# Guide de développement

## 🚀 Mise en place de l'environnement

### Prérequis
- **Node.js** 18+ (recommandé : LTS)
- **npm** ou **yarn**
- **Git**
- **Compte Supabase**
- **IDE** recommandé : VSCode avec extensions TypeScript

### Installation
```bash
# Cloner le repository
git clone <repository-url>
cd plateforme-msp

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env.local

# Démarrer le serveur de développement
npm run dev
```

### Configuration des variables d'environnement
```env
# .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🛠️ Outils de développement

### Scripts disponibles
```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run preview      # Aperçu du build
npm run type-check   # Vérification TypeScript
npm run lint         # Linting ESLint
npm run format       # Formatage Prettier
```

### Extensions VSCode recommandées
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets
- Auto Rename Tag
- Bracket Pair Colorizer

## 📁 Organisation du code

### Structure des composants
```typescript
// Exemple de structure pour un composant
src/components/itsm/IncidentDetailView.tsx
├── Types/interfaces locales
├── Composant principal
├── Hooks/logique métier
├── Handlers d'événements
├── Rendu JSX
└── Export
```

### Conventions de nommage
- **Composants** : PascalCase (`UserProfile.tsx`)
- **Hooks** : camelCase avec préfixe `use` (`useSession.ts`)
- **Services** : camelCase avec suffixe `Service` (`sessionService.ts`)
- **Types** : PascalCase (`OrganizationFormData`)
- **Fichiers utilitaires** : camelCase (`formatUtils.ts`)

## 🏗️ Patterns de développement

### 1. Custom Hooks Pattern
```typescript
// hooks/useEntityCRUD.ts
export const useEntityCRUD = <T>(tableName: string) => {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    // Logique de récupération
  }, [tableName]);

  const createItem = useCallback(async (data: Partial<T>) => {
    // Logique de création
  }, [tableName]);

  return {
    items,
    loading,
    error,
    fetchItems,
    createItem,
    updateItem,
    deleteItem
  };
};
```

### 2. Service Pattern
```typescript
// services/entityService.ts
class EntityService {
  private static instance: EntityService;
  
  static getInstance(): EntityService {
    if (!EntityService.instance) {
      EntityService.instance = new EntityService();
    }
    return EntityService.instance;
  }

  async getEntities(): Promise<Entity[]> {
    const teamId = sessionService.getCurrentTeamId();
    if (!teamId) throw new Error('No team selected');

    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('team_id', teamId);

    if (error) throw error;
    return data || [];
  }
}

export const entityService = EntityService.getInstance();
```

### 3. Composants avec render props
```typescript
// components/common/DataLoader.tsx
interface DataLoaderProps<T> {
  loadData: () => Promise<T>;
  children: (data: T | null, loading: boolean, error: string | null) => React.ReactNode;
}

export function DataLoader<T>({ loadData, children }: DataLoaderProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [loadData]);

  return <>{children(data, loading, error)}</>;
}
```

## 🎨 Développement UI

### Design System
Utiliser les tokens CSS définis dans `index.css` :

```css
/* Couleurs sémantiques */
--primary: 220 90% 56%;
--secondary: 220 14% 96%;
--accent: 220 14% 96%;

/* Utilisation dans les composants */
.custom-button {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}
```

### Composants réutilisables
```typescript
// Créer des variantes pour les composants shadcn
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // Ajouter des variantes personnalisées
        msp: "bg-blue-600 text-white hover:bg-blue-700",
        client: "bg-green-600 text-white hover:bg-green-700"
      }
    }
  }
);
```

### Responsive Design
```typescript
// Utiliser les breakpoints Tailwind
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Contenu responsive */}
</div>

// Classes conditionnelles avec clsx
const cardClass = clsx(
  "rounded-lg border",
  {
    "bg-red-50 border-red-200": variant === "error",
    "bg-blue-50 border-blue-200": variant === "info"
  }
);
```

## 🔧 Intégration Supabase

### Configuration client
```typescript
// integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true
  }
});
```

### Utilisation des types générés
```typescript
// Utiliser les types générés automatiquement
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
```

### Hooks avec Supabase
```typescript
// Exemple : hook pour les organisations
export const useOrganizations = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const fetchOrganizations = useCallback(async () => {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setOrganizations(data || []);
  }, []);

  // Écouter les changements en temps réel
  useEffect(() => {
    const channel = supabase
      .channel('organizations_changes')
      .on('postgres_changes', 
         { event: '*', schema: 'public', table: 'organizations' },
         () => fetchOrganizations())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchOrganizations]);

  return { organizations, fetchOrganizations };
};
```

## 🧪 Tests

### Tests unitaires avec Vitest
```typescript
// __tests__/components/UserProfile.test.tsx
import { render, screen } from '@testing-library/react';
import { UserProfile } from '@/components/profile/UserProfile';

describe('UserProfile', () => {
  it('renders user information correctly', () => {
    const mockUser = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com'
    };

    render(<UserProfile user={mockUser} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
```

### Tests d'intégration
```typescript
// __tests__/hooks/useSession.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useSession } from '@/hooks/useSession';

describe('useSession', () => {
  it('initializes session correctly', async () => {
    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.sessionContext).toBeDefined();
    });
  });
});
```

## 🐛 Debugging

### Debug des hooks
```typescript
// Utiliser les DevTools React
useEffect(() => {
  console.log('Session context changed:', sessionContext);
}, [sessionContext]);

// Debugger conditionnel
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', { user, session, loading });
}
```

### Debug Supabase
```typescript
// Activer les logs Supabase
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId);

console.log('Supabase query:', { data, error });
```

## 📊 Performance

### Optimisations React
```typescript
// Memoization des composants
const ExpensiveComponent = React.memo(({ data }) => {
  return <ComplexVisualization data={data} />;
});

// Memoization des valeurs calculées
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Callbacks memoizés
const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]);
```

### Code splitting
```typescript
// Lazy loading des pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ITSM = lazy(() => import('./pages/ITSM'));

// Dans le router
<Route path="/dashboard" element={
  <Suspense fallback={<LoadingSpinner />}>
    <Dashboard />
  </Suspense>
} />
```

## 🔒 Bonnes pratiques de sécurité

### Validation côté client
```typescript
// Utiliser Zod pour la validation
const userSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1)
});

type UserFormData = z.infer<typeof userSchema>;
```

### Gestion des erreurs
```typescript
// Error boundaries
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

## 📝 Documentation du code

### Commentaires JSDoc
```typescript
/**
 * Hook pour gérer les opérations CRUD sur une entité
 * @param tableName - Nom de la table Supabase
 * @param teamId - ID de l'équipe pour le filtrage RLS
 * @returns Objet avec les données et méthodes CRUD
 */
export const useEntityCRUD = <T>(tableName: string, teamId?: string) => {
  // Implementation
};
```

### Types documentés
```typescript
/**
 * Représente une organisation dans le système
 */
interface Organization {
  /** Identifiant unique de l'organisation */
  id: string;
  /** Nom de l'organisation */
  name: string;
  /** Type d'organisation (msp, client, esn) */
  type: 'msp' | 'client' | 'esn';
  /** Indique si c'est un MSP */
  is_msp: boolean;
}
```

## 🚀 Workflow de développement

### Branches Git
- `main` : Production
- `develop` : Développement
- `feature/nom-feature` : Nouvelles fonctionnalités
- `hotfix/nom-fix` : Corrections urgentes

### Pull Requests
1. Créer une branche feature
2. Développer la fonctionnalité
3. Écrire les tests
4. Créer la PR avec description détaillée
5. Review code
6. Merge après validation

### Commits conventionnels
```
feat: add user profile management
fix: resolve session timeout issue
docs: update API documentation
style: format code with prettier
refactor: simplify authentication logic
test: add unit tests for user service
```

Ce guide de développement assure une approche cohérente et efficace pour contribuer à la plateforme MSP.