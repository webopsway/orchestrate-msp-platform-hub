// Configuration
export { ITSM_CONFIG, useITSMCONFIG, getITSMCONFIGValue } from "./config";

// Types
export type * from "@/types/itsm";
export type * from "@/lib/itsmValidation";

// Services
export * from "@/services/itsm";

// Hooks
export * from "@/hooks/itsm";
export { useITSMItems } from "@/hooks/useITSMItems";

// Composants
export * from "@/components/itsm/components";
export { ITSMDashboard } from "@/components/itsm/ITSMDashboard";

// Validation
export * from "@/lib/itsmValidation";

// Pages
export { default as ITSMIncidents } from "@/pages/ITSM/ITSMIncidents";
export { default as ITSMChanges } from "@/pages/ITSM/ITSMChanges"; 