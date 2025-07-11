import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  XCircle,
  FileText,
  ChevronDown,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface ChangeStatusUpdateProps {
  changeId: string;
  currentStatus: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'implemented' | 'failed';
  onStatusUpdated?: (newStatus: string) => void;
  disabled?: boolean;
}

export function ChangeStatusUpdate({ 
  changeId, 
  currentStatus, 
  onStatusUpdated,
  disabled = false 
}: ChangeStatusUpdateProps) {
  const [updating, setUpdating] = useState(false);

  const statusOptions = [
    { 
      value: 'draft', 
      label: 'Brouillon', 
      icon: FileText, 
      color: 'outline',
      description: 'Changement en cours de rédaction'
    },
    { 
      value: 'pending_approval', 
      label: 'En attente', 
      icon: AlertCircle, 
      color: 'secondary',
      description: 'En attente d\'approbation'
    },
    { 
      value: 'approved', 
      label: 'Approuvé', 
      icon: CheckCircle, 
      color: 'default',
      description: 'Changement approuvé, prêt pour implémentation'
    },
    { 
      value: 'implemented', 
      label: 'Implémenté', 
      icon: CheckCircle, 
      color: 'default',
      description: 'Changement implémenté avec succès'
    },
    { 
      value: 'rejected', 
      label: 'Rejeté', 
      icon: XCircle, 
      color: 'destructive',
      description: 'Changement rejeté'
    },
    { 
      value: 'failed', 
      label: 'Échoué', 
      icon: XCircle, 
      color: 'destructive',
      description: 'Implémentation échouée'
    }
  ];

  const updateStatus = async (newStatus: string) => {
    try {
      setUpdating(true);
      
      const { error } = await supabase
        .from('itsm_change_requests')
        .update({ status: newStatus })
        .eq('id', changeId);

      if (error) throw error;

      toast.success(`Statut mis à jour : ${statusOptions.find(s => s.value === newStatus)?.label}`);
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