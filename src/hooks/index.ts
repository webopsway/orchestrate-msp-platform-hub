export { useIncidents } from "./useIncidents";
export { useChanges } from "./useChanges";
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

export * from './useSLAPolicies';