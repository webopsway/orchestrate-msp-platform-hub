// Configuration
export { ITSM_CONFIG } from "./config";
export type { IncidentStatus, IncidentPriority, ChangeStatus, ChangeType } from "./config";

// Types
export type * from "@/types/itsm";

// Services
export * from "@/services/itsm";

// Hooks
export * from "@/hooks/itsm";

// Composants
export * from "@/components/itsm/components";

// Pages
export { default as ITSMIncidents } from "@/pages/ITSM/ITSMIncidents";
export { default as ITSMChanges } from "@/pages/ITSM/ITSMChanges"; 