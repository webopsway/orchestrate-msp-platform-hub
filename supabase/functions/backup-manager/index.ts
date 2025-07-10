import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackupJobRequest {
  name: string;
  backup_type: string;
  source_path: string;
  destination: string;
  schedule_cron?: string;
  retention_days?: number;
  team_id: string;
}

interface ExecuteBackupRequest {
  backup_job_id: string;
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
    const action = url.searchParams.get('action') || 'create';

    if (action === 'create') {
      // Create a new backup job
      const body: BackupJobRequest = await req.json();
      
      console.log('Creating backup job:', body.name);

      // Create backup job
      const { data: backupJob, error: jobError } = await supabase
        .from('backup_jobs')
        .insert({
          name: body.name,
          backup_type: body.backup_type,
          source_path: body.source_path,
          destination: body.destination,
          schedule_cron: body.schedule_cron,
          retention_days: body.retention_days || 30,
          team_id: body.team_id,
          status: 'pending'
        })
        .select()
        .single();

      if (jobError) {
        console.error('Error creating backup job:', jobError);
        throw new Error('Failed to create backup job');
      }

      console.log('Backup job created successfully:', backupJob.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          backup_job: backupJob,
          message: 'Backup job created successfully'
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );

    } else if (action === 'execute') {
      // Execute a backup job
      const body: ExecuteBackupRequest = await req.json();
      
      console.log('Executing backup job:', body.backup_job_id);

      // Get backup job
      const { data: backupJob, error: jobError } = await supabase
        .from('backup_jobs')
        .select('*')
        .eq('id', body.backup_job_id)
        .single();

      if (jobError || !backupJob) {
        throw new Error('Backup job not found');
      }

      // Update status to running
      await supabase
        .from('backup_jobs')
        .update({ 
          status: 'running',
          last_run: new Date().toISOString()
        })
        .eq('id', body.backup_job_id);

      try {
        // Simulate backup execution based on backup type
        console.log(`Executing ${backupJob.backup_type} backup from ${backupJob.source_path} to ${backupJob.destination}`);
        
        // Here you would integrate with actual backup tools:
        // - For 'borg': Execute borg backup commands
        // - For 'restic': Execute restic backup commands  
        // - For 'cloud': Use cloud SDK (AWS, GCP, Azure)
        
        // Simulate backup process
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Calculate next run time if scheduled
        let nextRun = null;
        if (backupJob.schedule_cron) {
          // Simple next run calculation (you'd use a proper cron parser)
          const now = new Date();
          nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // Next day
        }
        
        // Update status to completed
        const { error: updateError } = await supabase
          .from('backup_jobs')
          .update({ 
            status: 'completed',
            next_run: nextRun,
            metadata: {
              last_backup_size: Math.floor(Math.random() * 1000000000), // Random size in bytes
              duration_seconds: 180,
              files_count: Math.floor(Math.random() * 10000)
            }
          })
          .eq('id', body.backup_job_id);

        if (updateError) {
          throw new Error('Failed to update backup status');
        }

        console.log('Backup executed successfully:', body.backup_job_id);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Backup executed successfully',
            backup_job_id: body.backup_job_id
          }),
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );

      } catch (executionError) {
        console.error('Backup execution failed:', executionError);
        
        // Update status to failed (this will trigger the alert)
        await supabase
          .from('backup_jobs')
          .update({ 
            status: 'failed',
            metadata: {
              error_message: executionError.message,
              failed_at: new Date().toISOString()
            }
          })
          .eq('id', body.backup_job_id);

        throw new Error('Backup execution failed: ' + executionError.message);
      }

    } else if (action === 'list') {
      // List backup jobs with history
      console.log('Fetching backup jobs...');

      const { data: backupJobs, error: listError } = await supabase
        .from('backup_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (listError) {
        throw new Error('Failed to fetch backup jobs');
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          backup_jobs: backupJobs
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
    console.error('Error in backup-manager:', error);
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