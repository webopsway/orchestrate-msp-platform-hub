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
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar, Server, AlertTriangle } from "lucide-react";

interface PatchFormData {
  cloud_asset_id: string;
  description: string;
  patch_type: string;
  scheduled_at: string;
  metadata: {
    severity: string;
    estimated_duration: string;
    requires_reboot: boolean;
    backup_required: boolean;
    rollback_plan: string;
    affected_services: string;
  };
}

interface PatchFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<boolean>;
}

export const PatchForm = ({ initialData, onSubmit }: PatchFormProps) => {
  const [loading, setLoading] = useState(false);
  const [cloudAssets, setCloudAssets] = useState([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    cloud_asset_id: initialData?.cloud_asset_id || "none",
    description: initialData?.description || "",
    patch_type: initialData?.patch_type || "security",
    scheduled_at: initialData?.scheduled_at ? 
      new Date(initialData.scheduled_at).toISOString().slice(0, 16) : "",
    metadata: {
      severity: initialData?.metadata?.severity || "medium",
      estimated_duration: initialData?.metadata?.estimated_duration || "",
      requires_reboot: initialData?.metadata?.requires_reboot || false,
      backup_required: initialData?.metadata?.backup_required || true,
      rollback_plan: initialData?.metadata?.rollback_plan || "",
      affected_services: initialData?.metadata?.affected_services || ""
    }
  });

  useEffect(() => {
    loadCloudAssets();
  }, []);

  const loadCloudAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('cloud_asset')
        .select('id, asset_name, asset_type, region, status')
        .eq('status', 'running')
        .order('asset_name');

      if (error) throw error;
      setCloudAssets(data || []);
    } catch (error) {
      console.error('Error loading cloud assets:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les assets cloud",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('metadata.')) {
      const metadataField = field.replace('metadata.', '');
      setFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [metadataField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = "La description est requise";
    }

    if (formData.cloud_asset_id === "none") {
      newErrors.cloud_asset_id = "Un asset cloud doit être sélectionné";
    }

    if (!formData.scheduled_at) {
      newErrors.scheduled_at = "La date de planification est requise";
    } else {
      const scheduledDate = new Date(formData.scheduled_at);
      const now = new Date();
      if (scheduledDate <= now) {
        newErrors.scheduled_at = "La date doit être dans le futur";
      }
    }

    if (!formData.patch_type) {
      newErrors.patch_type = "Le type de patch est requis";
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
      const submitData = {
        ...formData,
        cloud_asset_id: formData.cloud_asset_id === "none" ? null : formData.cloud_asset_id,
        scheduled_at: new Date(formData.scheduled_at).toISOString(),
        metadata: {
          ...formData.metadata,
          estimated_duration: formData.metadata.estimated_duration
        }
      };
      
      const success = await onSubmit(submitData);
      
      if (success) {
        // Reset form only if it's a new patch (no initialData)
        if (!initialData) {
          setFormData({
            cloud_asset_id: "none",
            description: "",
            patch_type: "security",
            scheduled_at: "",
            metadata: {
              severity: "medium",
              estimated_duration: "",
              requires_reboot: false,
              backup_required: true,
              rollback_plan: "",
              affected_services: ""
            }
          });
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la soumission",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Asset Cloud */}
        <div className="space-y-2">
          <Label htmlFor="cloud_asset_id">Asset Cloud *</Label>
          <Select 
            value={formData.cloud_asset_id} 
            onValueChange={(value) => handleInputChange('cloud_asset_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un asset" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sélectionner un asset</SelectItem>
              {cloudAssets.map((asset) => (
                <SelectItem key={asset.id} value={asset.id}>
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{asset.asset_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {asset.asset_type} - {asset.region}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.cloud_asset_id && (
            <p className="text-sm text-destructive">{errors.cloud_asset_id}</p>
          )}
        </div>

        {/* Type de patch */}
        <div className="space-y-2">
          <Label htmlFor="patch_type">Type de patch *</Label>
          <Select 
            value={formData.patch_type} 
            onValueChange={(value) => handleInputChange('patch_type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner le type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="security">Sécurité</SelectItem>
              <SelectItem value="critical">Critique</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="feature">Fonctionnalité</SelectItem>
              <SelectItem value="bugfix">Correction de bug</SelectItem>
            </SelectContent>
          </Select>
          {errors.patch_type && (
            <p className="text-sm text-destructive">{errors.patch_type}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="Description détaillée du patch..."
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date de planification */}
        <div className="space-y-2">
          <Label htmlFor="scheduled_at">Date de planification *</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="scheduled_at"
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) => handleInputChange('scheduled_at', e.target.value)}
              className="pl-10"
            />
          </div>
          {errors.scheduled_at && (
            <p className="text-sm text-destructive">{errors.scheduled_at}</p>
          )}
        </div>

        {/* Sévérité */}
        <div className="space-y-2">
          <Label htmlFor="severity">Sévérité</Label>
          <Select 
            value={formData.metadata.severity} 
            onValueChange={(value) => handleInputChange('metadata.severity', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner la sévérité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Faible</SelectItem>
              <SelectItem value="medium">Moyenne</SelectItem>
              <SelectItem value="high">Élevée</SelectItem>
              <SelectItem value="critical">Critique</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Durée estimée */}
        <div className="space-y-2">
          <Label htmlFor="estimated_duration">Durée estimée (minutes)</Label>
          <Input
            id="estimated_duration"
            type="number"
            placeholder="Ex: 60"
            value={formData.metadata.estimated_duration}
            onChange={(e) => handleInputChange('metadata.estimated_duration', e.target.value)}
            min="1"
          />
        </div>

        {/* Services affectés */}
        <div className="space-y-2">
          <Label htmlFor="affected_services">Services affectés</Label>
          <Input
            id="affected_services"
            placeholder="Ex: Apache, MySQL, Redis"
            value={formData.metadata.affected_services}
            onChange={(e) => handleInputChange('metadata.affected_services', e.target.value)}
          />
        </div>
      </div>

      {/* Plan de rollback */}
      <div className="space-y-2">
        <Label htmlFor="rollback_plan">Plan de rollback</Label>
        <Textarea
          id="rollback_plan"
          placeholder="Procédure en cas d'échec du patch..."
          value={formData.metadata.rollback_plan}
          onChange={(e) => handleInputChange('metadata.rollback_plan', e.target.value)}
          rows={2}
        />
      </div>

      {/* Options */}
      <div className="space-y-3">
        <Label>Options</Label>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.metadata.requires_reboot}
              onChange={(e) => handleInputChange('metadata.requires_reboot', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Redémarrage requis</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.metadata.backup_required}
              onChange={(e) => handleInputChange('metadata.backup_required', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Sauvegarde requise</span>
          </label>
        </div>
      </div>

      {/* Submit button */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Modifier" : "Créer"} le patch
        </Button>
      </div>
    </form>
  );
};