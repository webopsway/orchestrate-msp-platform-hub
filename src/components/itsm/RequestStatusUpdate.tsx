import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  ChevronDown,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface RequestStatusUpdateProps {
  requestId: string;
  currentStatus: 'open' | 'in_progress' | 'resolved' | 'closed';
  onStatusUpdated?: (newStatus: string) => void;
  disabled?: boolean;
}

export function RequestStatusUpdate({ 
  requestId, 
  currentStatus, 
  onStatusUpdated,
  disabled = false 
}: RequestStatusUpdateProps) {
  const [updating, setUpdating] = useState(false);

  const statusOptions = [
    { 
      value: 'open', 
      label: 'Ouvert', 
      icon: Info, 
      color: 'outline',
      description: 'Demande soumise, en attente de traitement'
    },
    { 
      value: 'in_progress', 
      label: 'En cours', 
      icon: AlertCircle, 
      color: 'secondary',
      description: 'Demande en cours de traitement'
    },
    { 
      value: 'resolved', 
      label: 'Résolu', 
      icon: CheckCircle, 
      color: 'default',
      description: 'Demande traitée, en attente de validation'
    },
    { 
      value: 'closed', 
      label: 'Fermé', 
      icon: CheckCircle, 
      color: 'default',
      description: 'Demande fermée définitivement'
    }
  ];

  const updateStatus = async (newStatus: string) => {
    try {
      setUpdating(true);
      
      // Note: Comme la table requests n'existe pas encore, on simule
      toast.info('Module en cours de développement');
      onStatusUpdated?.(newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdating(false);
    }
  };

  const currentOption = statusOptions.find(option => option.value === currentStatus);
  const CurrentIcon = currentOption?.icon || Info;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={disabled || updating}
          className="gap-2"
        >
          {updating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CurrentIcon className="h-4 w-4" />
          )}
          <Badge variant={currentOption?.color as any}>
            {currentOption?.label}
          </Badge>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-64">
        {statusOptions.map((option) => {
          const OptionIcon = option.icon;
          const isCurrentStatus = option.value === currentStatus;
          
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => !isCurrentStatus && updateStatus(option.value)}
              disabled={isCurrentStatus || updating}
              className={`gap-2 p-3 ${isCurrentStatus ? 'bg-muted' : 'cursor-pointer'}`}
            >
              <OptionIcon className="h-4 w-4" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{option.label}</span>
                  {isCurrentStatus && (
                    <Badge variant="secondary" className="text-xs">
                      Actuel
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {option.description}
                </p>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}