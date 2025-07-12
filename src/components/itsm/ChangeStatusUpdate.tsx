import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, AlertCircle, Info, XCircle, FileText, Clock } from "lucide-react";
import { useChanges } from "@/hooks/useChanges";

interface ChangeStatusUpdateProps {
  changeId: string;
  currentStatus: string;
  onStatusUpdated: () => void;
}

export function ChangeStatusUpdate({ changeId, currentStatus, onStatusUpdated }: ChangeStatusUpdateProps) {
  const { updateStatus } = useChanges();
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "implemented":
        return "default";
      case "approved":
        return "secondary";
      case "pending_approval":
        return "outline";
      case "draft":
        return "outline";
      case "failed":
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "implemented":
        return <CheckCircle className="h-4 w-4" />;
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "pending_approval":
        return <Clock className="h-4 w-4" />;
      case "draft":
        return <FileText className="h-4 w-4" />;
      case "failed":
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

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
          <div className="flex items-center gap-1">
            {getStatusIcon(currentStatus)}
            <span className="capitalize">{currentStatus.replace('_', ' ')}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="draft">
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Brouillon
          </div>
        </SelectItem>
        <SelectItem value="pending_approval">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            En attente
          </div>
        </SelectItem>
        <SelectItem value="approved">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            Approuvé
          </div>
        </SelectItem>
        <SelectItem value="rejected">
          <div className="flex items-center gap-1">
            <XCircle className="h-4 w-4" />
            Rejeté
          </div>
        </SelectItem>
        <SelectItem value="implemented">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            Implémenté
          </div>
        </SelectItem>
        <SelectItem value="failed">
          <div className="flex items-center gap-1">
            <XCircle className="h-4 w-4" />
            Échoué
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}