import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const usePatchManagement = () => {
  const [patches, setPatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    scheduled: 0,
    running: 0,
    completed: 0,
    failed: 0,
    todayScheduled: 0,
    monthCompleted: 0,
    successRate: 0
  });
  
  const { toast } = useToast();

  const loadPatches = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load patches with cloud asset information
      const { data: patchData, error: patchError } = await supabase
        .from('patch_schedules')
        .select(`
          *,
          cloud_asset (
            id,
            asset_name,
            asset_type,
            region,
            status
          )
        `)
        .order('scheduled_at', { ascending: false });

      if (patchError) throw patchError;

      setPatches(patchData || []);

      // Calculate statistics
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats = {
        scheduled: patchData?.filter(p => p.status === 'scheduled').length || 0,
        running: patchData?.filter(p => p.status === 'running').length || 0,
        completed: patchData?.filter(p => p.status === 'completed').length || 0,
        failed: patchData?.filter(p => p.status === 'failed').length || 0,
        todayScheduled: patchData?.filter(p => 
          p.status === 'scheduled' && 
          new Date(p.scheduled_at) >= today
        ).length || 0,
        monthCompleted: patchData?.filter(p => 
          p.status === 'completed' && 
          new Date(p.completed_at) >= thisMonth
        ).length || 0,
        successRate: 0
      };

      // Calculate success rate
      const totalExecuted = stats.completed + stats.failed;
      if (totalExecuted > 0) {
        stats.successRate = Math.round((stats.completed / totalExecuted) * 100);
      }

      setStats(stats);
      
    } catch (error) {
      console.error('Error loading patches:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les patches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createPatch = useCallback(async (data) => {
    try {
      setLoading(true);
      
      // Get user's team_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('default_team_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const { error } = await supabase
        .from('patch_schedules')
        .insert([{
          cloud_asset_id: data.cloud_asset_id,
          description: data.description,
          patch_type: data.patch_type,
          scheduled_at: data.scheduled_at,
          status: 'scheduled',
          metadata: data.metadata,
          team_id: profile?.default_team_id,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (error) throw error;

      await loadPatches();
      return true;
      
    } catch (error) {
      console.error('Error creating patch:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le patch",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadPatches, toast]);

  const updatePatch = useCallback(async (id, data) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('patch_schedules')
        .update({
          cloud_asset_id: data.cloud_asset_id,
          description: data.description,
          patch_type: data.patch_type,
          scheduled_at: data.scheduled_at,
          metadata: data.metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      await loadPatches();
      return true;
      
    } catch (error) {
      console.error('Error updating patch:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le patch",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadPatches, toast]);

  const deletePatch = useCallback(async (id) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('patch_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadPatches();
      return true;
      
    } catch (error) {
      console.error('Error deleting patch:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le patch",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadPatches, toast]);

  const executePatch = useCallback(async (id) => {
    try {
      setLoading(true);
      
      // First update status to running
      const { error: updateError } = await supabase
        .from('patch_schedules')
        .update({ 
          status: 'running',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Call the edge function to execute the patch
      const { data, error: functionError } = await supabase.functions.invoke('security-patch-scheduler', {
        body: {
          action: 'execute',
          patch_schedule_id: id
        }
      });

      if (functionError) throw functionError;

      await loadPatches();
      return true;
      
    } catch (error) {
      console.error('Error executing patch:', error);
      
      // Reset status to scheduled if execution failed
      await supabase
        .from('patch_schedules')
        .update({ 
          status: 'scheduled',
          error_message: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      toast({
        title: "Erreur",
        description: "Impossible d'exécuter le patch",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadPatches, toast]);

  const schedulePatchFromScan = useCallback(async (scanData) => {
    try {
      // Create patch based on scan results
      const patchData = {
        cloud_asset_id: scanData.asset_id,
        description: `Patch automatique suite au scan: ${scanData.description}`,
        patch_type: scanData.severity === 'critical' ? 'critical' : 'security',
        scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Schedule for next day
        metadata: {
          severity: scanData.severity,
          scan_id: scanData.scan_id,
          auto_generated: true,
          packages_to_update: scanData.packages || [],
          cve_ids: scanData.cve_ids || []
        }
      };

      return await createPatch(patchData);
      
    } catch (error) {
      console.error('Error scheduling patch from scan:', error);
      toast({
        title: "Erreur",
        description: "Impossible de planifier le patch automatique",
        variant: "destructive",
      });
      return false;
    }
  }, [createPatch, toast]);

  return {
    patches,
    loading,
    stats,
    createPatch,
    updatePatch,
    deletePatch,
    executePatch,
    schedulePatchFromScan,
    loadPatches
  };
};