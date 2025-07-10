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

    const url = new URL(req.url);
    const method = req.method;
    const action = url.searchParams.get('action');

    // Check if user has permission to manage roles
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('is_msp_admin')
      .eq('id', user.id)
      .single();

    const isMspAdmin = profile?.is_msp_admin || false;

    switch (method) {
      case 'GET':
        // Si aucune action spécifiée, retourner toutes les données
        if (!action) {
          return await handleGetAllData(supabaseClient, user.id, isMspAdmin);
        }
        return await handleGetRequest(supabaseClient, action, user.id, isMspAdmin);
      case 'POST':
        return await handlePostRequest(supabaseClient, req, user.id, isMspAdmin);
      case 'DELETE':
        return await handleDeleteRequest(supabaseClient, req, user.id, isMspAdmin);
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleGetAllData(supabaseClient: any, userId: string, isMspAdmin: boolean) {
  try {
    // Fetch all data in parallel
    const [rolesResult, permissionsResult, userRolesResult, rolePermissionsResult] = await Promise.all([
      supabaseClient.from('roles').select('*').order('display_name'),
      supabaseClient.from('permissions').select('*').order('resource, action'),
      getFilteredUserRoles(supabaseClient, userId, isMspAdmin),
      supabaseClient.from('role_permissions').select(`
        role_id,
        permission:permissions(*)
      `)
    ]);

    if (rolesResult.error) throw rolesResult.error;
    if (permissionsResult.error) throw permissionsResult.error;
    if (userRolesResult.error) throw userRolesResult.error;
    if (rolePermissionsResult.error) throw rolePermissionsResult.error;

    // Group permissions by resource
    const groupedPermissions = permissionsResult.data?.reduce((acc: any, perm: any) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push(perm);
      return acc;
    }, {});

    // Group role permissions by role_id
    const rolePermissionMap = rolePermissionsResult.data?.reduce((acc: any, rp: any) => {
      if (!acc[rp.role_id]) {
        acc[rp.role_id] = [];
      }
      acc[rp.role_id].push(rp.permission);
      return acc;
    }, {});

    return new Response(
      JSON.stringify({
        roles: rolesResult.data,
        permissions: groupedPermissions,
        userRoles: userRolesResult.data,
        rolePermissions: rolePermissionMap
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get all data error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getFilteredUserRoles(supabaseClient: any, userId: string, isMspAdmin: boolean) {
  let userRolesQuery = supabaseClient
    .from('user_roles')
    .select(`
      *,
      role:roles(*),
      user:profiles(id, email, first_name, last_name),
      team:teams(id, name),
      organization:organizations(id, name)
    `)
    .eq('is_active', true);
  
  // If not MSP admin, only show roles user can see
  if (!isMspAdmin) {
    userRolesQuery = userRolesQuery.eq('user_id', userId);
  }
  
  return await userRolesQuery;
}

async function handleGetRequest(supabaseClient: any, action: string | null, userId: string, isMspAdmin: boolean) {
  try {
    switch (action) {
      case 'roles':
        // Get all available roles
        const { data: roles, error: rolesError } = await supabaseClient
          .from('roles')
          .select('*')
          .order('display_name');
        
        if (rolesError) throw rolesError;
        
        return new Response(
          JSON.stringify({ roles }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'permissions':
        // Get all permissions grouped by resource
        const { data: permissions, error: permissionsError } = await supabaseClient
          .from('permissions')
          .select('*')
          .order('resource, action');
        
        if (permissionsError) throw permissionsError;
        
        // Group permissions by resource
        const groupedPermissions = permissions?.reduce((acc: any, perm: any) => {
          if (!acc[perm.resource]) {
            acc[perm.resource] = [];
          }
          acc[perm.resource].push(perm);
          return acc;
        }, {});
        
        return new Response(
          JSON.stringify({ permissions: groupedPermissions }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'user-roles':
        // Get user roles (filtered by permissions)
        const userRolesResult = await getFilteredUserRoles(supabaseClient, userId, isMspAdmin);
        
        if (userRolesResult.error) throw userRolesResult.error;
        
        return new Response(
          JSON.stringify({ userRoles: userRolesResult.data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'role-permissions':
        // Get role permissions mapping
        const { data: rolePermissions, error: rolePermError } = await supabaseClient
          .from('role_permissions')
          .select(`
            role_id,
            permission:permissions(*)
          `);
        
        if (rolePermError) throw rolePermError;
        
        // Group by role_id
        const rolePermissionMap = rolePermissions?.reduce((acc: any, rp: any) => {
          if (!acc[rp.role_id]) {
            acc[rp.role_id] = [];
          }
          acc[rp.role_id].push(rp.permission);
          return acc;
        }, {});
        
        return new Response(
          JSON.stringify({ rolePermissions: rolePermissionMap }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('GET request error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handlePostRequest(supabaseClient: any, req: Request, userId: string, isMspAdmin: boolean) {
  try {
    const body = await req.json();
    const { action, targetUserId, roleId, teamId, organizationId, expiresAt } = body;

    if (!isMspAdmin) {
      // Check if user has permission to assign roles in this context
      if (organizationId) {
        const { data: orgMember } = await supabaseClient
          .from('organization_memberships')
          .select('role')
          .eq('user_id', userId)
          .eq('organization_id', organizationId)
          .single();

        if (!orgMember || !['admin', 'manager'].includes(orgMember.role)) {
          return new Response(
            JSON.stringify({ error: 'Insufficient permissions for this organization' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      if (teamId) {
        const { data: teamMember } = await supabaseClient
          .from('team_memberships')
          .select('role')
          .eq('user_id', userId)
          .eq('team_id', teamId)
          .single();

        if (!teamMember || !['admin', 'owner'].includes(teamMember.role)) {
          return new Response(
            JSON.stringify({ error: 'Insufficient permissions for this team' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    if (action === 'assign-role') {
      // Assign role to user
      const { data: userRole, error: assignError } = await supabaseClient
        .from('user_roles')
        .insert({
          user_id: targetUserId,
          role_id: roleId,
          team_id: teamId || null,
          organization_id: organizationId || null,
          granted_by: userId,
          expires_at: expiresAt || null,
          is_active: true
        })
        .select(`
          *,
          role:roles(*),
          user:profiles(id, email, first_name, last_name),
          team:teams(id, name),
          organization:organizations(id, name)
        `)
        .single();

      if (assignError) {
        console.error('Role assignment error:', assignError);
        return new Response(
          JSON.stringify({ error: 'Failed to assign role: ' + assignError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Role assigned: User ${targetUserId} given role ${roleId} by ${userId}`);

      return new Response(
        JSON.stringify({ success: true, userRole }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('POST request error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleDeleteRequest(supabaseClient: any, req: Request, userId: string, isMspAdmin: boolean) {
  try {
    const body = await req.json();
    const { userRoleId } = body;

    // Get the user role to check permissions
    const { data: userRole, error: getUserRoleError } = await supabaseClient
      .from('user_roles')
      .select('*')
      .eq('id', userRoleId)
      .single();

    if (getUserRoleError || !userRole) {
      return new Response(
        JSON.stringify({ error: 'User role not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isMspAdmin) {
      // Check permissions for non-MSP admins
      if (userRole.organization_id) {
        const { data: orgMember } = await supabaseClient
          .from('organization_memberships')
          .select('role')
          .eq('user_id', userId)
          .eq('organization_id', userRole.organization_id)
          .single();

        if (!orgMember || !['admin', 'manager'].includes(orgMember.role)) {
          return new Response(
            JSON.stringify({ error: 'Insufficient permissions' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Soft delete by setting is_active to false
    const { error: deleteError } = await supabaseClient
      .from('user_roles')
      .update({ is_active: false })
      .eq('id', userRoleId);

    if (deleteError) {
      return new Response(
        JSON.stringify({ error: 'Failed to revoke role: ' + deleteError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Role revoked: User role ${userRoleId} deactivated by ${userId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('DELETE request error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}