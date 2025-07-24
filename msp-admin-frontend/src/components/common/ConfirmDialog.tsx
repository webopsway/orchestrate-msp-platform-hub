import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Trash2, 
  XCircle, 
  PowerOff,
  Archive,
  RefreshCw
} from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'warning' | 'info';
  icon?: React.ComponentType<{ className?: string }>;
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
  children?: React.ReactNode;
}

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  variant = "destructive",
  icon: Icon = AlertTriangle,
  onConfirm,
  onCancel,
  loading = false,
  children
}: ConfirmDialogProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          iconColor: 'text-red-500',
          buttonVariant: 'destructive' as const,
          icon: Trash2
        };
      case 'warning':
        return {
          iconColor: 'text-yellow-500',
          buttonVariant: 'default' as const,
          icon: AlertTriangle
        };
      case 'info':
        return {
          iconColor: 'text-blue-500',
          buttonVariant: 'default' as const,
          icon: RefreshCw
        };
      default:
        return {
          iconColor: 'text-red-500',
          buttonVariant: 'destructive' as const,
          icon: Trash2
        };
    }
  };

  const styles = getVariantStyles();
  const IconComponent = Icon || styles.icon;

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full bg-muted ${styles.iconColor}`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {description}
            {children && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                {children}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={loading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Traitement...
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Composants spécialisés pour des cas d'usage courants
export const DeleteConfirmDialog = ({
  open,
  onOpenChange,
  title = "Confirmer la suppression",
  description,
  itemName,
  onConfirm,
  onCancel,
  loading = false
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  itemName?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
}) => (
  <ConfirmDialog
    open={open}
    onOpenChange={onOpenChange}
    title={title}
    description={description || `Êtes-vous sûr de vouloir supprimer "${itemName}" ? Cette action est irréversible.`}
    confirmText="Supprimer"
    cancelText="Annuler"
    variant="destructive"
    icon={Trash2}
    onConfirm={onConfirm}
    onCancel={onCancel}
    loading={loading}
  />
);

export const DeactivateConfirmDialog = ({
  open,
  onOpenChange,
  title = "Confirmer la désactivation",
  description,
  itemName,
  onConfirm,
  onCancel,
  loading = false
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  itemName?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
}) => (
  <ConfirmDialog
    open={open}
    onOpenChange={onOpenChange}
    title={title}
    description={description || `Êtes-vous sûr de vouloir désactiver "${itemName}" ?`}
    confirmText="Désactiver"
    cancelText="Annuler"
    variant="warning"
    icon={PowerOff}
    onConfirm={onConfirm}
    onCancel={onCancel}
    loading={loading}
  />
);

export const ArchiveConfirmDialog = ({
  open,
  onOpenChange,
  title = "Confirmer l'archivage",
  description,
  itemName,
  onConfirm,
  onCancel,
  loading = false
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  itemName?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
}) => (
  <ConfirmDialog
    open={open}
    onOpenChange={onOpenChange}
    title={title}
    description={description || `Êtes-vous sûr de vouloir archiver "${itemName}" ?`}
    confirmText="Archiver"
    cancelText="Annuler"
    variant="warning"
    icon={Archive}
    onConfirm={onConfirm}
    onCancel={onCancel}
    loading={loading}
  />
); 