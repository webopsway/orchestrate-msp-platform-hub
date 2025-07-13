import { z } from 'zod';
import { useITSMCONFIG } from '@/modules/itsm/config';

// Schémas de validation de base
const baseITSMItemSchema = z.object({
  title: z.string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  description: z.string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .optional(),
  priority: z.string().min(1, 'La priorité est requise'),
  status: z.string().min(1, 'Le statut est requis'),
  assigned_to: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Schéma pour les incidents
export const incidentSchema = baseITSMItemSchema.extend({
  type: z.literal('incident'),
  impact: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  source: z.enum(['email', 'phone', 'portal', 'chat', 'other']).optional(),
  resolution: z.string().optional(),
  resolved_at: z.string().optional(),
});

// Schéma pour les changements
export const changeSchema = baseITSMItemSchema.extend({
  type: z.literal('change'),
  change_type: z.enum(['emergency', 'standard', 'normal']).optional(),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  impact_analysis: z.string().optional(),
  rollback_plan: z.string().optional(),
  scheduled_date: z.string().optional(),
  approved_by: z.string().optional(),
  approved_at: z.string().optional(),
  implementation_notes: z.string().optional(),
});

// Schéma pour les demandes de service
export const serviceRequestSchema = baseITSMItemSchema.extend({
  type: z.literal('request'),
  service_category: z.string().optional(),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  impact: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  due_date: z.string().optional(),
  resolution: z.string().optional(),
  resolved_at: z.string().optional(),
});

// Schéma unifié pour tous les types ITSM
export const itsmItemSchema = z.discriminatedUnion('type', [
  incidentSchema,
  changeSchema,
  serviceRequestSchema,
]);

// Validation dynamique basée sur les configurations
export const createDynamicValidation = (configType: 'priorities' | 'statuses' | 'categories') => {
  const { data: configs } = useITSMCONFIG(configType);
  
  const validValues = configs.map(config => config.config_key);
  
  return z.enum(validValues as [string, ...string[]], {
    errorMap: () => ({ message: `Valeur invalide. Valeurs autorisées: ${validValues.join(', ')}` })
  });
};

// Validation avec fallback vers les valeurs par défaut
export const validateWithFallback = (
  value: string,
  configType: 'priorities' | 'statuses' | 'categories',
  category?: string
) => {
  const { data: configs } = useITSMCONFIG(configType, category);
  
  // Vérifier si la valeur existe dans les configurations
  const configExists = configs.some(config => config.config_key === value);
  
  if (configExists) {
    return { isValid: true, value };
  }
  
  // Fallback vers les valeurs par défaut
  const defaults = {
    priorities: ['low', 'medium', 'high', 'critical'],
    statuses: {
      incident: ['open', 'in_progress', 'resolved', 'closed'],
      change: ['draft', 'pending_approval', 'approved', 'rejected', 'implemented', 'failed'],
      request: ['open', 'in_progress', 'resolved', 'closed', 'cancelled']
    },
    categories: ['incident', 'change', 'request']
  };
  
  let defaultValues: string[] = [];
  if (configType === 'statuses' && category) {
    defaultValues = defaults.statuses[category as keyof typeof defaults.statuses] || [];
  } else {
    defaultValues = defaults[configType] || [];
  }
  
  const isValidDefault = defaultValues.includes(value);
  
  return {
    isValid: isValidDefault,
    value: isValidDefault ? value : defaultValues[0] || '',
    isDefault: isValidDefault
  };
};

// Validation complète d'un élément ITSM
export const validateITSMItem = (data: any, type: 'incident' | 'change' | 'request') => {
  try {
    let schema;
    switch (type) {
      case 'incident':
        schema = incidentSchema;
        break;
      case 'change':
        schema = changeSchema;
        break;
      case 'request':
        schema = serviceRequestSchema;
        break;
      default:
        throw new Error('Type ITSM invalide');
    }
    
    const result = schema.parse(data);
    
    // Validation supplémentaire des valeurs dynamiques
    const priorityValidation = validateWithFallback(result.priority, 'priorities');
    const statusValidation = validateWithFallback(result.status, 'statuses', type);
    
    if (!priorityValidation.isValid) {
      throw new Error(`Priorité invalide: ${result.priority}`);
    }
    
    if (!statusValidation.isValid) {
      throw new Error(`Statut invalide: ${result.status}`);
    }
    
    return {
      isValid: true,
      data: {
        ...result,
        priority: priorityValidation.value,
        status: statusValidation.value
      }
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Erreur de validation inconnue'
    };
  }
};

// Types TypeScript dérivés des schémas
export type IncidentData = z.infer<typeof incidentSchema>;
export type ChangeData = z.infer<typeof changeSchema>;
export type ServiceRequestData = z.infer<typeof serviceRequestSchema>;
export type ITSMItemData = z.infer<typeof itsmItemSchema>; 