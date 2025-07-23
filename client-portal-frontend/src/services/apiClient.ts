import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fonction pour extraire le tenant du sous-domaine
export const extractTenantFromSubdomain = (hostname: string): string | null => {
  const parts = hostname.split('.');
  if (parts.length >= 3 && parts[1] === 'msp' && parts[2] === 'com') {
    return parts[0]; // client1.msp.com → "client1"
  }
  return null;
};

// Intercepteur pour ajouter le token d'auth et les headers tenant
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Ajouter le tenant depuis le sous-domaine
  const tenant = extractTenantFromSubdomain(window.location.hostname);
  if (tenant) {
    config.headers['X-Tenant'] = tenant;
  }

  return config;
});

// Intercepteur pour gérer les erreurs d'auth
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    if (error.response?.status === 403) {
      // Accès refusé - rediriger vers page d'erreur tenant
      window.location.href = '/access-denied';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
