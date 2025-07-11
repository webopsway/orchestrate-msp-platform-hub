// Composants communs existants
export { PageHeader } from "./PageHeader";
export { SearchAndFilters } from "./SearchAndFilters";
export { DataGrid } from "./DataGrid";
export { EmptyState } from "./EmptyState";
export { ActionCard } from "./ActionCard";
export { StatsCard } from "./StatsCard";
export { QuickActionButton } from "./QuickActionButton";

// Composants CRUD
export { CRUDTable } from "./CRUDTable";
export { ConfirmDialog, DeleteConfirmDialog, DeactivateConfirmDialog, ArchiveConfirmDialog } from "./ConfirmDialog";

// Nouveaux composants CRUD réutilisables
export { DetailDialog } from './DetailDialog';
export { EditDialog } from './EditDialog';
export { CreateDialog } from './CreateDialog';
export { DeleteDialog } from './DeleteDialog';
export { ActionButtons, useStandardActions } from './ActionButtons';

export type { DetailField, DetailSection } from './DetailDialog';
export type { EditField, EditSection } from './EditDialog';
export type { CreateField, CreateSection } from './CreateDialog';
export type { DeleteDialogField } from './DeleteDialog';
export type { ActionButton } from './ActionButtons';

// Composants RBAC
export * from "../rbac";