import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Clock, Users } from "lucide-react";
import { useDynamicITSMPriorities, formatDynamicConfigsForSelect } from "@/hooks";
import { ITSMBadge } from "@/components/itsm/ITSMBadge";
import { useVulnerabilities } from "@/hooks/useVulnerabilities";
import { supabase } from "@/integrations/supabase/client";

interface SecurityIncidentFormProps {
  initialVulnerabilityId?: string;
  initialPatchId?: string;
  onSubmit: (data: any) => Promise<boolean>;
  onCancel: () => void;
}

interface Team {
  id: string;
  name: string;
  organization_id: string;
}

interface PatchSchedule {
  id: string;
  description: string;
  patch_type: string;
  scheduled_at: string;
  cloud_asset: {
    asset_name: string;
    asset_type: string;
  };
}

export function SecurityIncidentForm({ 
  initialVulnerabilityId, 
  initialPatchId, 
  onSubmit, 
  onCancel 
}: SecurityIncidentFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "high",
    vulnerability_id: initialVulnerabilityId || "",
    patch_schedule_id: initialPatchId || "",
    remediation_plan: "",
    asset_owner_team: "",
    estimated_effort: "",
    risk_assessment: "medium"
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [teams, setTeams] = useState<Team[]>([]);
  const [patches, setPatches] = useState<PatchSchedule[]>([]);
  const [selectedVulnerability, setSelectedVulnerability] = useState<any>(null);
  const [selectedPatch, setSelectedPatch] = useState<any>(null);
  
  const { data: priorityConfigs = [] } = useDynamicITSMPriorities();
  const { vulnerabilities } = useVulnerabilities();
  
  const priorities = formatDynamicConfigsForSelect(priorityConfigs);

  // Charger les équipes et patches disponibles
  useEffect(() => {
    loadTeams();
    loadPatches();
  }, []);

  // Charger la vulnérabilité sélectionnée
  useEffect(() => {
    if (formData.vulnerability_id) {
      const vuln = vulnerabilities.find(v => v.id === formData.vulnerability_id);
      setSelectedVulnerability(vuln);
      
      if (vuln && !formData.title) {
        setFormData(prev => ({
          ...prev,
          title: `Incident de sécurité: ${vuln.title}`,
          description: `Incident créé pour la vulnérabilité ${vuln.cve_id || vuln.title}\n\nSévérité: ${vuln.severity}\nDescription: ${vuln.description}`,
          priority: vuln.severity === 'critical' ? 'critical' : vuln.severity === 'high' ? 'high' : 'medium'
        }));
      }
    }
  }, [formData.vulnerability_id, vulnerabilities]);

  // Charger le patch sélectionné
  useEffect(() => {
    if (formData.patch_schedule_id) {
      const patch = patches.find(p => p.id === formData.patch_schedule_id);
      setSelectedPatch(patch);
      
      if (patch && !formData.title) {
        setFormData(prev => ({
          ...prev,
          title: `Incident de sécurité: Patch ${patch.cloud_asset?.asset_name}`,
          description: `Incident créé pour le patch planifié:\n\n${patch.description}\nType: ${patch.patch_type}\nPlanifié: ${new Date(patch.scheduled_at).toLocaleString()}`
        }));
      }
    }
  }, [formData.patch_schedule_id, patches]);

  const loadTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, organization_id')
        .order('name');
      
      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const loadPatches = async () => {
    try {
      const { data, error } = await supabase
        .from('patch_schedules')
        .select(`
          id,
          description,
          patch_type,
          scheduled_at,
          cloud_asset:cloud_asset_id (
            asset_name,
            asset_type
          )
        `)
        .eq('status', 'scheduled')
        .order('scheduled_at');
      
      if (error) throw error;
      setPatches(data || []);
    } catch (error) {
      console.error('Error loading patches:', error);
    }
  };

  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
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

    if (!formData.vulnerability_id && !formData.patch_schedule_id) {
      newErrors.source = "Une vulnérabilité ou un patch doit être sélectionné";
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
        vulnerability_id: formData.vulnerability_id || null,
        patch_schedule_id: formData.patch_schedule_id || null,
        estimated_effort: formData.estimated_effort ? parseInt(formData.estimated_effort) : null,
        asset_owner_team: formData.asset_owner_team || null
      };
      
      const success = await onSubmit(submitData);
      if (success) {
        // Form will be closed by parent component
      }
    } catch (error) {
      console.error('Error submitting security incident form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Source de l'incident */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Source de l'incident
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vulnerability" className="text-sm font-medium">
                Vulnérabilité
              </Label>
              <Select
                value={formData.vulnerability_id}
                onValueChange={(value) => handleFieldChange("vulnerability_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une vulnérabilité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune vulnérabilité</SelectItem>
                  {vulnerabilities.map((vuln) => (
                    <SelectItem key={vuln.id} value={vuln.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {vuln.severity}
                        </Badge>
                        {vuln.title} ({vuln.cve_id})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="patch" className="text-sm font-medium">
                Patch planifié
              </Label>
              <Select
                value={formData.patch_schedule_id}
                onValueChange={(value) => handleFieldChange("patch_schedule_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un patch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun patch</SelectItem>
                  {patches.map((patch) => (
                    <SelectItem key={patch.id} value={patch.id}>
                      <div className="flex flex-col">
                        <span>{patch.cloud_asset?.asset_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {patch.patch_type} - {new Date(patch.scheduled_at).toLocaleDateString()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {errors.source && (
            <p className="text-xs text-destructive mt-2">{errors.source}</p>
          )}

          {/* Affichage des détails de la source sélectionnée */}
          {selectedVulnerability && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Vulnérabilité sélectionnée:</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Titre:</strong> {selectedVulnerability.title}</p>
                <p><strong>Sévérité:</strong> <Badge variant="outline">{selectedVulnerability.severity}</Badge></p>
                {selectedVulnerability.cve_id && (
                  <p><strong>CVE:</strong> {selectedVulnerability.cve_id}</p>
                )}
              </div>
            </div>
          )}

          {selectedPatch && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Patch sélectionné:</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Asset:</strong> {selectedPatch.cloud_asset?.asset_name}</p>
                <p><strong>Type:</strong> {selectedPatch.patch_type}</p>
                <p><strong>Planifié:</strong> {new Date(selectedPatch.scheduled_at).toLocaleString()}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Informations générales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Titre *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                placeholder="Titre de l'incident de sécurité"
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
                    <SelectItem key={priority.value} value={priority.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: priority.color }}
                        />
                        {priority.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.priority && (
                <p className="text-xs text-destructive">{errors.priority}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="risk_assessment" className="text-sm font-medium">
                Évaluation du risque
              </Label>
              <Select
                value={formData.risk_assessment}
                onValueChange={(value) => handleFieldChange("risk_assessment", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Évaluer le risque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyen</SelectItem>
                  <SelectItem value="high">Élevé</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                placeholder="Description détaillée de l'incident de sécurité"
                rows={4}
                className={errors.description ? "border-destructive" : ""}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan de remédiation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Plan de remédiation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="remediation_plan" className="text-sm font-medium">
                Plan de remédiation
              </Label>
              <Textarea
                id="remediation_plan"
                value={formData.remediation_plan}
                onChange={(e) => handleFieldChange("remediation_plan", e.target.value)}
                placeholder="Décrivez le plan de remédiation prévu..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_effort" className="text-sm font-medium">
                Effort estimé (heures)
              </Label>
              <Input
                id="estimated_effort"
                type="number"
                value={formData.estimated_effort}
                onChange={(e) => handleFieldChange("estimated_effort", e.target.value)}
                placeholder="Nombre d'heures estimées"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="asset_owner_team" className="text-sm font-medium">
                Équipe propriétaire de l'actif
              </Label>
              <Select
                value={formData.asset_owner_team}
                onValueChange={(value) => handleFieldChange("asset_owner_team", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner l'équipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune équipe spécifique</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Création...' : 'Créer l\'incident de sécurité'}
        </Button>
      </div>
    </form>
  );
}