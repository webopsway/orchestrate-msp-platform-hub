import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useGlobalITSMConfig } from "@/hooks/useGlobalITSMConfig";
import { ITSMBadge } from "./ITSMBadge";

interface RequestStatusUpdateProps {
  requestId: string;
  currentStatus: 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled';
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
  const { data: statuses = [] } = useGlobalITSMConfig('statuses', 'request');

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
            <ITSMBadge type="status" value={currentStatus} category="request" />
          )}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-64">
        {statuses.map((status) => {
          const isCurrentStatus = status.config_key === currentStatus;
          
          return (
            <DropdownMenuItem
              key={status.config_key}
              onClick={() => !isCurrentStatus && updateStatus(status.config_key)}
              disabled={isCurrentStatus || updating}
              className={`gap-2 p-3 ${isCurrentStatus ? 'bg-muted' : 'cursor-pointer'}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <ITSMBadge type="status" value={status.config_key} category="request" />
                  {isCurrentStatus && (
                    <Badge variant="secondary" className="text-xs">
                      Actuel
                    </Badge>
                  )}
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}