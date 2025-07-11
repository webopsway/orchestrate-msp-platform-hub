import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Organization, OrganizationFormData } from "@/types/organization";

export class OrganizationService {
  static async loadAll(sessionContext: any): Promise<{ organizations: Organization[]; count: number }> {
    console.log('Loading organizations with session context:', sessionContext);
    
    // Récupérer toutes les organisations pour un admin MSP
    const { data: orgsData, error: orgsError, count } = await supabase
      .from('organizations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (orgsError) {
      console.error('Error loading organizations:', orgsError);
      throw orgsError;
    }
    
    // Transform data to match interface
    const transformedOrgs: Organization[] = (orgsData || []).map(org => ({
      id: org.id,
      msp_id: org.parent_organization_id || sessionContext?.current_team_id || null,
      name: org.name,
      type: org.type,
      is_msp: org.is_msp || false,
      status: 'active' as const,
      user_count: 0,
      team_count: 0,
      created_at: org.created_at,
      updated_at: org.updated_at || org.created_at,
      description: (org.metadata as any)?.description || '',
      website: (org.metadata as any)?.website || '',
      email: (org.metadata as any)?.email || '',
      phone: (org.metadata as any)?.phone || '',
      address: (org.metadata as any)?.address || {},
      subscription_plan: (org.metadata as any)?.subscription_plan || 'basic',
      subscription_status: (org.metadata as any)?.subscription_status || 'active',
      metadata: (org.metadata as any) || {}
    }));
    
    return { organizations: transformedOrgs, count: count || 0 };
  }

  static async create(data: OrganizationFormData): Promise<void> {
    const orgData = {
      name: data.name,
      type: data.type || 'client',
      is_msp: data.is_msp || false,
      metadata: {
        description: data.description,
        website: data.website,
        email: data.email,
        phone: data.phone,
        address: {
          street: data.street,
          city: data.city,
          state: data.state,
          postal_code: data.postal_code,
          country: data.country
        },
        subscription_plan: data.subscription_plan || 'basic',
        subscription_status: 'active',
        industry: data.industry,
        size: data.size,
        contact_person: data.contact_person
      }
    };
    
    const { error } = await supabase
      .from('organizations')
      .insert([orgData]);

    if (error) throw error;

    toast.success('Organisation créée avec succès');
  }

  static async update(id: string, data: OrganizationFormData): Promise<void> {
    const updateData = {
      name: data.name,
      updated_at: new Date().toISOString(),
      metadata: {
        description: data.description,
        website: data.website,
        email: data.email,
        phone: data.phone,
        address: {
          street: data.street,
          city: data.city,
          state: data.state,
          postal_code: data.postal_code,
          country: data.country
        },
        subscription_plan: data.subscription_plan,
        industry: data.industry,
        size: data.size,
        contact_person: data.contact_person
      }
    };

    const { error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    toast.success('Organisation mise à jour avec succès');
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) throw error;

    toast.success('Organisation supprimée');
  }
}