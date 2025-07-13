import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type Vulnerability = Database["public"]["Tables"]["security_vulnerabilities"]["Row"] & {
  cloud_asset?: Database["public"]["Tables"]["cloud_asset"]["Row"];
  assigned_to_profile?: Database["public"]["Tables"]["profiles"]["Row"];
};

type VulnerabilityInsert = Database["public"]["Tables"]["security_vulnerabilities"]["Insert"];
type VulnerabilityUpdate = Database["public"]["Tables"]["security_vulnerabilities"]["Update"];

export const useVulnerabilities = () => {
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { userProfile } = useAuth();

  const loadVulnerabilities = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('security_vulnerabilities')
        .select(`
          *,
          cloud_asset(*),
          assigned_to_profile:profiles!assigned_to(*)
        `)
        .order('discovered_at', { ascending: false });

      if (error) throw error;

      setVulnerabilities(data || []);
    } catch (error) {
      console.error('Error loading vulnerabilities:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les vulnérabilités",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createVulnerability = async (vulnerabilityData: Omit<VulnerabilityInsert, 'team_id'>) => {
    try {
      if (!userProfile?.default_team_id) {
        throw new Error("Aucune équipe par défaut configurée");
      }

      const { data, error } = await supabase
        .from('security_vulnerabilities')
        .insert({
          ...vulnerabilityData,
          team_id: userProfile.default_team_id,
        })
        .select(`
          *,
          cloud_asset(*),
          assigned_to_profile:profiles!assigned_to(*)
        `)
        .single();

      if (error) throw error;

      setVulnerabilities(prev => [data, ...prev]);
      
      toast({
        title: "Succès",
        description: "Vulnérabilité créée avec succès",
      });

      return true;
    } catch (error) {
      console.error('Error creating vulnerability:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la vulnérabilité",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateVulnerability = async (id: string, updates: VulnerabilityUpdate) => {
    try {
      const { data, error } = await supabase
        .from('security_vulnerabilities')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          cloud_asset(*),
          assigned_to_profile:profiles!assigned_to(*)
        `)
        .single();

      if (error) throw error;

      setVulnerabilities(prev => 
        prev.map(vuln => vuln.id === id ? data : vuln)
      );

      toast({
        title: "Succès",
        description: "Vulnérabilité mise à jour avec succès",
      });

      return true;
    } catch (error) {
      console.error('Error updating vulnerability:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la vulnérabilité",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteVulnerability = async (id: string) => {
    try {
      const { error } = await supabase
        .from('security_vulnerabilities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setVulnerabilities(prev => prev.filter(vuln => vuln.id !== id));

      toast({
        title: "Succès",
        description: "Vulnérabilité supprimée avec succès",
      });

      return true;
    } catch (error) {
      console.error('Error deleting vulnerability:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la vulnérabilité",
        variant: "destructive",
      });
      return false;
    }
  };

  const scanVulnerabilities = async () => {
    try {
      // Get cloud assets for the current team
      const { data: assets } = await supabase
        .from('cloud_asset')
        .select('*')
        .eq('team_id', userProfile?.default_team_id)
        .limit(1);

      if (!assets || assets.length === 0) {
        toast({
          title: "Aucun asset",
          description: "Aucun asset cloud trouvé pour le scan",
          variant: "destructive",
        });
        return false;
      }

      const asset = assets[0];
      
      const { error } = await supabase.functions.invoke('vulnerability-scanner', {
        body: {
          cloud_asset_id: asset.id,
          team_id: asset.team_id,
        }
      });

      if (error) throw error;

      toast({
        title: "Scan lancé",
        description: `Scan de vulnérabilités lancé pour ${asset.asset_name}`,
      });

      // Reload vulnerabilities after a delay
      setTimeout(() => loadVulnerabilities(), 3000);
      
      return true;
    } catch (error) {
      console.error('Error starting vulnerability scan:', error);
      toast({
        title: "Erreur",
        description: "Impossible de lancer le scan de vulnérabilités",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    loadVulnerabilities();
  }, []);

  return {
    vulnerabilities,
    loading,
    loadVulnerabilities,
    createVulnerability,
    updateVulnerability,
    deleteVulnerability,
    scanVulnerabilities,
  };
};