import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  CloudAssetConfiguration,
  CloudInstalledPackage,
  CloudRunningProcess,
  CloudPatchStatus,
  SecurityVulnerability,
  CloudAssetConfigurationFilters,
  CloudInstalledPackageFilters,
  CloudRunningProcessFilters,
  CloudPatchStatusFilters,
  SecurityVulnerabilityFilters,
  CreateCloudAssetConfigurationData,
  CreateCloudInstalledPackageData,
  CreateCloudRunningProcessData,
  CreateCloudPatchStatusData,
  CreateSecurityVulnerabilityData,
  UpdateCloudAssetConfigurationData,
  UpdateCloudInstalledPackageData,
  UpdateCloudRunningProcessData,
  UpdateCloudPatchStatusData,
  UpdateSecurityVulnerabilityData,
  CloudAssetStats,
  SecurityStats
} from '@/types/cloudAsset';

interface UseCloudAssetManagementOptions {
  page?: number;
  limit?: number;
  filters?: CloudAssetConfigurationFilters | CloudInstalledPackageFilters | CloudRunningProcessFilters | CloudPatchStatusFilters | SecurityVulnerabilityFilters;
}

export const useCloudAssetManagement = (options: UseCloudAssetManagementOptions = {}) => {
  const { userProfile } = useAuth();
  const { page = 1, limit = 20, filters = {} } = options;

  // États pour les données
  const [configurations, setConfigurations] = useState<CloudAssetConfiguration[]>([]);
  const [packages, setPackages] = useState<CloudInstalledPackage[]>([]);
  const [processes, setProcesses] = useState<CloudRunningProcess[]>([]);
  const [patches, setPatches] = useState<CloudPatchStatus[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<SecurityVulnerability[]>([]);
  
  // États pour la pagination
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);
  const [pageSize, setPageSize] = useState(limit);
  
  // États de chargement
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // États pour les statistiques
  const [cloudStats, setCloudStats] = useState<CloudAssetStats | null>(null);
  const [securityStats, setSecurityStats] = useState<SecurityStats | null>(null);

  // Vérification des permissions
  const hasValidContext = userProfile?.is_msp_admin || userProfile?.default_team_id;

  // Fonction générique pour construire les filtres Supabase
  const buildFilters = useCallback((baseFilters: any) => {
    let query = supabase.from('cloud_asset_configurations').select('*', { count: 'exact' });
    
    if (baseFilters.asset_id) {
      query = query.eq('asset_id', baseFilters.asset_id);
    }
    if (baseFilters.team_id) {
      query = query.eq('team_id', baseFilters.team_id);
    }
    if (baseFilters.os) {
      query = query.ilike('os', `%${baseFilters.os}%`);
    }
    if (baseFilters.collected_after) {
      query = query.gte('collected_at', baseFilters.collected_after);
    }
    if (baseFilters.collected_before) {
      query = query.lte('collected_at', baseFilters.collected_before);
    }
    
    return query;
  }, []);

  // Charger les configurations d'actifs
  const loadConfigurations = useCallback(async () => {
    if (!hasValidContext) return;

    try {
      setLoading(true);
      
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      
      let query = buildFilters(filters as CloudAssetConfigurationFilters);
      query = query.range(from, to).order('collected_at', { ascending: false });
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      setConfigurations(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading configurations:', error);
      toast.error('Erreur lors du chargement des configurations');
    } finally {
      setLoading(false);
    }
  }, [hasValidContext, currentPage, pageSize, filters, buildFilters]);

  // Charger les packages installés
  const loadPackages = useCallback(async () => {
    if (!hasValidContext) return;

    try {
      setLoading(true);
      
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      
      let query = supabase.from('cloud_installed_packages').select('*', { count: 'exact' });
      
      const packageFilters = filters as CloudInstalledPackageFilters;
      if (packageFilters.asset_id) query = query.eq('asset_id', packageFilters.asset_id);
      if (packageFilters.team_id) query = query.eq('team_id', packageFilters.team_id);
      if (packageFilters.package_name) query = query.ilike('package_name', `%${packageFilters.package_name}%`);
      if (packageFilters.source) query = query.eq('source', packageFilters.source);
      if (packageFilters.collected_after) query = query.gte('collected_at', packageFilters.collected_after);
      if (packageFilters.collected_before) query = query.lte('collected_at', packageFilters.collected_before);
      
      query = query.range(from, to).order('collected_at', { ascending: false });
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      setPackages(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading packages:', error);
      toast.error('Erreur lors du chargement des packages');
    } finally {
      setLoading(false);
    }
  }, [hasValidContext, currentPage, pageSize, filters]);

  // Charger les processus en cours
  const loadProcesses = useCallback(async () => {
    if (!hasValidContext) return;

    try {
      setLoading(true);
      
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      
      let query = supabase.from('cloud_running_processes').select('*', { count: 'exact' });
      
      const processFilters = filters as CloudRunningProcessFilters;
      if (processFilters.asset_id) query = query.eq('asset_id', processFilters.asset_id);
      if (processFilters.team_id) query = query.eq('team_id', processFilters.team_id);
      if (processFilters.process_name) query = query.ilike('process_name', `%${processFilters.process_name}%`);
      if (processFilters.collected_after) query = query.gte('collected_at', processFilters.collected_after);
      if (processFilters.collected_before) query = query.lte('collected_at', processFilters.collected_before);
      
      query = query.range(from, to).order('collected_at', { ascending: false });
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      setProcesses(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading processes:', error);
      toast.error('Erreur lors du chargement des processus');
    } finally {
      setLoading(false);
    }
  }, [hasValidContext, currentPage, pageSize, filters]);

  // Charger les statuts de patches
  const loadPatches = useCallback(async () => {
    if (!hasValidContext) return;

    try {
      setLoading(true);
      
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      
      let query = supabase.from('cloud_patch_status').select('*', { count: 'exact' });
      
      const patchFilters = filters as CloudPatchStatusFilters;
      if (patchFilters.asset_id) query = query.eq('asset_id', patchFilters.asset_id);
      if (patchFilters.team_id) query = query.eq('team_id', patchFilters.team_id);
      if (patchFilters.cve_id) query = query.eq('cve_id', patchFilters.cve_id);
      if (patchFilters.status) query = query.eq('status', patchFilters.status);
      if (patchFilters.collected_after) query = query.gte('collected_at', patchFilters.collected_after);
      if (patchFilters.collected_before) query = query.lte('collected_at', patchFilters.collected_before);
      
      query = query.range(from, to).order('collected_at', { ascending: false });
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      setPatches(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading patches:', error);
      toast.error('Erreur lors du chargement des patches');
    } finally {
      setLoading(false);
    }
  }, [hasValidContext, currentPage, pageSize, filters]);

  // Charger les vulnérabilités
  const loadVulnerabilities = useCallback(async () => {
    try {
      setLoading(true);
      
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      
      let query = supabase.from('security_vulnerabilities').select('*', { count: 'exact' });
      
      const vulnFilters = filters as SecurityVulnerabilityFilters;
      if (vulnFilters.severity) query = query.eq('severity', vulnFilters.severity);
      if (vulnFilters.cvss_score_min) query = query.gte('cvss_score', vulnFilters.cvss_score_min);
      if (vulnFilters.cvss_score_max) query = query.lte('cvss_score', vulnFilters.cvss_score_max);
      if (vulnFilters.source) query = query.eq('source', vulnFilters.source);
      if (vulnFilters.published_after) query = query.gte('published_at', vulnFilters.published_after);
      if (vulnFilters.published_before) query = query.lte('published_at', vulnFilters.published_before);
      
      query = query.range(from, to).order('published_at', { ascending: false });
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      setVulnerabilities(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading vulnerabilities:', error);
      toast.error('Erreur lors du chargement des vulnérabilités');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters]);

  // Charger les statistiques
  const loadStats = useCallback(async () => {
    if (!hasValidContext) return;

    try {
      setLoadingStats(true);
      
      // Statistiques des actifs cloud
      const [configCount, packageCount, processCount, patchCount] = await Promise.all([
        supabase.from('cloud_asset_configurations').select('*', { count: 'exact', head: true }),
        supabase.from('cloud_installed_packages').select('*', { count: 'exact', head: true }),
        supabase.from('cloud_running_processes').select('*', { count: 'exact', head: true }),
        supabase.from('cloud_patch_status').select('*', { count: 'exact', head: true })
      ]);

      // Statistiques de sécurité
      const [vulnCount, criticalVulns] = await Promise.all([
        supabase.from('security_vulnerabilities').select('*', { count: 'exact', head: true }),
        supabase.from('security_vulnerabilities').select('*').eq('severity', 'critical')
      ]);

      setCloudStats({
        total_assets: configCount.count || 0,
        assets_by_os: {},
        assets_by_status: {},
        recent_configurations: 0,
        outdated_patches: patchCount.count || 0,
        critical_vulnerabilities: criticalVulns.data?.length || 0
      });

      setSecurityStats({
        total_vulnerabilities: vulnCount.count || 0,
        vulnerabilities_by_severity: {},
        vulnerabilities_by_source: {},
        recent_vulnerabilities: 0,
        average_cvss_score: 0,
        patched_vulnerabilities: 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoadingStats(false);
    }
  }, [hasValidContext]);

  // CRUD Operations pour les configurations
  const createConfiguration = async (data: CreateCloudAssetConfigurationData) => {
    try {
      const { data: newConfig, error } = await supabase
        .from('cloud_asset_configurations')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Configuration créée avec succès');
      loadConfigurations();
      return newConfig;
    } catch (error) {
      console.error('Error creating configuration:', error);
      toast.error('Erreur lors de la création de la configuration');
      throw error;
    }
  };

  const updateConfiguration = async (id: string, data: UpdateCloudAssetConfigurationData) => {
    try {
      const { data: updatedConfig, error } = await supabase
        .from('cloud_asset_configurations')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Configuration mise à jour avec succès');
      loadConfigurations();
      return updatedConfig;
    } catch (error) {
      console.error('Error updating configuration:', error);
      toast.error('Erreur lors de la mise à jour de la configuration');
      throw error;
    }
  };

  const deleteConfiguration = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cloud_asset_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Configuration supprimée avec succès');
      loadConfigurations();
    } catch (error) {
      console.error('Error deleting configuration:', error);
      toast.error('Erreur lors de la suppression de la configuration');
      throw error;
    }
  };

  // CRUD Operations pour les packages
  const createPackage = async (data: CreateCloudInstalledPackageData) => {
    try {
      const { data: newPackage, error } = await supabase
        .from('cloud_installed_packages')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Package ajouté avec succès');
      loadPackages();
      return newPackage;
    } catch (error) {
      console.error('Error creating package:', error);
      toast.error('Erreur lors de l\'ajout du package');
      throw error;
    }
  };

  const updatePackage = async (id: string, data: UpdateCloudInstalledPackageData) => {
    try {
      const { data: updatedPackage, error } = await supabase
        .from('cloud_installed_packages')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Package mis à jour avec succès');
      loadPackages();
      return updatedPackage;
    } catch (error) {
      console.error('Error updating package:', error);
      toast.error('Erreur lors de la mise à jour du package');
      throw error;
    }
  };

  const deletePackage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cloud_installed_packages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Package supprimé avec succès');
      loadPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error('Erreur lors de la suppression du package');
      throw error;
    }
  };

  // CRUD Operations pour les processus
  const createProcess = async (data: CreateCloudRunningProcessData) => {
    try {
      const { data: newProcess, error } = await supabase
        .from('cloud_running_processes')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Processus ajouté avec succès');
      loadProcesses();
      return newProcess;
    } catch (error) {
      console.error('Error creating process:', error);
      toast.error('Erreur lors de l\'ajout du processus');
      throw error;
    }
  };

  const updateProcess = async (id: string, data: UpdateCloudRunningProcessData) => {
    try {
      const { data: updatedProcess, error } = await supabase
        .from('cloud_running_processes')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Processus mis à jour avec succès');
      loadProcesses();
      return updatedProcess;
    } catch (error) {
      console.error('Error updating process:', error);
      toast.error('Erreur lors de la mise à jour du processus');
      throw error;
    }
  };

  const deleteProcess = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cloud_running_processes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Processus supprimé avec succès');
      loadProcesses();
    } catch (error) {
      console.error('Error deleting process:', error);
      toast.error('Erreur lors de la suppression du processus');
      throw error;
    }
  };

  // CRUD Operations pour les patches
  const createPatch = async (data: CreateCloudPatchStatusData) => {
    try {
      const { data: newPatch, error } = await supabase
        .from('cloud_patch_status')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Patch ajouté avec succès');
      loadPatches();
      return newPatch;
    } catch (error) {
      console.error('Error creating patch:', error);
      toast.error('Erreur lors de l\'ajout du patch');
      throw error;
    }
  };

  const updatePatch = async (id: string, data: UpdateCloudPatchStatusData) => {
    try {
      const { data: updatedPatch, error } = await supabase
        .from('cloud_patch_status')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Patch mis à jour avec succès');
      loadPatches();
      return updatedPatch;
    } catch (error) {
      console.error('Error updating patch:', error);
      toast.error('Erreur lors de la mise à jour du patch');
      throw error;
    }
  };

  const deletePatch = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cloud_patch_status')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Patch supprimé avec succès');
      loadPatches();
    } catch (error) {
      console.error('Error deleting patch:', error);
      toast.error('Erreur lors de la suppression du patch');
      throw error;
    }
  };

  // CRUD Operations pour les vulnérabilités
  const createVulnerability = async (data: CreateSecurityVulnerabilityData) => {
    try {
      const { data: newVuln, error } = await supabase
        .from('security_vulnerabilities')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Vulnérabilité ajoutée avec succès');
      loadVulnerabilities();
      return newVuln;
    } catch (error) {
      console.error('Error creating vulnerability:', error);
      toast.error('Erreur lors de l\'ajout de la vulnérabilité');
      throw error;
    }
  };

  const updateVulnerability = async (cveId: string, data: UpdateSecurityVulnerabilityData) => {
    try {
      const { data: updatedVuln, error } = await supabase
        .from('security_vulnerabilities')
        .update(data)
        .eq('cve_id', cveId)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Vulnérabilité mise à jour avec succès');
      loadVulnerabilities();
      return updatedVuln;
    } catch (error) {
      console.error('Error updating vulnerability:', error);
      toast.error('Erreur lors de la mise à jour de la vulnérabilité');
      throw error;
    }
  };

  const deleteVulnerability = async (cveId: string) => {
    try {
      const { error } = await supabase
        .from('security_vulnerabilities')
        .delete()
        .eq('cve_id', cveId);

      if (error) throw error;
      
      toast.success('Vulnérabilité supprimée avec succès');
      loadVulnerabilities();
    } catch (error) {
      console.error('Error deleting vulnerability:', error);
      toast.error('Erreur lors de la suppression de la vulnérabilité');
      throw error;
    }
  };

  // Fonctions utilitaires
  const refreshData = useCallback(() => {
    loadConfigurations();
    loadPackages();
    loadProcesses();
    loadPatches();
    loadVulnerabilities();
    loadStats();
  }, [loadConfigurations, loadPackages, loadProcesses, loadPatches, loadVulnerabilities, loadStats]);

  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const setPageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  // Chargement initial
  useEffect(() => {
    if (hasValidContext) {
      refreshData();
    }
  }, [hasValidContext, refreshData]);

  return {
    // États
    configurations,
    packages,
    processes,
    patches,
    vulnerabilities,
    cloudStats,
    securityStats,
    loading,
    loadingStats,
    totalCount,
    currentPage,
    pageSize,
    hasValidContext,

    // Fonctions de chargement
    loadConfigurations,
    loadPackages,
    loadProcesses,
    loadPatches,
    loadVulnerabilities,
    loadStats,

    // CRUD Configurations
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,

    // CRUD Packages
    createPackage,
    updatePackage,
    deletePackage,

    // CRUD Processes
    createProcess,
    updateProcess,
    deleteProcess,

    // CRUD Patches
    createPatch,
    updatePatch,
    deletePatch,

    // CRUD Vulnerabilities
    createVulnerability,
    updateVulnerability,
    deleteVulnerability,

    // Utilitaires
    refreshData,
    setPage,
    setPageSize
  };
}; 