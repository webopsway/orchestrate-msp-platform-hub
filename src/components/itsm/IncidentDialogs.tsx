import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IncidentForm } from "@/components/forms/IncidentForm";
import { IncidentDetailView } from "@/components/itsm/IncidentDetailView";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import type { Incident, CreateIncidentData, UpdateIncidentData } from "@/types/incident";

interface CreateIncidentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateIncidentData) => Promise<boolean>;
}

export function CreateIncidentDialog({ isOpen, onClose, onSubmit }: CreateIncidentDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un incident</DialogTitle>
        </DialogHeader>
        <IncidentForm
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

interface EditIncidentDialogProps {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateIncidentData) => Promise<boolean>;
}

export function EditIncidentDialog({ incident, isOpen, onClose, onSubmit }: EditIncidentDialogProps) {
  if (!incident) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'incident</DialogTitle>
        </DialogHeader>
        <IncidentForm
          initialData={incident}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

interface ViewIncidentDialogProps {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ViewIncidentDialog({ incident, isOpen, onClose }: ViewIncidentDialogProps) {
  if (!incident) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails de l'incident</DialogTitle>
        </DialogHeader>
        <IncidentDetailView incident={incident} />
      </DialogContent>
    </Dialog>
  );
}

interface DeleteIncidentDialogProps {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => Promise<boolean>;
}

export function DeleteIncidentDialog({ incident, isOpen, onClose, onDelete }: DeleteIncidentDialogProps) {
  if (!incident) return null;

  return (
    <DeleteDialog
      isOpen={isOpen}
      onClose={onClose}
      onDelete={onDelete}
      title="Supprimer l'incident"
      itemName={`l'incident "${incident.title}"`}
    />
  );
} 