import express from 'express';
import { UserService } from '../services/userService.js';

const router = express.Router();

/**
 * GET /api/users
 * Récupérer la liste des utilisateurs
 */
router.get('/', async (req, res) => {
  try {
    const { team_id } = req.query;
    const userProfile = req.user; // Vient du middleware d'authentification

    let result;

    // Si l'utilisateur est MSP admin, récupérer tous les utilisateurs
    if (userProfile.is_msp_admin) {
      result = await UserService.getAllUsers();
    }
    // Sinon, récupérer seulement les utilisateurs de son équipe
    else if (team_id || userProfile.default_team_id) {
      const targetTeamId = team_id || userProfile.default_team_id;
      result = await UserService.getUsersByTeam(targetTeamId);
    }
    else {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé - aucune équipe spécifiée',
        code: 'ACCESS_DENIED'
      });
    }

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        count: result.data.length
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in GET /users:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/users/:id
 * Récupérer un utilisateur par ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userProfile = req.user;

    const result = await UserService.getUserById(id);

    if (result.success) {
      // Vérifier les permissions d'accès
      const user = result.data;

      // MSP admin peut voir tous les utilisateurs
      if (userProfile.is_msp_admin) {
        return res.json(result);
      }

      // Utilisateur peut voir son propre profil
      if (user.id === userProfile.id) {
        return res.json(result);
      }

      // Utilisateur peut voir les membres de son équipe
      if (user.default_team_id === userProfile.default_team_id) {
        return res.json(result);
      }

      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé à cet utilisateur',
        code: 'ACCESS_DENIED'
      });
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error in GET /users/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/users
 * Créer un nouvel utilisateur
 */
router.post('/', async (req, res) => {
  try {
    const userProfile = req.user;

    // Seuls les MSP admins peuvent créer des utilisateurs
    if (!userProfile.is_msp_admin) {
      return res.status(403).json({
        success: false,
        error: 'Seuls les administrateurs MSP peuvent créer des utilisateurs',
        code: 'ACCESS_DENIED'
      });
    }

    const userData = req.body;

    // Validation des données requises
    const requiredFields = ['email', 'first_name', 'last_name', 'organization_id', 'team_id'];
    const missingFields = requiredFields.filter(field => !userData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Champs obligatoires manquants: ${missingFields.join(', ')}`,
        code: 'VALIDATION_ERROR'
      });
    }

    const result = await UserService.createUser(userData);

    if (result.success) {
      res.status(201).json(result);
    } else {
      const statusCode = result.code === 'VALIDATION_ERROR' ? 400 : 500;
      res.status(statusCode).json(result);
    }
  } catch (error) {
    console.error('Error in POST /users:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * PUT /api/users/:id
 * Mettre à jour un utilisateur
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userProfile = req.user;
    const updateData = req.body;

    // Vérifier les permissions
    const canUpdate = userProfile.is_msp_admin || userProfile.id === id;

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        error: 'Vous ne pouvez modifier que votre propre profil',
        code: 'ACCESS_DENIED'
      });
    }

    // Les non-MSP ne peuvent pas modifier certains champs critiques
    if (!userProfile.is_msp_admin) {
      const restrictedFields = ['is_msp_admin', 'default_organization_id', 'default_team_id'];
      restrictedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          delete updateData[field];
        }
      });
    }

    const result = await UserService.updateUser(id, updateData);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in PUT /users/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * DELETE /api/users/:id
 * Supprimer un utilisateur
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userProfile = req.user;

    // Seuls les MSP admins peuvent supprimer des utilisateurs
    if (!userProfile.is_msp_admin) {
      return res.status(403).json({
        success: false,
        error: 'Seuls les administrateurs MSP peuvent supprimer des utilisateurs',
        code: 'ACCESS_DENIED'
      });
    }

    // Empêcher l'auto-suppression
    if (id === userProfile.id) {
      return res.status(400).json({
        success: false,
        error: 'Vous ne pouvez pas supprimer votre propre compte',
        code: 'SELF_DELETE_DENIED'
      });
    }

    const result = await UserService.deleteUser(id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in DELETE /users/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;
