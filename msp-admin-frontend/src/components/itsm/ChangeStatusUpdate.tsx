import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useChanges } from "@/hooks/useChanges";
import { useGlobalITSMConfig } from "@/hooks/useGlobalITSMConfig";
import { ITSMBadge } from "./ITSMBadge";

interface ChangeStatusUpdateProps {
  changeId: string;
  currentStatus: string;
  onStatusUpdated: () => void;
}

export function ChangeStatusUpdate({ changeId, currentStatus, onStatusUpdated }: ChangeStatusUpdateProps) {
  const { updateStatus } = useChanges();
  const [isUpdating, setIsUpdating] = useState(false);
  const { data: statuses = [] } = useGlobalITSMConfig('statuses', 'change');

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;
    
    setIsUpdating(true);
    try {
      const success = await updateStatus(changeId, newStatus as any);
      if (success) {
        onStatusUpdated();
      }
    } catch (error) {
      console.error('Error updating change status:', error);
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
      <SelectTrigger className="w-40">
        <SelectValue>
          <ITSMBadge type="status" value={currentStatus} category="change" />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {statuses.map((status) => (
          <SelectItem key={status.config_key} value={status.config_key}>
            <ITSMBadge type="status" value={status.config_key} category="change" />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}