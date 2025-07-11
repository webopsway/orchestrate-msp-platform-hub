import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const serviceRequestSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  impact: z.enum(["low", "medium", "high", "critical"]),
  service_category: z.string().min(1, "La catégorie est requise"),
  due_date: z.date().optional()
});

type ServiceRequestFormData = z.infer<typeof serviceRequestSchema>;

interface ServiceRequestFormProps {
  initialData?: Partial<ServiceRequestFormData>;
  onSubmit: (data: ServiceRequestFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ServiceRequestForm = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}: ServiceRequestFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ServiceRequestFormData>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      priority: initialData?.priority || "medium",
      urgency: initialData?.urgency || "medium",
      impact: initialData?.impact || "medium",
      service_category: initialData?.service_category || "general",
      due_date: initialData?.due_date
    }
  });

  const handleSubmit = async (data: ServiceRequestFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const serviceCategories = [
    { value: "general", label: "Général" },
    { value: "hardware", label: "Matériel" },
    { value: "software", label: "Logiciel" },
    { value: "network", label: "Réseau" },
    { value: "access", label: "Accès / Permissions" },
    { value: "training", label: "Formation" },
    { value: "procurement", label: "Approvisionnement" },
    { value: "maintenance", label: "Maintenance" }
  ];

  const priorityOptions = [
    { value: "low", label: "Basse", color: "text-blue-600" },
    { value: "medium", label: "Moyenne", color: "text-yellow-600" },
    { value: "high", label: "Haute", color: "text-orange-600" },
    { value: "critical", label: "Critique", color: "text-red-600" }
  ];

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Titre */}
        <div className="md:col-span-2">
          <Label htmlFor="title">Titre *</Label>
          <Input
            id="title"
            {...form.register("title")}
            placeholder="Décrivez brièvement votre demande"
            className="mt-1"
          />
          {form.formState.errors.title && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.title.message}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <Label htmlFor="description">Description détaillée</Label>
          <Textarea
            id="description"
            {...form.register("description")}
            placeholder="Décrivez en détail votre demande de service..."
            rows={4}
            className="mt-1"
          />
        </div>

        {/* Catégorie de service */}
        <div>
          <Label>Catégorie de service *</Label>
          <Select
            value={form.watch("service_category")}
            onValueChange={(value) => form.setValue("service_category", value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Sélectionner une catégorie" />
            </SelectTrigger>
            <SelectContent>
              {serviceCategories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date d'échéance */}
        <div>
          <Label>Date d'échéance souhaitée</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal mt-1",
                  !form.watch("due_date") && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.watch("due_date") ? (
                  format(form.watch("due_date")!, "PPP", { locale: fr })
                ) : (
                  "Sélectionner une date"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={form.watch("due_date")}
                onSelect={(date) => form.setValue("due_date", date)}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Priorité */}
        <div>
          <Label>Priorité *</Label>
          <Select
            value={form.watch("priority")}
            onValueChange={(value) => form.setValue("priority", value as any)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Sélectionner la priorité" />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className={option.color}>{option.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Urgence */}
        <div>
          <Label>Urgence *</Label>
          <Select
            value={form.watch("urgency")}
            onValueChange={(value) => form.setValue("urgency", value as any)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Sélectionner l'urgence" />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className={option.color}>{option.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Impact */}
        <div>
          <Label>Impact *</Label>
          <Select
            value={form.watch("impact")}
            onValueChange={(value) => form.setValue("impact", value as any)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Sélectionner l'impact" />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className={option.color}>{option.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting ? "Sauvegarde..." : initialData ? "Modifier" : "Créer"}
        </Button>
      </div>
    </form>
  );
};