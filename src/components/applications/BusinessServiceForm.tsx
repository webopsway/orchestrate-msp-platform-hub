import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import type { CreateBusinessServiceData } from '@/types/application';

interface BusinessServiceFormProps {
  onSubmit: (data: CreateBusinessServiceData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CreateBusinessServiceData>;
}

export function BusinessServiceForm({ onSubmit, onCancel, initialData }: BusinessServiceFormProps) {
  const [formData, setFormData] = useState<CreateBusinessServiceData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    criticality: initialData?.criticality || 'medium',
    business_owner: initialData?.business_owner || '',
    technical_owner: initialData?.technical_owner || '',
    service_level: initialData?.service_level || '',
    metadata: initialData?.metadata || {}
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom du service est requis";
    }

    if (!formData.criticality) {
      newErrors.criticality = "La criticité est requise";
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
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting business service form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du service *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Service de facturation"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="criticality">Criticité *</Label>
              <Select
                value={formData.criticality}
                onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => 
                  setFormData({ ...formData, criticality: value })
                }
              >
                <SelectTrigger className={errors.criticality ? "border-destructive" : ""}>
                  <SelectValue placeholder="Sélectionner la criticité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
              {errors.criticality && (
                <p className="text-sm text-destructive">{errors.criticality}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description du service métier..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_owner">Propriétaire métier</Label>
              <Input
                id="business_owner"
                value={formData.business_owner}
                onChange={(e) => setFormData({ ...formData, business_owner: e.target.value })}
                placeholder="Ex: Jean Dupont"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="technical_owner">Propriétaire technique</Label>
              <Input
                id="technical_owner"
                value={formData.technical_owner}
                onChange={(e) => setFormData({ ...formData, technical_owner: e.target.value })}
                placeholder="Ex: Marie Martin"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_level">Niveau de service</Label>
            <Input
              id="service_level"
              value={formData.service_level}
              onChange={(e) => setFormData({ ...formData, service_level: e.target.value })}
              placeholder="Ex: 99.9% de disponibilité"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Création..." : "Créer le service"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}