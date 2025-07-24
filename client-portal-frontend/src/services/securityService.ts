import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/contexts/AuthContext';
import type {
  SecurityVulnerability,
  CloudPatchStatus,
  CreateSecurityVulnerabilityData,
  UpdateSecurityVulnerabilityData,
  CreateCloudPatchStatusData,
  UpdateCloudPatchStatusData,
  SecurityVulnerabilityFilters,
  CloudPatchStatusFilters
} from '@/types/cloudAsset';

export class SecurityService {
  // === VULNÉRABILITÉS DE SÉCURITÉ ===

  static async fetchVulnerabilities(
    user: User,
    userProfile: UserProfile | null,
    filters?: SecurityVulnerabilityFilters
  ): Promise<SecurityVulnerability[]> {
    try {
      let query = supabase
        .from('security_vulnerabilities')
        .select('*')
        .order('published_at', { ascending: false });

      // Application des filtres
      if (filters) {
        if (filters.severity) {
          query = query.eq('severity', filters.severity);
        }
        if (filters.cvss_score_min !== undefined) {
          query = query.gte('cvss_score', filters.cvss_score_min);
        }
        if (filters.cvss_score_max !== undefined) {
          query = query.lte('cvss_score', filters.cvss_score_max);
        }
        if (filters.published_after) {
          query = query.gte('published_at', filters.published_after);
        }
        if (filters.published_before) {
          query = query.lte('published_at', filters.published_before);
        }
        if (filters.source) {
          query = query.eq('source', filters.source);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching security vulnerabilities:', error);
        toast.error('Erreur lors du chargement des vulnérabilités');
        return [];
      }

      return (data || []) as SecurityVulnerability[];
    } catch (error) {
      console.error('Error fetching security vulnerabilities:', error);
      toast.error('Erreur lors du chargement des vulnérabilités');
      return [];
    }
  }

  static async fetchVulnerabilityById(
    cveId: string,
    user: User,
    userProfile: UserProfile | null
  ): Promise<SecurityVulnerability | null> {
    try {
      const { data, error } = await supabase
        .from('security_vulnerabilities')
        .select('*')
        .eq('cve_id', cveId)
        .single();

      if (error) {
        console.error('Error fetching security vulnerability:', error);
        toast.error('Erreur lors du chargement de la vulnérabilité');
        return null;
      }

      return data as SecurityVulnerability;
    } catch (error) {
      console.error('Error fetching security vulnerability:', error);
      toast.error('Erreur lors du chargement de la vulnérabilité');
      return null;
    }
  }

  static async createVulnerability(
    vulnerabilityData: CreateSecurityVulnerabilityData,
    user: User,
    userProfile: UserProfile | null
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('security_vulnerabilities')
        .insert([vulnerabilityData]);

      if (error) {
        console.error('Error creating security vulnerability:', error);
        toast.error('Erreur lors de la création de la vulnérabilité');
        return false;
      }

      toast.success('Vulnérabilité créée avec succès');
      return true;
    } catch (error) {
      console.error('Error creating security vulnerability:', error);
      toast.error('Erreur lors de la création de la vulnérabilité');
      return false;
    }
  }

  static async updateVulnerability(
    cveId: string,
    updates: UpdateSecurityVulnerabilityData,
    user: User,
    userProfile: UserProfile | null
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('security_vulnerabilities')
        .update(updates)
        .eq('cve_id', cveId);

      if (error) {
        console.error('Error updating security vulnerability:', error);
        toast.error('Erreur lors de la mise à jour de la vulnérabilité');
        return false;
      }

      toast.success('Vulnérabilité mise à jour avec succès');
      return true;
    } catch (error) {
      console.error('Error updating security vulnerability:', error);
      toast.error('Erreur lors de la mise à jour de la vulnérabilité');
      return false;
    }
  }

  static async deleteVulnerability(
    cveId: string,
    user: User,
    userProfile: UserProfile | null
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('security_vulnerabilities')
        .delete()
        .eq('cve_id', cveId);

      if (error) {
        console.error('Error deleting security vulnerability:', error);
        toast.error('Erreur lors de la suppression de la vulnérabilité');
        return false;
      }

      toast.success('Vulnérabilité supprimée avec succès');
      return true;
    } catch (error) {
      console.error('Error deleting security vulnerability:', error);
      toast.error('Erreur lors de la suppression de la vulnérabilité');
      return false;
    }
  }

  // === STATUT DES PATCHES ===

  static async fetchPatchStatus(
    user: User,
    userProfile: UserProfile | null,
    filters?: CloudPatchStatusFilters
  ): Promise<CloudPatchStatus[]> {
    try {
      let query = supabase
        .from('cloud_patch_status')
        .select('*')
        .order('collected_at', { ascending: false });

      // Filtrage par équipe si pas admin MSP
      if (!userProfile?.is_msp_admin && userProfile?.default_team_id) {
        query = query.eq('team_id', userProfile.default_team_id);
      }

      // Application des filtres
      if (filters) {
        if (filters.asset_id) {
          query = query.eq('asset_id', filters.asset_id);
        }
        if (filters.team_id) {
          query = query.eq('team_id', filters.team_id);
        }
        if (filters.cve_id) {
          query = query.eq('cve_id', filters.cve_id);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.collected_after) {
          query = query.gte('collected_at', filters.collected_after);
        }
        if (filters.collected_before) {
          query = query.lte('collected_at', filters.collected_before);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching patch status:', error);
        toast.error('Erreur lors du chargement du statut des patches');
        return [];
      }

      return (data || []) as CloudPatchStatus[];
    } catch (error) {
      console.error('Error fetching patch status:', error);
      toast.error('Erreur lors du chargement du statut des patches');
      return [];
    }
  }

  static async createPatchStatus(
    patchData: CreateCloudPatchStatusData,
    user: User,
    userProfile: UserProfile | null
  ): Promise<boolean> {
    try {
      // Vérifier que l'utilisateur a accès à l'équipe
      if (!userProfile?.is_msp_admin && userProfile?.default_team_id) {
        if (patchData.team_id !== userProfile.default_team_id) {
          toast.error('Vous n\'avez pas les permissions pour créer ce statut de patch');
          return false;
        }
      }

      const { error } = await supabase
        .from('cloud_patch_status')
        .insert([{
          ...patchData,
          collected_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error creating patch status:', error);
        toast.error('Erreur lors de la création du statut de patch');
        return false;
      }

      toast.success('Statut de patch créé avec succès');
      return true;
    } catch (error) {
      console.error('Error creating patch status:', error);
      toast.error('Erreur lors de la création du statut de patch');
      return false;
    }
  }

  static async updatePatchStatus(
    id: string,
    updates: UpdateCloudPatchStatusData,
    user: User,
    userProfile: UserProfile | null
  ): Promise<boolean> {
    try {
      let query = supabase
        .from('cloud_patch_status')
        .update(updates)
        .eq('id', id);

      // Filtrage par équipe si pas admin MSP
      if (!userProfile?.is_msp_admin && userProfile?.default_team_id) {
        query = query.eq('team_id', userProfile.default_team_id);
      }

      const { error } = await query;

      if (error) {
        console.error('Error updating patch status:', error);
        toast.error('Erreur lors de la mise à jour du statut de patch');
        return false;
      }

      toast.success('Statut de patch mis à jour avec succès');
      return true;
    } catch (error) {
      console.error('Error updating patch status:', error);
      toast.error('Erreur lors de la mise à jour du statut de patch');
      return false;
    }
  }

  static async deletePatchStatus(
    id: string,
    user: User,
    userProfile: UserProfile | null
  ): Promise<boolean> {
    try {
      let query = supabase
        .from('cloud_patch_status')
        .delete()
        .eq('id', id);

      // Filtrage par équipe si pas admin MSP
      if (!userProfile?.is_msp_admin && userProfile?.default_team_id) {
        query = query.eq('team_id', userProfile.default_team_id);
      }

      const { error } = await query;

      if (error) {
        console.error('Error deleting patch status:', error);
        toast.error('Erreur lors de la suppression du statut de patch');
        return false;
      }

      toast.success('Statut de patch supprimé avec succès');
      return true;
    } catch (error) {
      console.error('Error deleting patch status:', error);
      toast.error('Erreur lors de la suppression du statut de patch');
      return false;
    }
  }

  // === STATISTIQUES DE SÉCURITÉ ===

  static async getSecurityStats(
    user: User,
    userProfile: UserProfile | null
  ): Promise<{
    total_vulnerabilities: number;
    vulnerabilities_by_severity: Record<string, number>;
    vulnerabilities_by_source: Record<string, number>;
    recent_vulnerabilities: number;
    average_cvss_score: number;
    patched_vulnerabilities: number;
    pending_patches: number;
    critical_vulnerabilities: number;
  }> {
    try {
      // Récupérer les vulnérabilités
      const { data: vulnerabilities, error: vulnError } = await supabase
        .from('security_vulnerabilities')
        .select('severity, cvss_score, source, published_at');

      if (vulnError) {
        console.error('Error fetching vulnerabilities for stats:', vulnError);
        return {
          total_vulnerabilities: 0,
          vulnerabilities_by_severity: {},
          vulnerabilities_by_source: {},
          recent_vulnerabilities: 0,
          average_cvss_score: 0,
          patched_vulnerabilities: 0,
          pending_patches: 0,
          critical_vulnerabilities: 0
        };
      }

      // Récupérer les statuts de patches
      let patchQuery = supabase
        .from('cloud_patch_status')
        .select('status');

      if (!userProfile?.is_msp_admin && userProfile?.default_team_id) {
        patchQuery = patchQuery.eq('team_id', userProfile.default_team_id);
      }

      const { data: patches, error: patchError } = await patchQuery;

      if (patchError) {
        console.error('Error fetching patches for stats:', patchError);
        return {
          total_vulnerabilities: 0,
          vulnerabilities_by_severity: {},
          vulnerabilities_by_source: {},
          recent_vulnerabilities: 0,
          average_cvss_score: 0,
          patched_vulnerabilities: 0,
          pending_patches: 0,
          critical_vulnerabilities: 0
        };
      }

      const vulns = vulnerabilities || [];
      const patchStatuses = patches || [];

      // Calculer les statistiques
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const vulnerabilities_by_severity = vulns.reduce((acc: Record<string, number>, vuln: any) => {
        const severity = vuln.severity || 'unknown';
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      }, {});

      const vulnerabilities_by_source = vulns.reduce((acc: Record<string, number>, vuln: any) => {
        const source = vuln.source || 'unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {});

      const recent_vulnerabilities = vulns.filter((vuln: any) => 
        vuln.published_at && new Date(vuln.published_at) >= oneMonthAgo
      ).length;

      const cvssScores = vulns
        .map((vuln: any) => vuln.cvss_score)
        .filter((score: number) => score !== null && score !== undefined);
      
      const average_cvss_score = cvssScores.length > 0 
        ? cvssScores.reduce((sum: number, score: number) => sum + score, 0) / cvssScores.length 
        : 0;

      const patched_vulnerabilities = patchStatuses.filter((patch: any) => 
        patch.status === 'applied'
      ).length;

      const pending_patches = patchStatuses.filter((patch: any) => 
        patch.status === 'pending'
      ).length;

      const critical_vulnerabilities = vulns.filter((vuln: any) => 
        vuln.severity === 'critical' || (vuln.cvss_score && vuln.cvss_score >= 9.0)
      ).length;

      return {
        total_vulnerabilities: vulns.length,
        vulnerabilities_by_severity,
        vulnerabilities_by_source,
        recent_vulnerabilities,
        average_cvss_score: Math.round(average_cvss_score * 100) / 100,
        patched_vulnerabilities,
        pending_patches,
        critical_vulnerabilities
      };
    } catch (error) {
      console.error('Error fetching security stats:', error);
      return {
        total_vulnerabilities: 0,
        vulnerabilities_by_severity: {},
        vulnerabilities_by_source: {},
        recent_vulnerabilities: 0,
        average_cvss_score: 0,
        patched_vulnerabilities: 0,
        pending_patches: 0,
        critical_vulnerabilities: 0
      };
    }
  }

  // === RAPPORTS DE SÉCURITÉ ===

  static async getSecurityReport(
    user: User,
    userProfile: UserProfile | null,
    cveId?: string
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('security_vulnerabilities')
        .select(`
          *,
          cloud_patch_status!inner(
            id,
            asset_id,
            status,
            collected_at
          )
        `);

      if (cveId) {
        query = query.eq('cve_id', cveId);
      }

      // Filtrage par équipe si pas admin MSP
      if (!userProfile?.is_msp_admin && userProfile?.default_team_id) {
        query = query.eq('cloud_patch_status.team_id', userProfile.default_team_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching security report:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching security report:', error);
      return [];
    }
  }
} 