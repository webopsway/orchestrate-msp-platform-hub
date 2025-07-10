import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Plus, 
  Save, 
  Loader2,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

interface Field {
  key: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'switch' | 'date' | 'datetime' | 'file' | 'json' | 'tags';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  defaultValue?: any;
  disabled?: boolean;
  hidden?: boolean;
  dependsOn?: {
    field: string;
    value: any;
  };
  group?: string;
  order?: number;
}

interface CRUDFormProps {
  title: string;
  description?: string;
  fields: Field[];
  data?: any;
  loading?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
  mode?: 'create' | 'edit' | 'view';
  validation?: (data: any) => { isValid: boolean; errors: Record<string, string> };
  tabs?: {
    id: string;
    label: string;
    fields: string[];
  }[];
}

export const CRUDForm = ({
  title,
  description,
  fields,
  data = {},
  loading = false,
  open,
  onOpenChange,
  onSubmit,
  onCancel,
  mode = 'create',
  validation,
  tabs
}: CRUDFormProps) => {
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialiser les données du formulaire
  useEffect(() => {
    if (open) {
      const initialData = { ...data };
      
      // Ajouter les valeurs par défaut pour les champs manquants
      fields.forEach(field => {
        if (initialData[field.key] === undefined && field.defaultValue !== undefined) {
          initialData[field.key] = field.defaultValue;
        }
      });
      
      setFormData(initialData);
      setErrors({});
    }
  }, [open, data, fields]);

  // Validation en temps réel
  const validateField = (key: string, value: any): string => {
    const field = fields.find(f => f.key === key);
    if (!field) return '';

    // Validation requise
    if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${field.label} est requis`;
    }

    // Validation email
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Format d\'email invalide';
      }
    }

    // Validation nombre
    if (field.type === 'number' && value) {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return `${field.label} doit être un nombre`;
      }
      if (field.validation?.min !== undefined && numValue < field.validation.min) {
        return `${field.label} doit être au moins ${field.validation.min}`;
      }
      if (field.validation?.max !== undefined && numValue > field.validation.max) {
        return `${field.label} doit être au maximum ${field.validation.max}`;
      }
    }

    // Validation pattern
    if (field.validation?.pattern && value) {
      const regex = new RegExp(field.validation.pattern);
      if (!regex.test(value)) {
        return field.validation.message || `${field.label} ne respecte pas le format requis`;
      }
    }

    return '';
  };

  // Gestion des changements de champs
  const handleFieldChange = (key: string, value: any) => {
    const newData = { ...formData, [key]: value };
    setFormData(newData);

    // Validation en temps réel
    const error = validateField(key, value);
    setErrors(prev => ({
      ...prev,
      [key]: error
    }));
  };

  // Gestion de la soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation complète
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      const error = validateField(field.key, formData[field.key]);
      if (error) {
        newErrors[field.key] = error;
      }
    });

    // Validation personnalisée
    if (validation) {
      const validationResult = validation(formData);
      if (!validationResult.isValid) {
        Object.assign(newErrors, validationResult.errors);
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
        toast.success(mode === 'create' ? 'Élément créé avec succès' : 'Élément mis à jour avec succès');
        onOpenChange(false);
      } catch (error) {
        console.error('Erreur lors de la soumission:', error);
        toast.error('Erreur lors de la sauvegarde');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
    }
  };

  // Gestion de l'annulation
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  // Rendu d'un champ
  const renderField = (field: Field) => {
    const value = formData[field.key];
    const error = errors[field.key];
    const isDisabled = field.disabled || mode === 'view';

    // Vérifier les dépendances
    if (field.dependsOn) {
      const dependentValue = formData[field.dependsOn.field];
      if (dependentValue !== field.dependsOn.value) {
        return null;
      }
    }

    const commonProps = {
      id: field.key,
      value: value || '',
      onChange: (e: any) => handleFieldChange(field.key, e.target.value),
      placeholder: field.placeholder,
      disabled: isDisabled,
      className: error ? 'border-red-500' : ''
    };

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              {...commonProps}
              rows={4}
            />
            {error && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {error}
              </p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value || ''}
              onValueChange={(val) => handleFieldChange(field.key, val)}
              disabled={isDisabled}
            >
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {error}
              </p>
            )}
          </div>
        );

      case 'multiselect':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              {field.options?.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.key}-${option.value}`}
                    checked={Array.isArray(value) && value.includes(option.value)}
                    onCheckedChange={(checked) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      const newValues = checked
                        ? [...currentValues, option.value]
                        : currentValues.filter(v => v !== option.value);
                      handleFieldChange(field.key, newValues);
                    }}
                    disabled={isDisabled}
                  />
                  <Label htmlFor={`${field.key}-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </div>
            {error && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {error}
              </p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.key} className="flex items-center space-x-2">
            <Checkbox
              id={field.key}
              checked={value || false}
              onCheckedChange={(checked) => handleFieldChange(field.key, checked)}
              disabled={isDisabled}
            />
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {error && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {error}
              </p>
            )}
          </div>
        );

      case 'switch':
        return (
          <div key={field.key} className="flex items-center justify-between">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Switch
              id={field.key}
              checked={value || false}
              onCheckedChange={(checked) => handleFieldChange(field.key, checked)}
              disabled={isDisabled}
            />
            {error && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {error}
              </p>
            )}
          </div>
        );

      case 'radio':
        return (
          <div key={field.key} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup
              value={value || ''}
              onValueChange={(val) => handleFieldChange(field.key, val)}
              disabled={isDisabled}
            >
              {field.options?.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${field.key}-${option.value}`} />
                  <Label htmlFor={`${field.key}-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
            {error && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {error}
              </p>
            )}
          </div>
        );

      case 'date':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              {...commonProps}
              type="date"
            />
            {error && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {error}
              </p>
            )}
          </div>
        );

      case 'datetime':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              {...commonProps}
              type="datetime-local"
            />
            {error && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {error}
              </p>
            )}
          </div>
        );

      case 'tags':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {Array.isArray(value) && value.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    {!isDisabled && (
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => {
                          const newTags = value.filter((_: string, i: number) => i !== index);
                          handleFieldChange(field.key, newTags);
                        }}
                      />
                    )}
                  </Badge>
                ))}
              </div>
              {!isDisabled && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Ajouter un tag..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        const newTag = input.value.trim();
                        if (newTag && !(Array.isArray(value) && value.includes(newTag))) {
                          const newTags = Array.isArray(value) ? [...value, newTag] : [newTag];
                          handleFieldChange(field.key, newTags);
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      const newTag = input.value.trim();
                      if (newTag && !(Array.isArray(value) && value.includes(newTag))) {
                        const newTags = Array.isArray(value) ? [...value, newTag] : [newTag];
                        handleFieldChange(field.key, newTags);
                        input.value = '';
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            {error && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {error}
              </p>
            )}
          </div>
        );

      default:
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              {...commonProps}
              type={field.type}
            />
            {error && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {error}
              </p>
            )}
          </div>
        );
    }
  };

  // Grouper les champs par onglets ou sections
  const groupedFields = tabs ? 
    tabs.map(tab => ({
      ...tab,
      fields: fields.filter(field => tab.fields.includes(field.key))
    })) :
    [{ id: 'main', label: 'Informations', fields }];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {tabs ? (
            <Tabs defaultValue={tabs[0]?.id} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                {tabs.map(tab => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {groupedFields.map(group => (
                <TabsContent key={group.id} value={group.id} className="space-y-4">
                  {group.fields.map(field => renderField(field))}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fields.map(field => renderField(field))}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Annuler
            </Button>
            {mode !== 'view' && (
              <Button type="submit" disabled={isSubmitting || loading}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {mode === 'create' ? 'Créer' : 'Mettre à jour'}
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 