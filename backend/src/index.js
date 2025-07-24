import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

// Import des routes
import userRoutes from './routes/users.js';

// Import des middleware
import { authMiddleware } from './middleware/auth.js';

// Import de la configuration Swagger
import { addOpenApiHeaders, setupSwagger } from './swagger.js';

// Configuration
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Configuration CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002' // Ajout pour Swagger UI
];

const corsOptions = {
  origin: (origin, callback) => {
    // Permettre les requêtes sans origin (mobile apps, curl, Postman, etc.)
    if (!origin) return callback(null, true);

    // Vérifier si l'origin est autorisée
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Vérifier les wildcards (*.msp.com)
    const wildcardOrigins = allowedOrigins.filter(o => o.includes('*'));
    for (const wildcardOrigin of wildcardOrigins) {
      const pattern = wildcardOrigin.replace('*', '.*');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(origin)) {
        return callback(null, true);
      }
    }

    const msg = `Origin ${origin} not allowed by CORS policy`;
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

// Middleware de sécurité (configuration allégée pour le développement)
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "data:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
    },
  },
}));

// Rate limiting (exclure les routes de documentation)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limite par IP
  message: {
    success: false,
    error: 'Trop de requêtes depuis cette IP, réessayez plus tard.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Exclure les routes de documentation du rate limiting
    return req.path.startsWith('/api-docs') ||
           req.path.startsWith('/docs') ||
           req.path === '/health';
  }
});

// Appliquer le rate limiting seulement aux routes API
app.use('/api/', limiter);

// Middleware général
app.use(cors(corsOptions));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ajouter les headers OpenAPI à toutes les réponses
app.use(addOpenApiHeaders);

// Configuration de la documentation Swagger AVANT les autres routes
setupSwagger(app);

// Endpoint de santé avec headers CORS pour Swagger
app.get('/health', (req, res) => {
  // Headers CORS spécifiques pour Swagger UI
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  const healthInfo = {
    success: true,
    message: 'API MSP Platform is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    documentation: {
      swagger_ui: '/api-docs',
      openapi_json: '/api-docs.json',
      health_check: '/health'
    }
  };

  res.json(healthInfo);
});

// Documentation API simple (maintenue pour compatibilité)
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'API MSP Platform - Endpoints disponibles',
    version: '1.0.0',
    documentation: {
      swagger_ui: '/api-docs',
      openapi_json: '/api-docs.json',
      openapi_yaml: '/api-docs.yaml'
    },
    endpoints: {
      health: 'GET /health',
      auth: {
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me'
      },
      users: {
        list: 'GET /api/users',
        create: 'POST /api/users',
        get: 'GET /api/users/:id',
        update: 'PUT /api/users/:id',
        delete: 'DELETE /api/users/:id'
      },
      organizations: {
        list: 'GET /api/organizations',
        create: 'POST /api/organizations',
        get: 'GET /api/organizations/:id',
        update: 'PUT /api/organizations/:id',
        delete: 'DELETE /api/organizations/:id'
      },
      teams: {
        list: 'GET /api/teams',
        create: 'POST /api/teams',
        get: 'GET /api/teams/:id',
        update: 'PUT /api/teams/:id',
        delete: 'DELETE /api/teams/:id'
      }
    },
    authentication: 'Bearer Token required for all /api/* endpoints except /api/auth/login',
    cors: {
      allowed_origins: allowedOrigins,
      credentials: true
    }
  });
});

// Routes protégées par authentification
app.use('/api/users', authMiddleware, userRoutes);

// TODO: Ajouter les autres routes
// app.use('/api/auth', authRoutes);
// app.use('/api/organizations', authMiddleware, organizationRoutes);
// app.use('/api/teams', authMiddleware, teamRoutes);

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur non gérée:', err);

  // Erreur CORS
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: 'Origine non autorisée',
      code: 'CORS_ERROR'
    });
  }

  // Erreur JSON malformé
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'JSON malformé',
      code: 'INVALID_JSON'
    });
  }

  // Erreur générique
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Erreur interne du serveur'
      : err.message,
    code: 'INTERNAL_ERROR'
  });
});

// Middleware pour les routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} non trouvée`,
    code: 'ROUTE_NOT_FOUND',
    hint: 'Consultez la documentation API à /api-docs pour les endpoints disponibles'
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 API MSP Platform démarrée sur le port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/api-docs`);
  console.log(`📄 OpenAPI spec: http://localhost:${PORT}/api-docs.json`);
  console.log(`🔐 CORS autorisé pour: ${allowedOrigins.join(', ')}`);
});

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
  console.log('SIGTERM reçu, arrêt gracieux...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT reçu, arrêt gracieux...');
  process.exit(0);
});

export default app;
