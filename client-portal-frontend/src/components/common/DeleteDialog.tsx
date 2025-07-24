import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Trash2, AlertTriangle, Info } from "lucide-react";

export interface DeleteDialogField {
  key: string;
  label: string;
  render?: (value: any) => React.ReactNode;
}

interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => Promise<boolean>;
  title: string;
  itemName: string;
  data?: any;
  displayFields?: DeleteDialogField[];
  warningMessage?: string;
  confirmText?: string;
  loading?: boolean;
  variant?: 'destructive' | 'warning';
  className?: string;
}

export function DeleteDialog({
  isOpen,
  onClose,
  onDelete,
  title,
  itemName,
  data,
  displayFields,
  warningMessage,
  confirmText = "Cette action est irréversible.",
  loading = false,
  variant = 'destructive',
  className
}: DeleteDialogProps) {
  const handleDelete = async () => {
    const success = await onDelete();
    if (success) {
      onClose();
    }
  };

  const renderFieldValue = (field: DeleteDialogField, value: any) => {
    if (field.render) {
      return field.render(value);
    }

    if (value === null || value === undefined || value === '') {
      return <span className="text-muted-foreground">Non renseigné</span>;
    }

    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Oui' : 'Non'}
        </Badge>
      );
    }

    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : <span className="text-muted-foreground">Aucun</span>;
    }

    return value;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-md ${className}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Êtes-vous sûr de vouloir supprimer <strong>{itemName}</strong> ?
            </AlertDescription>
          </Alert>

          {data && displayFields && displayFields.length > 0 && (
            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Info className="h-4 w-4" />
                Informations de l'élément
              </div>
              {displayFields.map((field, index) => (
                <div key={index} className="flex justify-between items-start text-sm">
                  <span className="font-medium">{field.label}:</span>
                  <span className="text-right max-w-48 break-words">
                    {renderFieldValue(field, data[field.key])}
                  </span>
                </div>
              ))}
            </div>
          )}

          {warningMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {warningMessage}
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {confirmText}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading ? 'Suppression...' : 'Supprimer définitivement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}