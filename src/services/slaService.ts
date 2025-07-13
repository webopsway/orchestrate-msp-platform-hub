import { supabase } from '@/integrations/supabase/client';
import { SLAPolicy, CreateSLAPolicyData, UpdateSLAPolicyData, SLAPolicyFilters } from '@/types/sla';

export class SLAService {
  /**
   * Récupère toutes les politiques SLA pour une équipe
   */
  static async getAll(teamId?: string): Promise<SLAPolicy[]> {
    let query = supabase
      .from('itsm_sla_policies')
      .select('*')
      .order('created_at', { ascending: false });

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (data || []) as SLAPolicy[];
  }

  /**
   * Récupère une politique SLA par son ID
   */
  static async getById(id: string): Promise<SLAPolicy | null> {
    const { data, error } = await supabase
      .from('itsm_sla_policies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data as SLAPolicy;
  }

  /**
   * Crée une nouvelle politique SLA
   */
  static async create(policyData: CreateSLAPolicyData, teamId?: string): Promise<SLAPolicy> {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    // Récupérer le team_id si non fourni
    let currentTeamId = teamId;
    if (!currentTeamId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('default_team_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.default_team_id) {
        throw new Error('Aucune équipe définie pour cet utilisateur');
      }
      currentTeamId = profile.default_team_id;
    }

    const { data, error } = await supabase
      .from('itsm_sla_policies')
      .insert({
        ...policyData,
        team_id: currentTeamId,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as SLAPolicy;
  }

  /**
   * Met à jour une politique SLA
   */
  static async update(id: string, updates: UpdateSLAPolicyData): Promise<SLAPolicy> {
    const { data, error } = await supabase
      .from('itsm_sla_policies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as SLAPolicy;
  }

  /**
   * Supprime une politique SLA après vérification
   */
  static async delete(id: string): Promise<void> {
    // Vérifier si la politique est utilisée dans des trackings SLA
    const { data: trackings, error: trackingError } = await supabase
      .from('itsm_sla_tracking')
      .select('id')
      .eq('sla_policy_id', id)
      .limit(1);

    if (trackingError) {
      throw trackingError;
    }

    if (trackings && trackings.length > 0) {
      throw new Error('Cette politique SLA ne peut pas être supprimée car elle est utilisée dans des suivis SLA actifs.');
    }

    const { error } = await supabase
      .from('itsm_sla_policies')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  /**
   * Filtre les politiques SLA selon des critères
   */
  static async getFiltered(filters: SLAPolicyFilters, teamId?: string): Promise<SLAPolicy[]> {
    let query = supabase
      .from('itsm_sla_policies')
      .select('*')
      .order('created_at', { ascending: false });

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    if (filters.client_type) {
      query = query.eq('client_type', filters.client_type);
    }

    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters.client_organization_id) {
      query = query.eq('client_organization_id', filters.client_organization_id);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return (data || []) as SLAPolicy[];
  }

  /**
   * Trouve la politique SLA applicable pour un ticket donné
   */
  static async findApplicablePolicy(
    priority: string,
    clientType: 'direct' | 'via_esn',
    clientOrganizationId?: string,
    ticketCategory?: string,
    teamId?: string
  ): Promise<SLAPolicy | null> {
    let query = supabase
      .from('itsm_sla_policies')
      .select('*')
      .eq('is_active', true)
      .eq('priority', priority)
      .order('created_at', { ascending: false });

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    // Filtrer par type de client
    query = query.or(`client_type.eq.${clientType},client_type.eq.all`);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const policies = data as SLAPolicy[];

    // Logique de priorité pour trouver la politique la plus spécifique
    // 1. Client spécifique + catégorie spécifique
    // 2. Client spécifique + toutes catégories
    // 3. Tous clients + catégorie spécifique
    // 4. Tous clients + toutes catégories

    if (clientOrganizationId && ticketCategory) {
      const specificPolicy = policies.find(p => 
        p.client_organization_id === clientOrganizationId && 
        p.ticket_category === ticketCategory
      );
      if (specificPolicy) return specificPolicy;
    }

    if (clientOrganizationId) {
      const clientPolicy = policies.find(p => 
        p.client_organization_id === clientOrganizationId && 
        !p.ticket_category
      );
      if (clientPolicy) return clientPolicy;
    }

    if (ticketCategory) {
      const categoryPolicy = policies.find(p => 
        !p.client_organization_id && 
        p.ticket_category === ticketCategory
      );
      if (categoryPolicy) return categoryPolicy;
    }

    // Politique générale
    const generalPolicy = policies.find(p => 
      !p.client_organization_id && 
      !p.ticket_category
    );

    return generalPolicy || null;
  }
}