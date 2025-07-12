import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getPriorityColor, getStatusColor, getCategoryColor, getConfigLabel } from '@/hooks/useGlobalITSMConfig';

interface ITSMBadgeProps {
  type: 'priority' | 'status' | 'category';
  value: string;
  category?: string; // Pour les statuts qui dépendent de la catégorie
  className?: string;
}

export const ITSMBadge: React.FC<ITSMBadgeProps> = ({ type, value, category, className = "" }) => {
  let color: string;
  let label: string;

  switch (type) {
    case 'priority':
      color = getPriorityColor(value);
      label = getConfigLabel(value, 'priorities');
      break;
    case 'status':
      color = getStatusColor(value, category);
      label = getConfigLabel(value, 'statuses', category);
      break;
    case 'category':
      color = getCategoryColor(value);
      label = getConfigLabel(value, 'categories');
      break;
    default:
      color = '#6b7280';
      label = value;
  }

  // Déterminer la variante du badge basée sur la couleur
  const getVariant = (hexColor: string) => {
    switch (hexColor) {
      case '#ef4444': // Rouge
        return 'destructive' as const;
      case '#f97316': // Orange
      case '#f59e0b': // Amber
        return 'default' as const;
      case '#10b981': // Vert
        return 'default' as const;
      case '#6b7280': // Gris
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <Badge 
      variant={getVariant(color)} 
      className={`inline-flex items-center gap-1 ${className}`}
    >
      <div 
        className="w-2 h-2 rounded-full" 
        style={{ backgroundColor: color }}
      />
      {label}
    </Badge>
  );
};