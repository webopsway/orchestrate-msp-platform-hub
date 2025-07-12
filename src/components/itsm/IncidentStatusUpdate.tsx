import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, AlertCircle, Info, XCircle } from "lucide-react";
import { useIncidents } from "@/hooks/useIncidents";

interface IncidentStatusUpdateProps {
  incidentId: string;
  currentStatus: string;
  onStatusUpdated: () => void;
}

export function IncidentStatusUpdate({ incidentId, currentStatus, onStatusUpdated }: IncidentStatusUpdateProps) {
  const { updateStatus } = useIncidents();
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
      case "closed":
        return "default";
      case "in_progress":
        return "secondary";
      case "open":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
      case "closed":
        return <CheckCircle className="h-4 w-4" />;
      case "in_progress":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;
    
    setIsUpdating(true);
    try {
      const success = await updateStatus(incidentId, newStatus as any);
      if (success) {
        onStatusUpdated();
      }
    } catch (error) {
      console.error('Error updating incident status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Select
      value={currentStatus}
      onValueChange={handleStatusChange}
      disabled={isUpdating}
    >
      <SelectTrigger className="w-32">
        <SelectValue>
          <div className="flex items-center gap-1">
            {getStatusIcon(currentStatus)}
            <span className="capitalize">{currentStatus}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="open">
          <div className="flex items-center gap-1">
            <Info className="h-4 w-4" />
            Ouvert
          </div>
        </SelectItem>
        <SelectItem value="in_progress">
          <div className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            En cours
          </div>
        </SelectItem>
        <SelectItem value="resolved">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            Résolu
          </div>
        </SelectItem>
        <SelectItem value="closed">
          <div className="flex items-center gap-1">
            <XCircle className="h-4 w-4" />
            Fermé
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
} 