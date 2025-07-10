import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { organization_id, team_id } = await req.json();

    console.log(`Initializing session for user ${user.id} with org: ${organization_id}, team: ${team_id}`);

    // Get user profile to check MSP admin status
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_msp_admin, default_organization_id, default_team_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use provided IDs or fall back to defaults
    const finalOrgId = organization_id || profile.default_organization_id;
    const finalTeamId = team_id || profile.default_team_id;

    // Verify user has access to the organization
    if (finalOrgId && !profile.is_msp_admin) {
      const { data: membership } = await supabaseClient
        .from('organization_memberships')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', finalOrgId)
        .single();

      if (!membership) {
        return new Response(
          JSON.stringify({ error: 'Access denied to organization' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Verify user has access to the team
    if (finalTeamId && !profile.is_msp_admin) {
      const { data: teamMembership } = await supabaseClient
        .from('team_memberships')
        .select('id')
        .eq('user_id', user.id)
        .eq('team_id', finalTeamId)
        .single();

      if (!teamMembership) {
        return new Response(
          JSON.stringify({ error: 'Access denied to team' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Initialize session with PostgreSQL session variables
    const { data: sessionData, error: sessionError } = await supabaseClient.rpc('initialize_user_session', {
      p_organization_id: finalOrgId,
      p_team_id: finalTeamId
    });

    if (sessionError) {
      console.error('Session initialization error:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to initialize session', details: sessionError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sessionResult = sessionData?.[0];
    
    if (!sessionResult?.success) {
      return new Response(
        JSON.stringify({ error: 'Session initialization failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Test that session variables are properly set
    const { data: testData } = await supabaseClient.rpc('test_session_variables');
    const sessionVars = testData?.[0];

    console.log('PostgreSQL session variables test:', sessionVars);

    const response = {
      success: true,
      user_id: sessionResult.user_id,
      session_context: {
        current_organization_id: sessionResult.organization_id,
        current_team_id: sessionResult.team_id,
        is_msp: sessionResult.is_msp
      },
      postgresql_session: {
        app_current_team: sessionVars?.current_team_var,
        app_is_msp: sessionVars?.is_msp_var,
        parsed_team: sessionVars?.parsed_team,
        parsed_is_msp: sessionVars?.parsed_is_msp
      }
    };

    console.log('Session initialized successfully:', response);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});