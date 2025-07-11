import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export interface CreateField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'email' | 'tel' | 'url' | 'number' | 'password' | 'select' | 'boolean' | 'date' | 'tags';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  defaultValue?: any;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  className?: string;
  description?: string;
}

export interface CreateSection {
  title: string;
  fields: CreateField[];
  icon?: React.ComponentType<any>;
  className?: string;
}

interface CreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => Promise<boolean>;
  title: string;
  sections: CreateSection[];
  loading?: boolean;
  className?: string;
  resetOnSuccess?: boolean;
}

export function CreateDialog({
  isOpen,
  onClose,
  onCreate,
  title,
  sections,
  loading = false,
  className,
  resetOnSuccess = true
}: CreateDialogProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with default values
  useEffect(() => {
    const defaultData: Record<string, any> = {};
    sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.defaultValue !== undefined) {
          defaultData[field.key] = field.defaultValue;
        }
      });
    });
    setFormData(defaultData);
  }, [sections]);

  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const validateField = (field: CreateField, value: any): string => {
    if (field.required && (!value || value === '')) {
      return `${field.label} est requis`;
    }

    if (field.validation) {
      if (field.validation.min && value && value.length < field.validation.min) {
        return `${field.label} doit contenir au moins ${field.validation.min} caractères`;
      }
      if (field.validation.max && value && value.length > field.validation.max) {
        return `${field.label} ne peut pas dépasser ${field.validation.max} caractères`;
      }
      if (field.validation.pattern && value) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(value)) {
          return field.validation.message || `${field.label} n'est pas valide`;
        }
      }
    }

    return '';
  };

  const handleCreate = async () => {
    // Validate all fields
    const newErrors: Record<string, string> = {};
    sections.forEach(section => {
      section.fields.forEach(field => {
        const error = validateField(field, formData[field.key]);
        if (error) {
          newErrors[field.key] = error;
        }
      });
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const success = await onCreate(formData);
    if (success) {
      if (resetOnSuccess) {
        // Reset form to default values
        const defaultData: Record<string, any> = {};
        sections.forEach(section => {
          section.fields.forEach(field => {
            if (field.defaultValue !== undefined) {
              defaultData[field.key] = field.defaultValue;
            }
          });
        });
        setFormData(defaultData);
        setErrors({});
      }
      onClose();
    }
  };

  const addTag = (fieldKey: string, tag: string) => {
    if (!tag.trim()) return;
    const currentTags = formData[fieldKey] || [];
    if (!currentTags.includes(tag.trim())) {
      handleFieldChange(fieldKey, [...currentTags, tag.trim()]);
    }
  };

  const removeTag = (fieldKey: string, tagToRemove: string) => {
    const currentTags = formData[fieldKey] || [];
    handleFieldChange(fieldKey, currentTags.filter(tag => tag !== tagToRemove));
  };

  const renderField = (field: CreateField) => {
    const value = formData[field.key];
    const error = errors[field.key];

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            disabled={field.disabled}
            className={cn(error && "border-destructive", field.className)}
          />
        );

      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={(val) => handleFieldChange(field.key, val)}
            disabled={field.disabled}
          >
            <SelectTrigger className={cn(error && "border-destructive", field.className)}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={value || false}
              onCheckedChange={(checked) => handleFieldChange(field.key, checked)}
              disabled={field.disabled}
            />
            <Label className="text-sm text-muted-foreground">
              {value ? 'Activé' : 'Désactivé'}
            </Label>
          </div>
        );

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground",
                  error && "border-destructive",
                  field.className
                )}
                disabled={field.disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP", { locale: fr }) : field.placeholder}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => handleFieldChange(field.key, date?.toISOString())}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        );

      case 'tags':
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {(value || []).map((tag: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                  <X 
                    className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => removeTag(field.key, tag)}
                  />
                </Badge>
              ))}
            </div>
            <Input
              placeholder={field.placeholder}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag(field.key, e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              disabled={field.disabled}
              className={cn(error && "border-destructive", field.className)}
            />
          </div>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value ? Number(e.target.value) : '')}
            placeholder={field.placeholder}
            disabled={field.disabled}
            className={cn(error && "border-destructive", field.className)}
          />
        );

      default:
        return (
          <Input
            type={field.type}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            disabled={field.disabled}
            className={cn(error && "border-destructive", field.className)}
          />
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[80vh] overflow-y-auto ${className}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {sections.map((section, sectionIndex) => (
            <Card key={sectionIndex} className={section.className}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {section.icon && <section.icon className="h-5 w-5" />}
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.fields.map((field, fieldIndex) => (
                    <div key={fieldIndex} className="space-y-2">
                      <Label htmlFor={field.key} className="text-sm font-medium">
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      {renderField(field)}
                      {field.description && (
                        <p className="text-xs text-muted-foreground">{field.description}</p>
                      )}
                      {errors[field.key] && (
                        <p className="text-xs text-destructive">{errors[field.key]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? 'Création...' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}