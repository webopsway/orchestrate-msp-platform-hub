import { useGlobalITSMConfig, getConfigColor, getConfigLabel, getPriorityColor, getStatusColor, getCategoryColor } from './useGlobalITSMConfig';

// Hook pour obtenir les couleurs et labels ITSM de manière centralisée
export const useITSMColors = () => {
  return {
    // Fonctions utilitaires
    getPriorityColor,
    getStatusColor,
    getCategoryColor,
    getConfigColor,
    getConfigLabel,
    
    // Fonctions spécifiques pour la compatibilité
    getPriorityLabel: (priority: string) => getConfigLabel(priority, 'priorities'),
    getStatusLabel: (status: string, category?: string) => getConfigLabel(status, 'statuses', category),
    getCategoryLabel: (category: string) => getConfigLabel(category, 'categories'),
  };
};

// Fonction utilitaire standalone pour les composants qui n'utilisent pas de hooks
export const itsmColors = {
  priority: getPriorityColor,
  status: getStatusColor,
  category: getCategoryColor,
  config: getConfigColor,
};

// Fonction pour obtenir une variante de badge basée sur la couleur
export const getBadgeVariant = (color: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (color) {
    case '#ef4444': // Rouge
      return 'destructive';
    case '#f97316': // Orange
    case '#f59e0b': // Amber
      return 'default';
    case '#10b981': // Vert
      return 'default';
    case '#6b7280': // Gris
      return 'secondary';
    default:
      return 'outline';
  }
};