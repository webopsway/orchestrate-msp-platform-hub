import swaggerUi from 'swagger-ui-express';

// Spécification OpenAPI simplifiée pour éviter les problèmes
const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'MSP Platform API',
    description: `
# API Backend MSP Platform

API Backend pour la plateforme MSP (Managed Service Provider) avec architecture séparée.

## 🔐 Authentification
L'API utilise des tokens Bearer JWT pour l'authentification. Tous les endpoints \`/api/*\` nécessitent une authentification sauf \`/api/auth/login\`.

**Pour le développement**, utilisez le token \`dev\` qui vous donnera des privilèges administrateur MSP.

## 🏗️ Architecture
- **MSP Admin Interface**: Accès complet aux données (port 3000)
- **Client Portal Interface**: Accès filtré par tenant (port 3001)
- **API Backend**: Logique métier centralisée (port 3002)

## ⚡ Rate Limiting
- 100 requêtes par IP toutes les 15 minutes sur \`/api/*\`
- Headers standards de rate limiting inclus dans les réponses
- Routes de documentation exclues du rate limiting

## 🌐 CORS
Configuré pour permettre les origins localhost et les domaines \`*.msp.com\`
    `,
    version: '1.0.0',
    contact: {
      name: 'MSP Platform API Support',
      email: 'support@msp.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3002',
      description: 'Serveur de développement local'
    },
    {
      url: 'https://api.msp.com',
      description: 'Serveur de production'
    }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health & Status'],
        summary: 'Vérification de santé du serveur',
        description: 'Endpoint publique pour vérifier que l\'API fonctionne correctement',
        responses: {
          '200': {
            description: 'API opérationnelle',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'API MSP Platform is running' },
                    timestamp: { type: 'string', format: 'date-time' },
                    version: { type: 'string', example: '1.0.0' },
                    environment: { type: 'string', example: 'development' }
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
        tags: ['Documentation'],
        summary: 'Documentation des endpoints disponibles',
        description: 'Retourne la liste de tous les endpoints disponibles de l\'API',
        responses: {
          '200': {
            description: 'Liste des endpoints',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    version: { type: 'string' },
                    documentation: {
                      type: 'object',
                      properties: {
                        swagger_ui: { type: 'string', example: '/api-docs' },
                        openapi_json: { type: 'string', example: '/api-docs.json' },
                        openapi_yaml: { type: 'string', example: '/api-docs.yaml' }
                      }
                    },
                    endpoints: { type: 'object' }
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
        tags: ['👥 Users'],
        summary: 'Liste des utilisateurs',
        description: `
Récupère la liste des utilisateurs selon les permissions :
- **MSP Admin**: Voir tous les utilisateurs
- **Utilisateur normal**: Voir seulement les membres de son équipe

### Exemples de test avec curl:
\`\`\`bash
# Récupérer tous les utilisateurs (MSP Admin)
curl -H "Authorization: Bearer dev" http://localhost:3002/api/users

# Filtrer par équipe
curl -H "Authorization: Bearer dev" "http://localhost:3002/api/users?team_id=uuid-equipe"
\`\`\`
        `,
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'team_id',
            in: 'query',
            description: 'Filtrer par ID d\'équipe (optionnel)',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'Liste des utilisateurs',
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
                    count: { type: 'integer', example: 5 }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' }
        }
      },
      post: {
        tags: ['👥 Users'],
        summary: 'Créer un utilisateur',
        description: `
Crée un nouvel utilisateur. **Réservé aux administrateurs MSP uniquement.**

### Exemple de test avec curl:
\`\`\`bash
curl -X POST http://localhost:3002/api/users \\
  -H "Authorization: Bearer dev" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "nouvel.utilisateur@exemple.com",
    "first_name": "Nouvel",
    "last_name": "Utilisateur",
    "organization_id": "test-org-1",
    "team_id": "test-team-1",
    "role": "Développeur",
    "department": "IT"
  }'
\`\`\`
        `,
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateUserRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Utilisateur créé avec succès',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' }
        }
      }
    },
    '/api/users/{id}': {
      get: {
        tags: ['👥 Users'],
        summary: 'Détails d\'un utilisateur',
        description: `
Récupère les détails d'un utilisateur selon les permissions :
- **MSP Admin**: Voir n'importe quel utilisateur
- **Utilisateur normal**: Voir son propre profil ou les membres de son équipe

### Exemple de test avec curl:
\`\`\`bash
curl -H "Authorization: Bearer dev" http://localhost:3002/api/users/test-user-1
\`\`\`
        `,
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID unique de l\'utilisateur',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'Détails de l\'utilisateur',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      },
      put: {
        tags: ['👥 Users'],
        summary: 'Mettre à jour un utilisateur',
        description: `
Met à jour un utilisateur selon les permissions :
- **MSP Admin**: Modifier n'importe quel utilisateur
- **Utilisateur normal**: Modifier seulement son propre profil (avec restrictions)

### Champs protégés (MSP Admin uniquement):
- \`is_msp_admin\`
- \`default_organization_id\`
- \`default_team_id\`

### Exemple de test avec curl:
\`\`\`bash
curl -X PUT http://localhost:3002/api/users/test-user-1 \\
  -H "Authorization: Bearer dev" \\
  -H "Content-Type: application/json" \\
  -d '{
    "first_name": "Prénom Modifié",
    "department": "DevOps"
  }'
\`\`\`
        `,
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID unique de l\'utilisateur',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Utilisateur mis à jour avec succès',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' }
        }
      },
      delete: {
        tags: ['👥 Users'],
        summary: 'Supprimer un utilisateur',
        description: `
Supprime un utilisateur. **Réservé aux administrateurs MSP uniquement.**

⚠️ **Restrictions**: Un utilisateur ne peut pas supprimer son propre compte.

### Exemple de test avec curl:
\`\`\`bash
curl -X DELETE http://localhost:3002/api/users/test-user-2 \\
  -H "Authorization: Bearer dev"
\`\`\`
        `,
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID unique de l\'utilisateur',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'Utilisateur supprimé avec succès',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Utilisateur supprimé avec succès' }
                  }
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' }
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
**Token JWT d'authentification**

Format: \`Bearer <token>\`

### 🔧 Token de développement
Pour tester l'API en développement, utilisez le token spécial :
\`\`\`
dev
\`\`\`

Ce token vous donnera des privilèges administrateur MSP complets.

### 🔒 Production
En production, obtenez un vrai token JWT via \`POST /api/auth/login\`.
        `
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'utilisateur@exemple.com'
          },
          first_name: {
            type: 'string',
            example: 'Jean'
          },
          last_name: {
            type: 'string',
            example: 'Dupont'
          },
          is_msp_admin: {
            type: 'boolean',
            description: 'Indique si l\'utilisateur est administrateur MSP',
            example: false
          },
          default_organization_id: {
            type: 'string',
            format: 'uuid',
            nullable: true,
            example: '456e7890-e89b-12d3-a456-426614174001'
          },
          default_team_id: {
            type: 'string',
            format: 'uuid',
            nullable: true,
            example: '789e0123-e89b-12d3-a456-426614174002'
          },
          organization: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string', example: 'ACME Corporation' }
            }
          },
          team: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string', example: 'Équipe Développement' }
            }
          },
          metadata: {
            type: 'object',
            description: 'Métadonnées utilisateur (téléphone, département, etc.)',
            properties: {
              role: { type: 'string', example: 'Développeur' },
              department: { type: 'string', example: 'IT' },
              phone: { type: 'string', example: '+33 1 23 45 67 89' },
              position: { type: 'string', example: 'Développeur Senior' },
              status: { type: 'string', example: 'active' }
            }
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2025-01-24T01:15:30.000Z'
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            example: '2025-01-24T01:15:30.000Z'
          }
        },
        required: ['id', 'email']
      },
      CreateUserRequest: {
        type: 'object',
        required: ['email', 'first_name', 'last_name', 'organization_id', 'team_id'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'nouvel.utilisateur@exemple.com'
          },
          first_name: {
            type: 'string',
            example: 'Nouvel'
          },
          last_name: {
            type: 'string',
            example: 'Utilisateur'
          },
          organization_id: {
            type: 'string',
            format: 'uuid',
            example: '456e7890-e89b-12d3-a456-426614174001'
          },
          team_id: {
            type: 'string',
            format: 'uuid',
            example: '789e0123-e89b-12d3-a456-426614174002'
          },
          phone: {
            type: 'string',
            example: '+33 1 23 45 67 89'
          },
          role: {
            type: 'string',
            example: 'Développeur'
          },
          department: {
            type: 'string',
            example: 'IT'
          },
          position: {
            type: 'string',
            example: 'Développeur Senior'
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'pending'],
            example: 'active'
          }
        }
      },
      UpdateUserRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email'
          },
          first_name: {
            type: 'string'
          },
          last_name: {
            type: 'string'
          },
          phone: {
            type: 'string'
          },
          role: {
            type: 'string'
          },
          department: {
            type: 'string'
          },
          position: {
            type: 'string'
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'pending']
          }
        }
      }
    },
    responses: {
      Unauthorized: {
        description: 'Token manquant ou invalide',
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
        description: 'Accès interdit - permissions insuffisantes',
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
      },
      NotFound: {
        description: 'Ressource non trouvée',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: { type: 'string', example: 'Utilisateur non trouvé' },
                code: { type: 'string', example: 'USER_NOT_FOUND' }
              }
            }
          }
        }
      },
      BadRequest: {
        description: 'Données invalides ou manquantes',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: { type: 'string', example: 'Champs obligatoires manquants: email, first_name' },
                code: { type: 'string', example: 'VALIDATION_ERROR' }
              }
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Health & Status',
      description: '🟢 Endpoints de vérification de santé et statut du serveur'
    },
    {
      name: 'Documentation',
      description: '📚 Documentation auto-générée de l\'API'
    },
    {
      name: '👥 Users',
      description: 'Gestion des utilisateurs MSP et clients avec permissions granulaires'
    }
  ]
};

// Configuration Swagger UI optimisée pour le développement local
const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin-bottom: 30px; }
    .swagger-ui .info .title {
      color: #2563eb;
      font-size: 36px;
      font-weight: bold;
    }
    .swagger-ui .info .description {
      font-size: 14px;
      line-height: 1.6;
    }
    .swagger-ui .scheme-container {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 25px;
      border: none;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .swagger-ui .auth-wrapper {
      margin-bottom: 25px;
    }
    .swagger-ui .btn.authorize {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      color: white;
      border-radius: 8px;
      padding: 10px 20px;
      font-weight: 600;
      transition: all 0.3s ease;
    }
    .swagger-ui .btn.authorize:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    .swagger-ui .opblock {
      border-radius: 8px;
      margin-bottom: 15px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .swagger-ui .opblock-summary {
      border-radius: 8px 8px 0 0;
    }
    .swagger-ui .response-col_status {
      font-weight: bold;
    }
  `,
  customSiteTitle: '📚 MSP Platform API - Documentation Interactive',
  swaggerOptions: {
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    docExpansion: 'list',
    filter: true,
    showRequestHeaders: true,
    tryItOutEnabled: true,
    persistAuthorization: true,
    displayOperationId: false,
    displayRequestDuration: true,
    requestInterceptor: (request) => {
      // Auto-ajouter le token dev en développement si aucun token n'est présent
      if (process.env.NODE_ENV === 'development' && !request.headers.Authorization) {
        request.headers.Authorization = 'Bearer dev';
        console.log('🔧 Token de développement ajouté automatiquement');
      }
      return request;
    }
  }
};

/**
 * Configuration et middleware Swagger pour Express
 */
export const setupSwagger = (app) => {
  // Route pour la spécification OpenAPI (JSON)
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(openApiSpec);
  });

  // Interface Swagger UI
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(openApiSpec, swaggerOptions));

  // Redirection depuis /docs vers /api-docs pour compatibilité
  app.get('/docs', (req, res) => {
    res.redirect('/api-docs');
  });

  console.log('📚 Documentation Swagger configurée:');
  console.log('   📖 Interface interactive: /api-docs');
  console.log('   📄 Spécification JSON:    /api-docs.json');
  console.log('   🔗 Raccourci:             /docs');
  console.log('   🔧 Token dev auto-ajouté pour les tests');
};

/**
 * Middleware pour ajouter les headers OpenAPI aux réponses
 */
export const addOpenApiHeaders = (req, res, next) => {
  // Ajouter les liens vers la documentation dans les headers
  res.set({
    'X-API-Docs': '/api-docs',
    'X-OpenAPI-Spec': '/api-docs.json',
    'X-API-Version': openApiSpec.info.version,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
  });
  next();
};

export default { setupSwagger, addOpenApiHeaders, openApiSpec };
