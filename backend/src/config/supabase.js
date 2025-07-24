import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service key pour bypass RLS
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // Anon key pour opérations normales

// Mode de test si les variables ne sont pas définies
const isTestMode = !supabaseUrl || !supabaseServiceKey || !supabaseAnonKey ||
                   supabaseUrl.includes('temp-project') ||
                   supabaseServiceKey.includes('temp-');

let supabaseAdmin, supabaseClient, createUserClient;

if (isTestMode) {
  console.log('⚠️  Mode TEST activé - Variables Supabase manquantes ou temporaires');
  console.log('📝 Pour une utilisation complète, configurez vos vraies variables Supabase dans backend/.env');

  // Créer des clients mock pour les tests
  const mockClient = {
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
      single: () => ({ data: null, error: null })
    }),
    auth: {
      getUser: () => ({ data: { user: { id: 'test-user' } }, error: null })
    }
  };

  supabaseAdmin = mockClient;
  supabaseClient = mockClient;
  createUserClient = () => mockClient;
} else {
  console.log('✅ Mode PRODUCTION activé - Variables Supabase configurées');

  // Configuration normale avec vraies variables Supabase
  // Client avec service key (bypass RLS) pour les opérations admin
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Client avec anon key (respecte RLS) pour les opérations utilisateurs
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

  // Fonction pour créer un client avec un token utilisateur spécifique
  createUserClient = (accessToken) => {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    });
  };
}

// Export des clients
export { createUserClient, supabaseAdmin, supabaseClient };

export default {
  admin: supabaseAdmin,
  client: supabaseClient,
  createUserClient: createUserClient,
  isTestMode
};
