import swaggerUi from 'swagger-ui-express';

// Spécification OpenAPI complète
const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'MSP Platform API',
    description: `
# 🚀 API Backend MSP Platform

API Backend pour la plateforme MSP (Managed Service Provider) avec architecture séparée.

## 🔐 Authentification
L'API utilise des tokens Bearer JWT pour l'authentification. Tous les endpoints \`/api/*\` nécessitent une authentification sauf \`/api/auth/login\`.

### 🔧 Token de développement
Pour tester l'API en développement, utilisez le token spécial : **\`dev\`**

Ce token vous donnera des privilèges administrateur MSP complets.

## 🏗️ Architecture Séparée
- **MSP Admin Interface**: Accès complet aux données (port 3000)
- **Client Portal Interface**: Accès filtré par tenant (port 3001)
- **API Backend**: Logique métier centralisée (port 3002)

## ⚡ Fonctionnalités
- ✅ Rate Limiting: 100 requêtes par IP toutes les 15 minutes
- ✅ CORS configuré pour localhost et \`*.msp.com\`
- ✅ Authentification JWT avec tokens de développement
- ✅ Documentation interactive complète
- ✅ Validation des données et gestion d'erreurs
    `,
    version: '1.0.0',
    contact: {
      name: 'MSP Platform API Support',
      email: 'support@msp.com'
    },
    license: {
      name: 'Proprietary License',
      url: 'https://msp.com/license'
    }
  },
  servers: [
    {
      url: 'http://localhost:3002',
      description: '🔧 Serveur de développement local'
    },
    {
      url: 'https://api.msp.com',
      description: '🌐 Serveur de production'
    }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['🟢 Health & Status'],
        summary: 'Vérification de santé du serveur',
        description: '**Endpoint publique** pour vérifier que l\'API fonctionne correctement.\n\nAucune authentification requise.',
        operationId: 'healthCheck',
        responses: {
          '200': {
            description: '✅ API opérationnelle',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'API MSP Platform is running' },
                    timestamp: { type: 'string', format: 'date-time', example: '2025-01-24T01:15:30.000Z' },
                    version: { type: 'string', example: '1.0.0' },
                    environment: { type: 'string', example: 'development' },
                    uptime: { type: 'number', example: 3600.5, description: 'Temps de fonctionnement en secondes' },
                    documentation: {
                      type: 'object',
                      properties: {
                        swagger_ui: { type: 'string', example: '/api-docs' },
                        openapi_json: { type: 'string', example: '/api-docs.json' },
                        health_check: { type: 'string', example: '/health' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api': {
      get: {
        tags: ['📚 Documentation'],
        summary: 'Documentation des endpoints disponibles',
        description: '**Endpoint publique** qui retourne la liste de tous les endpoints disponibles de l\'API avec leurs descriptions.',
        operationId: 'getApiDocumentation',
        responses: {
          '200': {
            description: '📋 Liste des endpoints',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'API MSP Platform - Endpoints disponibles' },
                    version: { type: 'string', example: '1.0.0' },
                    documentation: {
                      type: 'object',
                      properties: {
                        swagger_ui: { type: 'string', example: '/api-docs' },
                        openapi_json: { type: 'string', example: '/api-docs.json' }
                      }
                    },
                    endpoints: {
                      type: 'object',
                      description: 'Structure complète des endpoints disponibles'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/users': {
      get: {
        tags: ['👥 Gestion des Utilisateurs'],
        summary: 'Liste des utilisateurs',
        description: `
### 📋 Récupération des utilisateurs selon les permissions

**Permissions :**
- **MSP Admin** : Voir tous les utilisateurs de toutes les organisations
- **Utilisateur normal** : Voir seulement les membres de son équipe

### 🧪 Exemples de test avec curl

\`\`\`bash
# Récupérer tous les utilisateurs (MSP Admin)
curl -H "Authorization: Bearer dev" http://localhost:3002/api/users

# Filtrer par équipe spécifique
curl -H "Authorization: Bearer dev" "http://localhost:3002/api/users?team_id=uuid-equipe"
\`\`\`

### 📊 Données retournées
- Informations utilisateur complètes
- Organisation et équipe associées
- Métadonnées (rôle, département, statut)
        `,
        operationId: 'getUsers',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'team_id',
            in: 'query',
            description: '🎯 Filtrer par ID d\'équipe (optionnel)',
            schema: { type: 'string', format: 'uuid' },
            example: '789e0123-e89b-12d3-a456-426614174002'
          }
        ],
        responses: {
          '200': {
            description: '✅ Liste des utilisateurs récupérée',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' }
                    },
                    count: { type: 'integer', example: 5, description: 'Nombre total d\'utilisateurs' }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: `
## 🔐 Authentification JWT

**Format :** \`Bearer <token>\`

### 🔧 Token de développement
Pour tester l'API en développement :
\`\`\`
dev
\`\`\`

Ce token vous donnera des **privilèges administrateur MSP complets**.

### 🔒 Production
En production, obtenez un vrai token JWT via \`POST /api/auth/login\`.
        `
      }
    },
    schemas: {
      User: {
        type: 'object',
        description: '👤 Modèle complet d\'un utilisateur du système',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Identifiant unique de l\'utilisateur',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Adresse email (unique)',
            example: 'utilisateur@exemple.com'
          },
          first_name: {
            type: 'string',
            description: 'Prénom de l\'utilisateur',
            example: 'Jean'
          },
          last_name: {
            type: 'string',
            description: 'Nom de famille de l\'utilisateur',
            example: 'Dupont'
          },
          is_msp_admin: {
            type: 'boolean',
            description: '🔐 Indique si l\'utilisateur est administrateur MSP',
            example: false
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Date de création du compte',
            example: '2025-01-24T01:15:30.000Z'
          }
        },
        required: ['id', 'email', 'first_name', 'last_name']
      }
    },
    responses: {
      Unauthorized: {
        description: '🚫 Token manquant ou invalide',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: { type: 'string', example: 'Token d\'authentification manquant' },
                code: { type: 'string', example: 'NO_TOKEN' }
              }
            }
          }
        }
      },
      Forbidden: {
        description: '🔒 Accès interdit - permissions insuffisantes',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: { type: 'string', example: 'Accès non autorisé' },
                code: { type: 'string', example: 'ACCESS_DENIED' }
              }
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: '🟢 Health & Status',
      description: 'Endpoints de vérification de santé et statut du serveur'
    },
    {
      name: '📚 Documentation',
      description: 'Documentation auto-générée de l\'API avec tous les endpoints'
    },
    {
      name: '👥 Gestion des Utilisateurs',
      description: 'CRUD complet pour la gestion des utilisateurs MSP et clients avec permissions granulaires'
    }
  ]
};

// Configuration Swagger UI optimisée pour CORRIGER les erreurs SSL
const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info {
      margin-bottom: 30px;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
    }
    .swagger-ui .info .title {
      color: white !important;
      font-size: 42px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    .swagger-ui .info .description {
      color: white !important;
      font-size: 14px;
      line-height: 1.8;
      opacity: 0.95;
    }
    .swagger-ui .scheme-container {
      background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
      color: #2d3436;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 25px;
      border: none;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }
    .swagger-ui .auth-wrapper {
      margin-bottom: 25px;
    }
    .swagger-ui .btn.authorize {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      color: white;
      border-radius: 8px;
      padding: 12px 24px;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }
    .swagger-ui .btn.authorize:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }
    .swagger-ui .opblock {
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      border: none;
      overflow: hidden;
    }
    .swagger-ui .opblock-summary {
      border-radius: 12px 12px 0 0;
      padding: 15px 20px;
    }
    .swagger-ui .opblock.opblock-get .opblock-summary {
      background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
    }
    .swagger-ui .opblock.opblock-post .opblock-summary {
      background: linear-gradient(135deg, #0984e3 0%, #74b9ff 100%);
    }
    .swagger-ui .opblock.opblock-put .opblock-summary {
      background: linear-gradient(135deg, #fdcb6e 0%, #f39c12 100%);
    }
    .swagger-ui .opblock.opblock-delete .opblock-summary {
      background: linear-gradient(135deg, #e84393 0%, #fd79a8 100%);
    }
    .swagger-ui .response-col_status {
      font-weight: bold;
    }
    .swagger-ui .model-box {
      border-radius: 8px;
      background: #f8fafc;
    }
    .swagger-ui .parameter__name {
      font-weight: 600;
    }
    .swagger-ui .response-col_description {
      font-weight: 500;
    }
  `,
  customSiteTitle: '🚀 MSP Platform API - Documentation Interactive',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    // CORRECTION SSL: Configuration explicite pour HTTP local
    url: 'http://localhost:3002/api-docs.json',
    validatorUrl: null, // Désactiver la validation externe qui peut causer des erreurs SSL
    defaultModelsExpandDepth: 3,
    defaultModelExpandDepth: 3,
    docExpansion: 'list',
    filter: true,
    showRequestHeaders: true,
    tryItOutEnabled: true,
    persistAuthorization: true,
    displayOperationId: false,
    displayRequestDuration: true,
    deepLinking: true,
    showExtensions: true,
    showCommonExtensions: true,
    // Forcer l'utilisation de HTTP pour toutes les requêtes
    requestInterceptor: (request) => {
      // S'assurer que toutes les requêtes utilisent HTTP
      if (request.url && request.url.startsWith('https://localhost')) {
        request.url = request.url.replace('https://localhost', 'http://localhost');
      }

      // Auto-ajouter le token dev en développement si aucun token n'est présent
      if (process.env.NODE_ENV === 'development' && !request.headers.Authorization) {
        request.headers.Authorization = 'Bearer dev';
        console.log('🔧 Token de développement ajouté automatiquement');
      }
      return request;
    },
    // Intercepter les réponses pour debug
    responseInterceptor: (response) => {
      console.log('📡 Réponse Swagger:', response.status, response.url);
      return response;
    }
  }
};

/**
 * Configuration Swagger optimisée pour corriger les erreurs SSL en développement local
 */
export const setupSwagger = (app) => {
  // Middleware CORS global pour toutes les routes Swagger
  app.use('/api-docs*', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'false');

    // Forcer HTTP et désactiver les headers sécurisés qui causent des problèmes
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  });

  // Route pour la spécification OpenAPI (JSON) - CORRECTION SSL
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Modifier la spécification pour forcer HTTP en développement
    const spec = { ...openApiSpec };
    if (process.env.NODE_ENV === 'development') {
      spec.servers = [
        { url: 'http://localhost:3002', description: '🔧 Serveur de développement local (HTTP)' }
      ];
    }

    res.json(spec);
  });

  // Interface Swagger UI avec configuration locale anti-SSL
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(openApiSpec, {
    ...swaggerOptions,
    // Configuration supplémentaire pour corriger SSL
    swaggerOptions: {
      ...swaggerOptions.swaggerOptions,
      // Forcer l'utilisation locale et désactiver les validations externes
      plugins: [
        () => ({
          statePlugins: {
            spec: {
              wrapSelectors: {
                allowTryItOutFor: () => () => true
              }
            }
          }
        })
      ]
    }
  }));

  // Redirection depuis /docs vers /api-docs pour compatibilité
  app.get('/docs', (req, res) => {
    res.redirect('/api-docs');
  });

  console.log('📚 Documentation Swagger configurée avec correction SSL:');
  console.log('   📖 Interface HTML interactive: http://localhost:3002/api-docs');
  console.log('   📄 Spécification JSON:         http://localhost:3002/api-docs.json');
  console.log('   🔗 Raccourci:                  http://localhost:3002/docs');
  console.log('   🔧 Token dev auto-configuré pour les tests');
  console.log('   ✅ Configuration HTTP locale (pas de SSL)');
  console.log('   🛡️  CORS et validations externes désactivées');
};

export default { setupSwagger, openApiSpec };
