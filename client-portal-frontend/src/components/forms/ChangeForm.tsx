import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import type { Change, CreateChangeData, UpdateChangeData } from "@/types/change";

interface ChangeFormProps {
  initialData?: Change;
  onSubmit: (data: CreateChangeData | UpdateChangeData) => Promise<boolean>;
  onCancel: () => void;
}

export function ChangeForm({ initialData, onSubmit, onCancel }: ChangeFormProps) {
  const [formData, setFormData] = useState<CreateChangeData>({
    title: "",
    description: "",
    change_type: "standard",
    status: "draft"
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description,
        change_type: initialData.change_type,
        status: initialData.status,
        assigned_to: initialData.assigned_to,
        scheduled_date: initialData.scheduled_date
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

    if (!formData.change_type) {
      newErrors.change_type = "Le type de changement est requis";
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
      console.error('Error submitting change form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
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
                placeholder="Titre du changement"
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="change_type" className="text-sm font-medium">
                Type de changement *
              </Label>
              <Select
                value={formData.change_type}
                onValueChange={(value) => handleFieldChange("change_type", value)}
              >
                <SelectTrigger className={errors.change_type ? "border-destructive" : ""}>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emergency">Urgence</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                </SelectContent>
              </Select>
              {errors.change_type && (
                <p className="text-xs text-destructive">{errors.change_type}</p>
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
                placeholder="Description détaillée du changement"
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
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="pending_approval">En attente d'approbation</SelectItem>
                  <SelectItem value="approved">Approuvé</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                  <SelectItem value="implemented">Implémenté</SelectItem>
                  <SelectItem value="failed">Échoué</SelectItem>
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

            <div className="space-y-2">
              <Label htmlFor="scheduled_date" className="text-sm font-medium">
                Date prévue
              </Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date || ""}
                onChange={(e) => handleFieldChange("scheduled_date", e.target.value)}
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