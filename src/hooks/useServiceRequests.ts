import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type ServiceRequest = Database['public']['Tables']['itsm_service_requests']['Row'];
type ServiceRequestInsert = Database['public']['Tables']['itsm_service_requests']['Insert'];
type ServiceRequestUpdate = Database['public']['Tables']['itsm_service_requests']['Update'];

export interface ServiceRequestWithProfile extends ServiceRequest {
  requested_by_profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  assigned_to_profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

export const useServiceRequests = () => {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequestWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchServiceRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('itsm_service_requests')
        .select(`
          *,
          requested_by_profile:profiles!itsm_service_requests_requested_by_fkey(first_name, last_name, email),
          assigned_to_profile:profiles!itsm_service_requests_assigned_to_fkey(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServiceRequests(data || []);
    } catch (err) {
      console.error('Error fetching service requests:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createServiceRequest = async (data: ServiceRequestInsert) => {
    try {
      const { data: newRequest, error } = await supabase
        .from('itsm_service_requests')
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Demande de service créée avec succès",
      });

      await fetchServiceRequests();
      return newRequest;
    } catch (err) {
      console.error('Error creating service request:', err);
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de la demande de service",
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateServiceRequest = async (id: string, data: ServiceRequestUpdate) => {
    try {
      const { data: updatedRequest, error } = await supabase
        .from('itsm_service_requests')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Demande de service mise à jour avec succès",
      });

      await fetchServiceRequests();
      return updatedRequest;
    } catch (err) {
      console.error('Error updating service request:', err);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour de la demande de service",
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteServiceRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('itsm_service_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Demande de service supprimée avec succès",
      });

      await fetchServiceRequests();
    } catch (err) {
      console.error('Error deleting service request:', err);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de la demande de service",
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchServiceRequests();
  }, []);

  return {
    serviceRequests,
    loading,
    error,
    createServiceRequest,
    updateServiceRequest,
    deleteServiceRequest,
    refetch: fetchServiceRequests
  };
};