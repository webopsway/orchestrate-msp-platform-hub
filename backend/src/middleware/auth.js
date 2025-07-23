import { supabaseClient } from '../config/supabase.js';

/**
 * Middleware d'authentification JWT
 * Vérifie le token Bearer dans les headers et récupère les informations utilisateur
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Récupérer le token depuis les headers
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification manquant',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Enlever "Bearer "

    // Pour le développement, on peut accepter un token simple 'dev'
    if (process.env.NODE_ENV === 'development' && token === 'dev') {
      // Utilisateur de développement par défaut (MSP admin)
      req.user = {
        id: 'dev-user-id',
        email: 'dev@msp.com',
        is_msp_admin: true,
        default_organization_id: 'dev-org-id',
        default_team_id: 'dev-team-id',
        first_name: 'Dev',
        last_name: 'User'
      };
      return next();
    }

    // Vérifier le token avec Supabase
    const { data: user, error } = await supabaseClient.auth.getUser(token);

    if (error || !user.user) {
      return res.status(401).json({
        success: false,
        error: 'Token invalide ou expiré',
        code: 'INVALID_TOKEN'
      });
    }

    // Récupérer le profil complet de l'utilisateur
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select(`
        *,
        organization:organizations(id, name),
        team:teams(id, name)
      `)
      .eq('id', user.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({
        success: false,
        error: 'Profil utilisateur non trouvé',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    // Ajouter les informations utilisateur à la requête
    req.user = {
      id: profile.id,
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      is_msp_admin: profile.is_msp_admin,
      default_organization_id: profile.default_organization_id,
      default_team_id: profile.default_team_id,
      metadata: profile.metadata,
      organization: profile.organization,
      team: profile.team
    };

    // Ajouter le token pour les appels Supabase suivants
    req.supabaseToken = token;

    next();
  } catch (error) {
    console.error('Erreur dans authMiddleware:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification du token',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware pour vérifier que l'utilisateur est MSP admin
 */
export const requireMspAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentification requise',
      code: 'AUTH_REQUIRED'
    });
  }

  if (!req.user.is_msp_admin) {
    return res.status(403).json({
      success: false,
      error: 'Accès réservé aux administrateurs MSP',
      code: 'MSP_ADMIN_REQUIRED'
    });
  }

  next();
};

/**
 * Middleware pour vérifier l'appartenance à une équipe
 */
export const requireTeamMember = (teamIdParam = 'teamId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentification requise',
        code: 'AUTH_REQUIRED'
      });
    }

    // MSP admin a accès à toutes les équipes
    if (req.user.is_msp_admin) {
      return next();
    }

    const teamId = req.params[teamIdParam] || req.query[teamIdParam] || req.body[teamIdParam];

    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: 'ID d\'équipe requis',
        code: 'TEAM_ID_REQUIRED'
      });
    }

    // Vérifier que l'utilisateur appartient à l'équipe
    if (req.user.default_team_id !== teamId) {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé à cette équipe',
        code: 'TEAM_ACCESS_DENIED'
      });
    }

    next();
  };
};

/**
 * Middleware pour vérifier l'appartenance à une organisation
 */
export const requireOrganizationMember = (orgIdParam = 'organizationId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentification requise',
        code: 'AUTH_REQUIRED'
      });
    }

    // MSP admin a accès à toutes les organisations
    if (req.user.is_msp_admin) {
      return next();
    }

    const organizationId = req.params[orgIdParam] || req.query[orgIdParam] || req.body[orgIdParam];

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'ID d\'organisation requis',
        code: 'ORGANIZATION_ID_REQUIRED'
      });
    }

    // Vérifier que l'utilisateur appartient à l'organisation
    if (req.user.default_organization_id !== organizationId) {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé à cette organisation',
        code: 'ORGANIZATION_ACCESS_DENIED'
      });
    }

    next();
  };
};
