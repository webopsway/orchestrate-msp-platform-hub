// Formulaires
export { IncidentForm } from "@/components/forms/IncidentForm";
export { ChangeForm } from "@/components/forms/ChangeForm";

// Composants de statut
export { IncidentStatusUpdate } from "./IncidentStatusUpdate";
export { ChangeStatusUpdate } from "./ChangeStatusUpdate";

// Composants d'assignation
export { IncidentAssignment } from "./IncidentAssignment";
export { ChangeAssignment } from "./ChangeAssignment";

// Vues détaillées
export { IncidentDetailView } from "./IncidentDetailView";
export { ChangeDetailView } from "./ChangeDetailView";

// Dialogues CRUD
export {
  CreateIncidentDialog,
  EditIncidentDialog,
  ViewIncidentDialog,
  DeleteIncidentDialog
} from "@/components/itsm/IncidentDialogs";

export {
  CreateChangeDialog,
  EditChangeDialog,
  ViewChangeDialog,
  DeleteChangeDialog
} from "@/components/itsm/ChangeDialogs";

// Composants utilitaires
export { ITSMBadge } from "@/components/itsm/ITSMBadge";
export { ITSMConfigManager } from "@/components/itsm/ITSMConfigManager";
export { ITSMDashboard } from "@/components/itsm/ITSMDashboard";

// Composants existants pour compatibilité
export { RequestAssignment } from "./RequestAssignment";
export { RequestStatusUpdate } from "./RequestStatusUpdate";
export { ServiceRequestDetailView } from "./ServiceRequestDetailView";
export { SLAStatusBadge } from "./SLAStatusBadge";
export { CommentsSection } from "./CommentsSection"; 