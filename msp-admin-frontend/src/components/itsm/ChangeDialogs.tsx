import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChangeForm } from "@/components/forms/ChangeForm";
import { ChangeDetailView } from "@/components/itsm/ChangeDetailView";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import type { Change, CreateChangeData, UpdateChangeData } from "@/types/change";

interface CreateChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateChangeData) => Promise<boolean>;
}

export function CreateChangeDialog({ isOpen, onClose, onSubmit }: CreateChangeDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un changement</DialogTitle>
        </DialogHeader>
        <ChangeForm
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

interface EditChangeDialogProps {
  change: Change | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateChangeData) => Promise<boolean>;
}

export function EditChangeDialog({ change, isOpen, onClose, onSubmit }: EditChangeDialogProps) {
  if (!change) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le changement</DialogTitle>
        </DialogHeader>
        <ChangeForm
          initialData={change}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

interface ViewChangeDialogProps {
  change: Change | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ViewChangeDialog({ change, isOpen, onClose }: ViewChangeDialogProps) {
  if (!change) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails du changement</DialogTitle>
        </DialogHeader>
        <ChangeDetailView change={change} />
      </DialogContent>
    </Dialog>
  );
}

interface DeleteChangeDialogProps {
  change: Change | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => Promise<boolean>;
}

export function DeleteChangeDialog({ change, isOpen, onClose, onDelete }: DeleteChangeDialogProps) {
  if (!change) return null;

  return (
    <DeleteDialog
      isOpen={isOpen}
      onClose={onClose}
      onDelete={onDelete}
      title="Supprimer le changement"
      itemName={`le changement "${change.title}"`}
    />
  );
} 