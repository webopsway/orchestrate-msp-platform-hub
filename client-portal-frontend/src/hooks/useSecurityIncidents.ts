import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  created_by: string;
  assigned_to?: string;
  team_id: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  metadata: {
    ticket_type: 'security';
    vulnerability_id?: string;
    patch_schedule_id?: string;
    remediation_plan?: string;
    asset_owner_team?: string;
    estimated_effort?: number;
    risk_assessment?: string;
    vulnerability_data?: any;
    patch_data?: any;
    created_source?: 'vulnerability' | 'patch' | 'manual';
  };
  created_by_profile?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  assigned_to_profile?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export function useSecurityIncidents() {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile } = useAuth();

  useEffect(() => {
    if (user && userProfile) {
      fetchSecurityIncidents();
    }
  }, [user, userProfile]);

  const fetchSecurityIncidents = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('itsm_incidents')
        .select(`
          *,
          created_by_profile:profiles!itsm_incidents_created_by_fkey(
            id,
            email,
            first_name,
            last_name
          ),
          assigned_to_profile:profiles!itsm_incidents_assigned_to_fkey(
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('metadata->>ticket_type', 'security')
        .order('created_at', { ascending: false });

      // Filtrer par équipe si l'utilisateur n'est pas MSP admin
      if (!userProfile?.is_msp_admin && userProfile?.default_team_id) {
        query = query.eq('team_id', userProfile.default_team_id);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setIncidents((data || []) as unknown as SecurityIncident[]);
    } catch (error) {
      console.error('Error fetching security incidents:', error);
      toast.error("Erreur lors du chargement des incidents de sécurité");
    } finally {
      setLoading(false);
    }
  };

  const createSecurityIncident = async (incidentData: {
    title: string;
    description: string;
    priority: string;
    vulnerability_id?: string;
    patch_schedule_id?: string;
    remediation_plan?: string;
    asset_owner_team?: string;
    estimated_effort?: number;
    risk_assessment?: string;
  }): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('create_security_incident', {
        p_title: incidentData.title,
        p_description: incidentData.description,
        p_priority: incidentData.priority,
        p_vulnerability_id: incidentData.vulnerability_id || null,
        p_patch_schedule_id: incidentData.patch_schedule_id || null,
        p_remediation_plan: incidentData.remediation_plan || null,
        p_asset_owner_team: incidentData.asset_owner_team || null,
        p_estimated_effort: incidentData.estimated_effort || null,
        p_risk_assessment: incidentData.risk_assessment || 'medium'
      });

      if (error) {
        throw error;
      }

      toast.success("Incident de sécurité créé avec succès");
      await fetchSecurityIncidents();
      return true;
    } catch (error) {
      console.error('Error creating security incident:', error);
      toast.error("Erreur lors de la création de l'incident de sécurité");
      return false;
    }
  };

  const updateSecurityIncident = async (
    id: string, 
    updates: Partial<SecurityIncident>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('itsm_incidents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success("Incident de sécurité mis à jour");
      await fetchSecurityIncidents();
      return true;
    } catch (error) {
      console.error('Error updating security incident:', error);
      toast.error("Erreur lors de la mise à jour de l'incident");
      return false;
    }
  };

  const deleteSecurityIncident = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('itsm_incidents')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success("Incident de sécurité supprimé");
      await fetchSecurityIncidents();
      return true;
    } catch (error) {
      console.error('Error deleting security incident:', error);
      toast.error("Erreur lors de la suppression de l'incident");
      return false;
    }
  };

  const assignSecurityIncident = async (
    id: string, 
    assigneeId: string | null
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('itsm_incidents')
        .update({ 
          assigned_to: assigneeId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success("Incident assigné avec succès");
      await fetchSecurityIncidents();
      return true;
    } catch (error) {
      console.error('Error assigning security incident:', error);
      toast.error("Erreur lors de l'assignation de l'incident");
      return false;
    }
  };

  const updateStatus = async (
    id: string, 
    status: string
  ): Promise<boolean> => {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };

      // Si le statut est résolu ou fermé, mettre à jour resolved_at
      if (['resolved', 'closed'].includes(status)) {
        updateData.resolved_at = new Date().toISOString();
      } else if (status === 'open' || status === 'in_progress') {
        updateData.resolved_at = null;
      }

      const { error } = await supabase
        .from('itsm_incidents')
        .update(updateData)
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success("Statut mis à jour");
      await fetchSecurityIncidents();
      return true;
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error("Erreur lors de la mise à jour du statut");
      return false;
    }
  };

  const createFromVulnerability = async (vulnerabilityId: string): Promise<boolean> => {
    try {
      // Récupérer les détails de la vulnérabilité
      const { data: vuln, error: vulnError } = await supabase
        .from('security_vulnerabilities')
        .select('*')
        .eq('id', vulnerabilityId)
        .single();

      if (vulnError || !vuln) {
        throw new Error('Vulnérabilité non trouvée');
      }

      return await createSecurityIncident({
        title: `Incident de sécurité: ${vuln.title}`,
        description: `Incident créé automatiquement pour la vulnérabilité:\n\nCVE: ${vuln.cve_id || 'N/A'}\nSévérité: ${vuln.severity}\nDescription: ${vuln.description || 'Aucune description'}`,
        priority: vuln.severity === 'critical' ? 'critical' : vuln.severity === 'high' ? 'high' : 'medium',
        vulnerability_id: vulnerabilityId,
        risk_assessment: vuln.severity
      });
    } catch (error) {
      console.error('Error creating incident from vulnerability:', error);
      toast.error("Erreur lors de la création de l'incident depuis la vulnérabilité");
      return false;
    }
  };

  const createFromPatch = async (patchId: string): Promise<boolean> => {
    try {
      // Récupérer les détails du patch
      const { data: patch, error: patchError } = await supabase
        .from('patch_schedules')
        .select(`
          *,
          cloud_asset:cloud_asset_id (
            asset_name,
            asset_type
          )
        `)
        .eq('id', patchId)
        .single();

      if (patchError || !patch) {
        throw new Error('Patch non trouvé');
      }

      return await createSecurityIncident({
        title: `Incident de sécurité: Patch ${patch.cloud_asset?.asset_name}`,
        description: `Incident créé pour le patch planifié:\n\nDescription: ${patch.description || 'Aucune description'}\nType: ${patch.patch_type}\nPlanifié: ${new Date(patch.scheduled_at).toLocaleString()}\nAsset: ${patch.cloud_asset?.asset_name} (${patch.cloud_asset?.asset_type})`,
        priority: patch.patch_type === 'security' ? 'high' : 'medium',
        patch_schedule_id: patchId,
        risk_assessment: patch.patch_type === 'security' ? 'high' : 'medium'
      });
    } catch (error) {
      console.error('Error creating incident from patch:', error);
      toast.error("Erreur lors de la création de l'incident depuis le patch");
      return false;
    }
  };

  return {
    incidents,
    loading,
    createSecurityIncident,
    updateSecurityIncident,
    deleteSecurityIncident,
    assignSecurityIncident,
    updateStatus,
    createFromVulnerability,
    createFromPatch,
    refreshIncidents: fetchSecurityIncidents
  };
}