import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIncidents } from "@/hooks/useIncidents";
import { useGlobalITSMConfig } from "@/hooks/useGlobalITSMConfig";
import { ITSMBadge } from "./ITSMBadge";

interface IncidentStatusUpdateProps {
  incidentId: string;
  currentStatus: string;
  onStatusUpdated: () => void;
}

export function IncidentStatusUpdate({ incidentId, currentStatus, onStatusUpdated }: IncidentStatusUpdateProps) {
  const { updateStatus } = useIncidents();
  const [isUpdating, setIsUpdating] = useState(false);
  const { data: statuses = [] } = useGlobalITSMConfig('statuses', 'incident');

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
          <ITSMBadge type="status" value={currentStatus} category="incident" />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {statuses.map((status) => (
          <SelectItem key={status.config_key} value={status.config_key}>
            <ITSMBadge type="status" value={status.config_key} category="incident" />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 