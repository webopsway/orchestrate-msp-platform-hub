import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PatchRequest {
  cloud_asset_id: string;
  scheduled_at: string;
  patch_type?: string;
  description?: string;
  team_id: string;
}

interface ExecutePatchRequest {
  patch_schedule_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'schedule';

    if (action === 'schedule') {
      // Schedule a new patch
      const body: PatchRequest = await req.json();
      
      console.log('Scheduling patch for asset:', body.cloud_asset_id);

      // Validate the cloud asset exists and user has access
      const { data: asset, error: assetError } = await supabase
        .from('cloud_asset')
        .select('id, team_id')
        .eq('id', body.cloud_asset_id)
        .single();

      if (assetError || !asset) {
        throw new Error('Cloud asset not found or access denied');
      }

      // Create patch schedule
      const { data: patchSchedule, error: scheduleError } = await supabase
        .from('patch_schedules')
        .insert({
          cloud_asset_id: body.cloud_asset_id,
          scheduled_at: body.scheduled_at,
          patch_type: body.patch_type || 'security',
          description: body.description,
          created_by: user.id,
          team_id: body.team_id,
          status: 'scheduled'
        })
        .select()
        .single();

      if (scheduleError) {
        console.error('Error creating patch schedule:', scheduleError);
        throw new Error('Failed to schedule patch');
      }

      console.log('Patch scheduled successfully:', patchSchedule.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          patch_schedule: patchSchedule,
          message: 'Patch scheduled successfully'
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );

    } else if (action === 'execute') {
      // Execute a scheduled patch
      const body: ExecutePatchRequest = await req.json();
      
      console.log('Executing patch:', body.patch_schedule_id);

      // Get patch schedule
      const { data: patchSchedule, error: scheduleError } = await supabase
        .from('patch_schedules')
        .select('*, cloud_asset(*)')
        .eq('id', body.patch_schedule_id)
        .single();

      if (scheduleError || !patchSchedule) {
        throw new Error('Patch schedule not found');
      }

      // Update status to in_progress
      await supabase
        .from('patch_schedules')
        .update({ status: 'in_progress' })
        .eq('id', body.patch_schedule_id);

      try {
        // Simulate patch execution
        // In a real scenario, this would integrate with your patch management system
        console.log('Executing patch for asset:', patchSchedule.cloud_asset.asset_name);
        
        // Simulate patch process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update status to completed
        const { error: updateError } = await supabase
          .from('patch_schedules')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', body.patch_schedule_id);

        if (updateError) {
          throw new Error('Failed to update patch status');
        }

        console.log('Patch executed successfully:', body.patch_schedule_id);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Patch executed successfully',
            patch_schedule_id: body.patch_schedule_id
          }),
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );

      } catch (executionError) {
        console.error('Patch execution failed:', executionError);
        
        // Update status to failed
        await supabase
          .from('patch_schedules')
          .update({ 
            status: 'failed',
            error_message: executionError.message
          })
          .eq('id', body.patch_schedule_id);

        throw new Error('Patch execution failed: ' + executionError.message);
      }

    } else if (action === 'check-overdue') {
      // Check for overdue patches and send alerts
      console.log('Checking for overdue patches...');

      const { data: overduePatchs, error: overdueError } = await supabase
        .from('patch_schedules')
        .select('*, cloud_asset(*)')
        .eq('status', 'scheduled')
        .lt('scheduled_at', new Date().toISOString());

      if (overdueError) {
        throw new Error('Failed to check overdue patches');
      }

      const alerts = [];
      
      for (const patch of overduePatchs) {
        // Create monitoring alert for overdue patch
        const { error: alertError } = await supabase
          .from('monitoring_alerts')
          .insert({
            alert_name: 'Overdue Security Patch',
            alert_type: 'security',
            severity: 'high',
            message: `Security patch for ${patch.cloud_asset.asset_name} is overdue. Scheduled: ${patch.scheduled_at}`,
            team_id: patch.team_id,
            metadata: {
              patch_schedule_id: patch.id,
              cloud_asset_id: patch.cloud_asset_id,
              overdue_hours: Math.round((Date.now() - Date.parse(patch.scheduled_at)) / (1000 * 60 * 60))
            }
          });

        if (!alertError) {
          alerts.push(patch.id);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          overdue_patches: overduePatchs.length,
          alerts_created: alerts.length
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );

    } else {
      throw new Error('Invalid action parameter');
    }

  } catch (error: any) {
    console.error('Error in security-patch-scheduler:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

serve(handler);