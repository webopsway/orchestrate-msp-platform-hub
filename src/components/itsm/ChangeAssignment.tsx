import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import { useChanges } from "@/hooks/useChanges";

interface ChangeAssignmentProps {
  changeId: string;
  currentAssignee?: string;
  onAssigned: () => void;
}

export function ChangeAssignment({ changeId, currentAssignee, onAssigned }: ChangeAssignmentProps) {
  const { assignChange } = useChanges();
  const [isUpdating, setIsUpdating] = useState(false);
  const [assigneeId, setAssigneeId] = useState(currentAssignee || "");

  const handleAssign = async () => {
    if (assigneeId === currentAssignee) return;
    
    setIsUpdating(true);
    try {
      const success = await assignChange(changeId, assigneeId || null);
      if (success) {
        onAssigned();
      }
    } catch (error) {
      console.error('Error assigning change:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <User className="h-4 w-4 text-muted-foreground" />
      <Input
        value={assigneeId}
        onChange={(e) => setAssigneeId(e.target.value)}
        placeholder="ID utilisateur"
        className="w-24"
        onBlur={handleAssign}
        disabled={isUpdating}
      />
    </div>
  );
}