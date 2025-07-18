import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import type { CreateApplicationData } from '@/types/application';

interface ApplicationFormProps {
  onSubmit: (data: CreateApplicationData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CreateApplicationData>;
}

export function ApplicationForm({ onSubmit, onCancel, initialData }: ApplicationFormProps) {
  const [formData, setFormData] = useState<CreateApplicationData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    version: initialData?.version || '',
    application_type: initialData?.application_type || 'web',
    technology_stack: initialData?.technology_stack || [],
    repository_url: initialData?.repository_url || '',
    documentation_url: initialData?.documentation_url || '',
    business_services: initialData?.business_services || [],
    metadata: initialData?.metadata || {}
  });

  const [newTech, setNewTech] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom de l'application est requis";
    }

    if (!formData.application_type) {
      newErrors.application_type = "Le type d'application est requis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addTechnology = () => {
    if (newTech.trim() && !formData.technology_stack?.includes(newTech.trim())) {
      setFormData({
        ...formData,
        technology_stack: [...(formData.technology_stack || []), newTech.trim()]
      });
      setNewTech('');
    }
  };

  const removeTechnology = (tech: string) => {
    setFormData({
      ...formData,
      technology_stack: formData.technology_stack?.filter(t => t !== tech) || []
    });
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
      console.error('Error submitting application form:', error);
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
              <Label htmlFor="name">Nom de l'application *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Application CRM"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="application_type">Type d'application *</Label>
              <Select
                value={formData.application_type}
                onValueChange={(value: any) => 
                  setFormData({ ...formData, application_type: value })
                }
              >
                <SelectTrigger className={errors.application_type ? "border-destructive" : ""}>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web">Application Web</SelectItem>
                  <SelectItem value="mobile">Application Mobile</SelectItem>
                  <SelectItem value="desktop">Application Desktop</SelectItem>
                  <SelectItem value="service">Service/Microservice</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="database">Base de données</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
              {errors.application_type && (
                <p className="text-sm text-destructive">{errors.application_type}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de l'application..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="Ex: 1.0.0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="repository_url">URL du dépôt</Label>
              <Input
                id="repository_url"
                value={formData.repository_url}
                onChange={(e) => setFormData({ ...formData, repository_url: e.target.value })}
                placeholder="https://github.com/..."
                type="url"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentation_url">URL de la documentation</Label>
            <Input
              id="documentation_url"
              value={formData.documentation_url}
              onChange={(e) => setFormData({ ...formData, documentation_url: e.target.value })}
              placeholder="https://docs.example.com/..."
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label>Stack technologique</Label>
            <div className="flex gap-2">
              <Input
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                placeholder="Ex: React, Node.js, PostgreSQL"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
              />
              <Button type="button" onClick={addTechnology} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {formData.technology_stack && formData.technology_stack.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.technology_stack.map((tech, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tech}
                    <button
                      type="button"
                      onClick={() => removeTechnology(tech)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Création..." : "Créer l'application"}
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