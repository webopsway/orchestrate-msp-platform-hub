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
  ChevronDown,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface QuickStatusUpdateProps {
  incidentId: string;
  currentStatus: 'open' | 'in_progress' | 'resolved' | 'closed';
  onStatusUpdated?: (newStatus: string) => void;
  disabled?: boolean;
}

export function QuickStatusUpdate({ 
  incidentId, 
  currentStatus, 
  onStatusUpdated,
  disabled = false 
}: QuickStatusUpdateProps) {
  const [updating, setUpdating] = useState(false);

  const statusOptions = [
    { 
      value: 'open', 
      label: 'Ouvert', 
      icon: Info, 
      color: 'outline',
      description: 'Incident signalé, en attente de traitement'
    },
    { 
      value: 'in_progress', 
      label: 'En cours', 
      icon: AlertCircle, 
      color: 'secondary',
      description: 'Incident en cours de traitement'
    },
    { 
      value: 'resolved', 
      label: 'Résolu', 
      icon: CheckCircle, 
      color: 'default',
      description: 'Incident résolu, en attente de validation'
    },
    { 
      value: 'closed', 
      label: 'Fermé', 
      icon: XCircle, 
      color: 'default',
      description: 'Incident fermé définitivement'
    }
  ];

  const updateStatus = async (newStatus: string) => {
    try {
      setUpdating(true);
      
      const updateData: any = { status: newStatus };
      
      // Si on passe à résolu, mettre à jour la date de résolution
      if (newStatus === 'resolved' && currentStatus !== 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }
      
      // Si on repasse à un autre statut depuis résolu, supprimer la date de résolution
      if (newStatus !== 'resolved' && currentStatus === 'resolved') {
        updateData.resolved_at = null;
      }

      const { error } = await supabase
        .from('itsm_incidents')
        .update(updateData)
        .eq('id', incidentId);

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