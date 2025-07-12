// Configuration du module ITSM

export const ITSM_CONFIG = {
  // Tables de base de données
  tables: {
    incidents: 'itsm_incidents',
    changes: 'itsm_change_requests',
    serviceRequests: 'itsm_service_requests'
  },

  // Statuts des incidents
  incidentStatuses: {
    open: 'open',
    inProgress: 'in_progress',
    resolved: 'resolved',
    closed: 'closed'
  } as const,

  // Priorités des incidents
  incidentPriorities: {
    low: 'low',
    medium: 'medium',
    high: 'high',
    critical: 'critical'
  } as const,

  // Statuts des changements
  changeStatuses: {
    draft: 'draft',
    pendingApproval: 'pending_approval',
    approved: 'approved',
    rejected: 'rejected',
    implemented: 'implemented',
    failed: 'failed'
  } as const,

  // Types de changement
  changeTypes: {
    emergency: 'emergency',
    standard: 'standard',
    normal: 'normal'
  } as const,

  // Pagination par défaut
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 100
  },

  // Messages d'erreur
  messages: {
    errors: {
      fetchFailed: 'Erreur lors du chargement des données',
      createFailed: 'Erreur lors de la création',
      updateFailed: 'Erreur lors de la modification',
      deleteFailed: 'Erreur lors de la suppression',
      permissionDenied: 'Permission refusée',
      validationFailed: 'Données invalides'
    },
    success: {
      created: 'Élément créé avec succès',
      updated: 'Élément modifié avec succès',
      deleted: 'Élément supprimé avec succès',
      statusUpdated: 'Statut mis à jour avec succès',
      assigned: 'Assignation mise à jour avec succès'
    }
  },

  // Validation
  validation: {
    title: {
      minLength: 3,
      maxLength: 200
    },
    description: {
      minLength: 10,
      maxLength: 2000
    }
  },

  // Logs de débogage
  debug: {
    enabled: true, // À configurer selon l'environnement
    logLevel: 'info' as 'debug' | 'info' | 'warn' | 'error'
  }
} as const;

// Types dérivés de la configuration
export type IncidentStatus = typeof ITSM_CONFIG.incidentStatuses[keyof typeof ITSM_CONFIG.incidentStatuses];
export type IncidentPriority = typeof ITSM_CONFIG.incidentPriorities[keyof typeof ITSM_CONFIG.incidentPriorities];
export type ChangeStatus = typeof ITSM_CONFIG.changeStatuses[keyof typeof ITSM_CONFIG.changeStatuses];
export type ChangeType = typeof ITSM_CONFIG.changeTypes[keyof typeof ITSM_CONFIG.changeTypes]; 