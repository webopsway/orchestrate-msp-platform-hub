import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UptimeKumaWebhook {
  type: string;
  monitor: {
    id: number;
    name: string;
    url: string;
  };
  status: number;
  responseTime?: number;
  statusCode?: number;
  timestamp: string;
}

interface GrafanaWebhook {
  alerts: Array<{
    status: string;
    labels: {
      alertname: string;
      instance?: string;
    };
    annotations: {
      summary?: string;
      description?: string;
    };
    startsAt: string;
    endsAt?: string;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const path = url.pathname;

    if (req.method === 'POST' && path === '/monitoring-integrations/uptime-kuma') {
      const webhook: UptimeKumaWebhook = await req.json();
      
      // Extract team_id from headers or query params (should be configured in Uptime Kuma)
      const teamId = req.headers.get('x-team-id') || url.searchParams.get('team_id');
      
      if (!teamId) {
        return new Response(JSON.stringify({ error: 'Team ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update or create uptime check
      const { error: upsertError } = await supabase
        .from('uptime_checks')
        .upsert({
          team_id: teamId,
          name: webhook.monitor.name,
          url: webhook.monitor.url,
          status: webhook.status === 1 ? 'up' : 'down',
          response_time: webhook.responseTime,
          status_code: webhook.statusCode,
          checked_at: new Date(webhook.timestamp).toISOString(),
          metadata: { uptime_kuma_id: webhook.monitor.id }
        }, {
          onConflict: 'team_id,name'
        });

      if (upsertError) {
        console.error('Error upserting uptime check:', upsertError);
        return new Response(JSON.stringify({ error: 'Database error' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'POST' && path === '/monitoring-integrations/grafana') {
      const webhook: GrafanaWebhook = await req.json();
      
      const teamId = req.headers.get('x-team-id') || url.searchParams.get('team_id');
      
      if (!teamId) {
        return new Response(JSON.stringify({ error: 'Team ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Process Grafana alerts
      for (const alert of webhook.alerts) {
        const severity = alert.status === 'firing' ? 'high' : 'low';
        
        const { error: alertError } = await supabase
          .from('monitoring_alerts')
          .insert({
            team_id: teamId,
            alert_name: alert.labels.alertname,
            alert_type: 'grafana',
            severity,
            message: alert.annotations.summary || alert.annotations.description || 'Grafana alert',
            status: alert.status === 'firing' ? 'active' : 'resolved',
            triggered_at: new Date(alert.startsAt).toISOString(),
            resolved_at: alert.endsAt ? new Date(alert.endsAt).toISOString() : null,
            metadata: {
              labels: alert.labels,
              annotations: alert.annotations,
              source: 'grafana'
            }
          });

        if (alertError) {
          console.error('Error creating alert:', alertError);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'GET' && path === '/monitoring-integrations/health') {
      return new Response(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle uptime check execution
    if (req.method === 'POST' && path === '/monitoring-integrations/check') {
      const { uptime_check_id } = await req.json();
      
      if (!uptime_check_id) {
        return new Response(JSON.stringify({ error: 'Uptime check ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get uptime check details
      const { data: uptimeCheck, error: fetchError } = await supabase
        .from('uptime_checks')
        .select('*')
        .eq('id', uptime_check_id)
        .single();

      if (fetchError || !uptimeCheck) {
        return new Response(JSON.stringify({ error: 'Uptime check not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Perform the uptime check
      const startTime = Date.now();
      let status = 'down';
      let responseTime = 0;
      let statusCode = 0;

      try {
        const response = await fetch(uptimeCheck.url, {
          method: uptimeCheck.method,
          signal: AbortSignal.timeout(uptimeCheck.timeout_seconds * 1000)
        });
        
        responseTime = Date.now() - startTime;
        statusCode = response.status;
        
        if (uptimeCheck.expected_status_codes.includes(statusCode)) {
          status = 'up';
        }
      } catch (error) {
        console.error('Uptime check failed:', error);
        responseTime = Date.now() - startTime;
      }

      // Update the uptime check
      const { error: updateError } = await supabase
        .from('uptime_checks')
        .update({
          status,
          response_time: responseTime,
          status_code: statusCode,
          checked_at: new Date().toISOString(),
          next_check: new Date(Date.now() + uptimeCheck.check_interval * 1000).toISOString()
        })
        .eq('id', uptime_check_id);

      if (updateError) {
        console.error('Error updating uptime check:', updateError);
        return new Response(JSON.stringify({ error: 'Update failed' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        status, 
        response_time: responseTime,
        status_code: statusCode 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not Found', { 
      status: 404,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});