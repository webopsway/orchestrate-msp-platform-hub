import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye } from "lucide-react";

export interface DetailField {
  key: string;
  label: string;
  type?: 'text' | 'badge' | 'date' | 'email' | 'phone' | 'url' | 'boolean' | 'array' | 'object';
  render?: (value: any) => React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

export interface DetailSection {
  title: string;
  fields: DetailField[];
  icon?: React.ComponentType<any>;
}

interface DetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any;
  sections: DetailSection[];
  className?: string;
}

export function DetailDialog({
  isOpen,
  onClose,
  title,
  data,
  sections,
  className
}: DetailDialogProps) {
  const formatValue = (value: any, field: DetailField) => {
    if (field.render) {
      return field.render(value);
    }

    if (value === null || value === undefined || value === '') {
      return <span className="text-muted-foreground">Non renseigné</span>;
    }

    switch (field.type) {
      case 'badge':
        return (
          <Badge variant={field.variant || 'default'} className={field.className}>
            {value}
          </Badge>
        );
      case 'date':
        return new Date(value).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      case 'email':
        return (
          <a href={`mailto:${value}`} className="text-primary hover:underline">
            {value}
          </a>
        );
      case 'phone':
        return (
          <a href={`tel:${value}`} className="text-primary hover:underline">
            {value}
          </a>
        );
      case 'url':
        return (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {value}
          </a>
        );
      case 'boolean':
        return (
          <Badge variant={value ? 'default' : 'secondary'}>
            {value ? 'Oui' : 'Non'}
          </Badge>
        );
      case 'array':
        if (Array.isArray(value)) {
          return value.length > 0 ? value.join(', ') : <span className="text-muted-foreground">Aucun</span>;
        }
        return value;
      case 'object':
        return <pre className="text-xs bg-muted p-2 rounded">{JSON.stringify(value, null, 2)}</pre>;
      default:
        return value;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[80vh] overflow-y-auto ${className}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {sections.map((section, sectionIndex) => (
            <Card key={sectionIndex}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {section.icon && <section.icon className="h-5 w-5" />}
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.fields.map((field, fieldIndex) => (
                    <div key={fieldIndex} className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground">
                        {field.label}
                      </label>
                      <div className="text-sm">
                        {formatValue(data?.[field.key], field)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}