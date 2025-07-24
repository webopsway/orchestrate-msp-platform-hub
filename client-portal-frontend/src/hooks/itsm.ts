// Hooks spécialisés
export { useIncidents } from "./useIncidents";
export { useChanges } from "./useChanges";
export { useServiceRequests } from "./useServiceRequests";

// Hook unifié pour tous les éléments ITSM
export { useITSMItems } from "./useITSMItems";

// Configuration dynamique
export * from "./useGlobalITSMConfig";
export * from "./useITSMColors";

// Export du nouveau système de configuration dynamique avec préfixes pour éviter les conflits
export {
  useITSMDynamicConfig,
  useCreateITSMDynamicConfig,
  useUpdateITSMDynamicConfig,
  useDeleteITSMDynamicConfig,
  useITSMPriorities as useDynamicITSMPriorities,
  useITSMStatuses as useDynamicITSMStatuses,
  useITSMCategories as useDynamicITSMCategories,
  getConfigLabel as getDynamicConfigLabel,
  getConfigColor as getDynamicConfigColor,
  getConfigCategory as getDynamicConfigCategory,
  getConfigDescription as getDynamicConfigDescription,
  formatConfigsForSelect as formatDynamicConfigsForSelect,
  type ITSMConfigItem as DynamicITSMConfigItem,
  type CreateConfigData,
  type UpdateConfigData
} from "./useITSMDynamicConfig";

// SLA
export * from './useSLAPolicies';

// CRUD générique
export { useITSMCrud } from './useITSMCrud'; 