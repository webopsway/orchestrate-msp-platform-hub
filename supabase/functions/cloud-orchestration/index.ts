import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CloudCredentials {
  id: string;
  team_id: string;
  provider_id: string;
  config: Record<string, any>;
  configured_by: string;
}

interface CloudProvider {
  id: string;
  name: string;
  display_name: string;
}

interface OrchestrationTask {
  execution_id: string;
  task_type: 'inventory' | 'backup';
  team_id: string;
  provider_id: string;
}

class CloudOrchestrator {
  private supabase: any;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  async processTask(task: OrchestrationTask): Promise<void> {
    console.log(`Processing ${task.task_type} task for team ${task.team_id}, provider ${task.provider_id}`);
    
    try {
      // Update status to running
      await this.updateExecutionStatus(task.execution_id, 'running');

      // Get credentials and provider info
      const { credentials, provider } = await this.getCredentialsAndProvider(task.team_id, task.provider_id);
      
      // Execute the appropriate task
      let result: any;
      switch (task.task_type) {
        case 'inventory':
          result = await this.performInventory(credentials, provider, task.team_id);
          break;
        case 'backup':
          result = await this.performBackup(credentials, provider, task.team_id);
          break;
        default:
          throw new Error(`Unknown task type: ${task.task_type}`);
      }

      // Update status to completed with result
      await this.updateExecutionStatus(task.execution_id, 'completed', null, result);
      
      // Send success notification
      await this.sendNotification(task.team_id, 'success', `${task.task_type} completed successfully`, {
        task_type: task.task_type,
        provider: provider.display_name,
        result
      });

      console.log(`Task ${task.execution_id} completed successfully`);
      
    } catch (error) {
      console.error(`Task ${task.execution_id} failed:`, error);
      
      // Update status to failed
      await this.updateExecutionStatus(task.execution_id, 'failed', error.message);
      
      // Send failure notification
      await this.sendNotification(task.team_id, 'failure', `${task.task_type} failed: ${error.message}`, {
        task_type: task.task_type,
        error: error.message
      });
    }
  }

  private async getCredentialsAndProvider(teamId: string, providerId: string): Promise<{
    credentials: CloudCredentials;
    provider: CloudProvider;
  }> {
    // Get credentials
    const { data: credentials, error: credError } = await this.supabase
      .from('cloud_credentials')
      .select('*')
      .eq('team_id', teamId)
      .eq('provider_id', providerId)
      .single();

    if (credError || !credentials) {
      throw new Error(`Failed to get credentials: ${credError?.message || 'Not found'}`);
    }

    // Get provider info
    const { data: provider, error: provError } = await this.supabase
      .from('cloud_providers')
      .select('*')
      .eq('id', providerId)
      .single();

    if (provError || !provider) {
      throw new Error(`Failed to get provider info: ${provError?.message || 'Not found'}`);
    }

    return { credentials, provider };
  }

  private async performInventory(credentials: CloudCredentials, provider: CloudProvider, teamId: string): Promise<any> {
    console.log(`Performing inventory for provider ${provider.name}`);
    
    const assets = [];
    
    switch (provider.name.toLowerCase()) {
      case 'aws':
        // AWS inventory logic would go here
        // For demo purposes, creating mock data
        assets.push(
          {
            asset_id: `i-${Math.random().toString(36).substr(2, 9)}`,
            asset_name: 'Demo AWS EC2 Instance',
            asset_type: 'ec2_instance',
            region: 'us-east-1',
            status: 'running',
            metadata: {
              instance_type: 't3.micro',
              vpc_id: 'vpc-123456',
              discovered_via: 'cloud_orchestration'
            }
          },
          {
            asset_id: `bucket-${Math.random().toString(36).substr(2, 9)}`,
            asset_name: 'Demo S3 Bucket',
            asset_type: 's3_bucket',
            region: 'us-east-1',
            status: 'active',
            metadata: {
              storage_class: 'STANDARD',
              discovered_via: 'cloud_orchestration'
            }
          }
        );
        break;
        
      case 'gcp':
        // GCP inventory logic would go here
        assets.push({
          asset_id: `gcp-vm-${Math.random().toString(36).substr(2, 9)}`,
          asset_name: 'Demo GCP VM Instance',
          asset_type: 'compute_instance',
          region: 'us-central1',
          status: 'running',
          metadata: {
            machine_type: 'e2-micro',
            discovered_via: 'cloud_orchestration'
          }
        });
        break;
        
      case 'azure':
        // Azure inventory logic would go here
        assets.push({
          asset_id: `azure-vm-${Math.random().toString(36).substr(2, 9)}`,
          asset_name: 'Demo Azure VM',
          asset_type: 'virtual_machine',
          region: 'East US',
          status: 'running',
          metadata: {
            vm_size: 'Standard_B1s',
            discovered_via: 'cloud_orchestration'
          }
        });
        break;
        
      default:
        throw new Error(`Unsupported provider: ${provider.name}`);
    }

    // Store discovered assets in database
    for (const asset of assets) {
      const { error } = await this.supabase
        .from('cloud_asset')
        .upsert({
          ...asset,
          team_id: teamId,
          cloud_provider_id: provider.id,
          last_scan: new Date().toISOString(),
          tags: {},
          discovered_at: new Date().toISOString()
        }, {
          onConflict: 'asset_id,team_id'
        });
        
      if (error) {
        console.error('Failed to store asset:', error);
      }
    }

    return {
      assets_discovered: assets.length,
      assets: assets,
      provider: provider.name,
      timestamp: new Date().toISOString()
    };
  }

  private async performBackup(credentials: CloudCredentials, provider: CloudProvider, teamId: string): Promise<any> {
    console.log(`Performing backup for provider ${provider.name}`);
    
    // Get assets to backup
    const { data: assets, error } = await this.supabase
      .from('cloud_asset')
      .select('*')
      .eq('team_id', teamId)
      .eq('cloud_provider_id', provider.id);

    if (error) {
      throw new Error(`Failed to get assets: ${error.message}`);
    }

    const backupResults = [];
    
    // Simulate backup process for each asset
    for (const asset of assets || []) {
      try {
        // Here would be the actual backup logic per provider
        const backupId = `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        backupResults.push({
          asset_id: asset.asset_id,
          backup_id: backupId,
          status: 'completed',
          backup_size: Math.floor(Math.random() * 1000) + 100, // MB
          backup_type: 'snapshot'
        });
        
        // Create backup job record
        await this.supabase
          .from('backup_jobs')
          .insert({
            team_id: teamId,
            name: `${asset.asset_name} Backup`,
            backup_type: 'cloud_snapshot',
            source_path: asset.asset_id,
            destination: `${provider.name.toLowerCase()}://backups/${backupId}`,
            status: 'completed',
            last_run: new Date().toISOString(),
            metadata: {
              asset_id: asset.asset_id,
              provider_id: provider.id,
              backup_id: backupId,
              created_via: 'cloud_orchestration'
            }
          });
          
      } catch (assetError) {
        console.error(`Failed to backup asset ${asset.asset_id}:`, assetError);
        backupResults.push({
          asset_id: asset.asset_id,
          status: 'failed',
          error: assetError.message
        });
      }
    }

    return {
      total_assets: assets?.length || 0,
      successful_backups: backupResults.filter(r => r.status === 'completed').length,
      failed_backups: backupResults.filter(r => r.status === 'failed').length,
      backup_results: backupResults,
      provider: provider.name,
      timestamp: new Date().toISOString()
    };
  }

  private async updateExecutionStatus(executionId: string, status: string, errorMessage?: string, resultData?: any): Promise<void> {
    const { error } = await this.supabase.rpc('update_execution_status', {
      p_execution_id: executionId,
      p_status: status,
      p_error_message: errorMessage,
      p_result_data: resultData
    });

    if (error) {
      console.error('Failed to update execution status:', error);
    }
  }

  private async sendNotification(teamId: string, type: 'success' | 'failure', message: string, metadata: any): Promise<void> {
    try {
      // Get active notification transports for the team
      const { data: transports } = await this.supabase
        .from('notification_transports')
        .select('*')
        .eq('team_id', teamId)
        .eq('is_active', true);

      if (transports && transports.length > 0) {
        for (const transport of transports) {
          await this.supabase
            .from('notifications')
            .insert({
              team_id: teamId,
              transport_id: transport.id,
              event_type: `cloud_orchestration_${type}`,
              payload: {
                message,
                metadata,
                timestamp: new Date().toISOString()
              }
            });
        }
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const orchestrator = new CloudOrchestrator(supabaseUrl, supabaseServiceKey);
    
    if (req.method === 'POST') {
      // Direct API call to trigger orchestration
      const body = await req.json();
      const { task_type, team_id, provider_id } = body;
      
      if (!task_type || !team_id || !provider_id) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameters: task_type, team_id, provider_id' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      // Create execution record
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: execution, error } = await supabase
        .from('backup_executions')
        .insert({
          team_id,
          provider_id,
          task_type,
          triggered_by: '00000000-0000-0000-0000-000000000000' // System trigger
        })
        .select()
        .single();
        
      if (error) {
        return new Response(
          JSON.stringify({ error: `Failed to create execution: ${error.message}` }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      // Process the task
      const task: OrchestrationTask = {
        execution_id: execution.id,
        task_type,
        team_id,
        provider_id
      };
      
      // Process in background
      orchestrator.processTask(task).catch(console.error);
      
      return new Response(
        JSON.stringify({ 
          message: 'Task started successfully',
          execution_id: execution.id
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
    
  } catch (error) {
    console.error('Cloud orchestration error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

serve(handler);