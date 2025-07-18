import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeploymentDiscovery {
  application_name: string;
  cloud_asset_id: string;
  environment_name: string;
  deployment_type: string;
  status: string;
  version?: string;
  health_check_url?: string;
  metadata: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { team_id, provider_type = 'all' } = await req.json();

    if (!team_id) {
      throw new Error('team_id is required');
    }

    console.log(`Starting deployment discovery for team ${team_id}`);

    // Récupérer les credentials cloud pour cette équipe
    const { data: credentials, error: credError } = await supabaseClient
      .from('cloud_credentials')
      .select(`
        *,
        cloud_providers(name, api_endpoint)
      `)
      .eq('team_id', team_id);

    if (credError) {
      throw new Error(`Failed to fetch credentials: ${credError.message}`);
    }

    if (!credentials || credentials.length === 0) {
      throw new Error('No cloud credentials found for this team');
    }

    const discoveries: DeploymentDiscovery[] = [];

    // Découvrir les déploiements par provider
    for (const cred of credentials) {
      const providerName = cred.cloud_providers?.name;
      
      if (provider_type !== 'all' && providerName !== provider_type) {
        continue;
      }

      console.log(`Discovering deployments for provider: ${providerName}`);

      try {
        let providerDiscoveries: DeploymentDiscovery[] = [];

        switch (providerName) {
          case 'aws':
            providerDiscoveries = await discoverAWSDeployments(cred.config);
            break;
          case 'azure':
            providerDiscoveries = await discoverAzureDeployments(cred.config);
            break;
          case 'gcp':
            providerDiscoveries = await discoverGCPDeployments(cred.config);
            break;
          case 'docker':
            providerDiscoveries = await discoverDockerDeployments(cred.config);
            break;
          default:
            console.log(`Provider ${providerName} not supported yet`);
        }

        discoveries.push(...providerDiscoveries);
      } catch (error) {
        console.error(`Error discovering deployments for ${providerName}:`, error);
      }
    }

    console.log(`Found ${discoveries.length} deployment discoveries`);

    // Synchroniser avec la base de données
    const syncResults = await syncDeploymentsToDatabase(supabaseClient, discoveries, team_id);

    return new Response(
      JSON.stringify({
        success: true,
        discoveries_count: discoveries.length,
        sync_results: syncResults,
        message: `Synchronized ${discoveries.length} deployments`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in sync-deployments:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

// Découverte AWS (EC2, ECS, Lambda, etc.)
async function discoverAWSDeployments(config: any): Promise<DeploymentDiscovery[]> {
  const discoveries: DeploymentDiscovery[] = [];
  
  // Simuler la découverte AWS
  // En réalité, vous utiliseriez AWS SDK
  console.log('AWS Discovery - Config:', JSON.stringify(config, null, 2));
  
  // Exemple de découverte EC2
  try {
    // Ici vous appelleriez AWS SDK pour lister les instances EC2
    // const ec2 = new AWS.EC2({ region: config.region, credentials: config.credentials });
    // const instances = await ec2.describeInstances().promise();
    
    // Pour la démo, on simule
    const mockInstances = [
      {
        instanceId: 'i-1234567890',
        tags: [
          { Key: 'Application', Value: 'web-app' },
          { Key: 'Environment', Value: 'production' }
        ],
        state: 'running',
        instanceType: 't3.medium'
      }
    ];

    for (const instance of mockInstances) {
      const appTag = instance.tags.find(tag => tag.Key === 'Application');
      const envTag = instance.tags.find(tag => tag.Key === 'Environment');
      
      if (appTag && envTag) {
        discoveries.push({
          application_name: appTag.Value,
          cloud_asset_id: instance.instanceId,
          environment_name: envTag.Value,
          deployment_type: envTag.Value === 'production' ? 'production' : 'development',
          status: instance.state === 'running' ? 'running' : 'stopped',
          metadata: {
            provider: 'aws',
            instance_type: instance.instanceType,
            discovered_at: new Date().toISOString()
          }
        });
      }
    }
  } catch (error) {
    console.error('AWS discovery error:', error);
  }

  return discoveries;
}

// Découverte Azure
async function discoverAzureDeployments(config: any): Promise<DeploymentDiscovery[]> {
  console.log('Azure Discovery - Config:', JSON.stringify(config, null, 2));
  // Implémentation Azure
  return [];
}

// Découverte GCP
async function discoverGCPDeployments(config: any): Promise<DeploymentDiscovery[]> {
  console.log('GCP Discovery - Config:', JSON.stringify(config, null, 2));
  // Implémentation GCP
  return [];
}

// Découverte Docker (via API Docker)
async function discoverDockerDeployments(config: any): Promise<DeploymentDiscovery[]> {
  const discoveries: DeploymentDiscovery[] = [];
  
  try {
    console.log('Docker Discovery - Config:', JSON.stringify(config, null, 2));
    
    // Appel à l'API Docker
    const dockerUrl = config.docker_url || 'http://localhost:2376';
    const response = await fetch(`${dockerUrl}/containers/json`, {
      headers: config.headers || {}
    });
    
    if (!response.ok) {
      throw new Error(`Docker API error: ${response.status}`);
    }
    
    const containers = await response.json();
    
    for (const container of containers) {
      const labels = container.Labels || {};
      const appName = labels['app.name'] || labels['com.docker.compose.service'] || container.Names[0]?.replace('/', '');
      const environment = labels['app.environment'] || 'development';
      
      if (appName) {
        discoveries.push({
          application_name: appName,
          cloud_asset_id: container.Id,
          environment_name: environment,
          deployment_type: environment === 'production' ? 'production' : 'development',
          status: container.State === 'running' ? 'running' : 'stopped',
          metadata: {
            provider: 'docker',
            image: container.Image,
            ports: container.Ports,
            created: container.Created,
            discovered_at: new Date().toISOString()
          }
        });
      }
    }
  } catch (error) {
    console.error('Docker discovery error:', error);
  }

  return discoveries;
}

// Synchroniser les découvertes avec la base de données
async function syncDeploymentsToDatabase(
  supabaseClient: any,
  discoveries: DeploymentDiscovery[],
  teamId: string
) {
  const results = {
    created: 0,
    updated: 0,
    errors: 0
  };

  for (const discovery of discoveries) {
    try {
      // Chercher l'application par nom
      const { data: applications } = await supabaseClient
        .from('applications')
        .select('id')
        .eq('name', discovery.application_name)
        .eq('team_id', teamId)
        .limit(1);

      if (!applications || applications.length === 0) {
        console.log(`Application "${discovery.application_name}" not found, skipping`);
        continue;
      }

      const applicationId = applications[0].id;

      // Chercher l'asset cloud (ou le créer)
      let { data: cloudAssets } = await supabaseClient
        .from('cloud_asset')
        .select('id')
        .eq('asset_id', discovery.cloud_asset_id)
        .eq('team_id', teamId)
        .limit(1);

      let cloudAssetId: string;

      if (!cloudAssets || cloudAssets.length === 0) {
        // Créer l'asset cloud
        const { data: newAsset, error: assetError } = await supabaseClient
          .from('cloud_asset')
          .insert({
            asset_id: discovery.cloud_asset_id,
            asset_name: discovery.application_name,
            asset_type: 'container',
            team_id: teamId,
            metadata: discovery.metadata
          })
          .select('id')
          .single();

        if (assetError) {
          console.error('Error creating cloud asset:', assetError);
          results.errors++;
          continue;
        }

        cloudAssetId = newAsset.id;
      } else {
        cloudAssetId = cloudAssets[0].id;
      }

      // Vérifier si le déploiement existe déjà
      const { data: existingDeployment } = await supabaseClient
        .from('application_deployments')
        .select('id')
        .eq('application_id', applicationId)
        .eq('cloud_asset_id', cloudAssetId)
        .eq('environment_name', discovery.environment_name)
        .limit(1);

      if (existingDeployment && existingDeployment.length > 0) {
        // Mettre à jour
        const { error: updateError } = await supabaseClient
          .from('application_deployments')
          .update({
            status: discovery.status,
            version: discovery.version,
            health_check_url: discovery.health_check_url,
            metadata: discovery.metadata
          })
          .eq('id', existingDeployment[0].id);

        if (updateError) {
          console.error('Error updating deployment:', updateError);
          results.errors++;
        } else {
          results.updated++;
        }
      } else {
        // Créer nouveau déploiement
        const { error: insertError } = await supabaseClient
          .from('application_deployments')
          .insert({
            application_id: applicationId,
            cloud_asset_id: cloudAssetId,
            environment_name: discovery.environment_name,
            deployment_type: discovery.deployment_type,
            status: discovery.status,
            version: discovery.version,
            health_check_url: discovery.health_check_url,
            deployment_date: new Date().toISOString(),
            metadata: discovery.metadata,
            team_id: teamId,
            deployed_by: 'system'
          });

        if (insertError) {
          console.error('Error creating deployment:', insertError);
          results.errors++;
        } else {
          results.created++;
        }
      }
    } catch (error) {
      console.error('Error processing discovery:', error);
      results.errors++;
    }
  }

  return results;
}