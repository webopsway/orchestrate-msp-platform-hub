import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useGlobalITSMConfig } from "@/hooks/useGlobalITSMConfig";
import { ITSMBadge } from "@/components/itsm/ITSMBadge";
import type { Incident, CreateIncidentData, UpdateIncidentData } from "@/types/incident";

interface IncidentFormProps {
  initialData?: Incident;
  onSubmit: (data: CreateIncidentData | UpdateIncidentData) => Promise<boolean>;
  onCancel: () => void;
}

export function IncidentForm({ initialData, onSubmit, onCancel }: IncidentFormProps) {
  const [formData, setFormData] = useState<CreateIncidentData>({
    title: "",
    description: "",
    priority: "medium",
    status: "open"
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { data: priorities = [] } = useGlobalITSMConfig('priorities');
  const { data: statuses = [] } = useGlobalITSMConfig('statuses', 'incident');

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description,
        priority: initialData.priority,
        status: initialData.status,
        assigned_to: initialData.assigned_to
      });
    }
  }, [initialData]);

  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Le titre est requis";
    }

    if (!formData.description.trim()) {
      newErrors.description = "La description est requise";
    }

    if (!formData.priority) {
      newErrors.priority = "La priorité est requise";
    }

    if (!formData.status) {
      newErrors.status = "Le statut est requis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const success = await onSubmit(formData);
      if (success) {
        // Form will be closed by parent component
      }
    } catch (error) {
      console.error('Error submitting incident form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Informations générales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Titre *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                placeholder="Titre de l'incident"
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium">
                Priorité *
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleFieldChange("priority", value)}
              >
                <SelectTrigger className={errors.priority ? "border-destructive" : ""}>
                  <SelectValue placeholder="Sélectionner une priorité" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.config_key} value={priority.config_key}>
                      <ITSMBadge type="priority" value={priority.config_key} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.priority && (
                <p className="text-xs text-destructive">{errors.priority}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                placeholder="Description détaillée de l'incident"
                rows={4}
                className={errors.description ? "border-destructive" : ""}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">
                Statut *
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleFieldChange("status", value)}
              >
                <SelectTrigger className={errors.status ? "border-destructive" : ""}>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.config_key} value={status.config_key}>
                      <ITSMBadge type="status" value={status.config_key} category="incident" />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-xs text-destructive">{errors.status}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_to" className="text-sm font-medium">
                Assigné à
              </Label>
              <Input
                id="assigned_to"
                value={formData.assigned_to || ""}
                onChange={(e) => handleFieldChange("assigned_to", e.target.value)}
                placeholder="ID de l'utilisateur assigné"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Enregistrement...' : (initialData ? 'Modifier' : 'Créer')}
        </Button>
      </div>
    </form>
  );
} 